"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del, get } from "@vercel/blob";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canUploadCampouts } from "@/lib/permissions";
import { requireString } from "@/lib/form-data";
import { withToast } from "@/lib/toast";
import { parsePdf } from "@/lib/campout-upload/parse-pdf";
import { parseExcel } from "@/lib/campout-upload/parse-excel";
import { extractCampoutsWithClaude } from "@/lib/campout-upload/extract-with-claude";
import { matchExistingCampout, buildMergePreview } from "@/lib/campout-upload/match";
import { MAX_FILE_BYTES } from "@/lib/campout-upload/constants";
import type { UploadCandidate, UploadCandidateEdit, ParsedSection } from "@/lib/campout-upload/types";

const MAX_PDF_PAGES = 30;
const MAX_EXCEL_SHEETS = 30;

// REQ-30 Data Model Impact #5: no cron job exists in this app -- a pending
// batch nobody ever confirmed or discarded is cleaned up lazily, the next
// time anyone starts a new upload, rather than on a schedule.
const BATCH_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// ADR 0032: a real Vercel Blob URL always has one of these two hostname
// shapes (private store vs. public store -- this app uses a private one,
// see the ADR, but both are accepted defensively). The client picks
// `blobUrl` and hands it to this public Server Action, so it's validated
// the same defense-in-depth way every other action in this app validates
// client-supplied values -- without this, the action would read whatever
// URL it's given via the Blob SDK, an SSRF-shaped risk.
function isOwnBlobUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname.endsWith(".private.blob.vercel-storage.com") || hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

async function safeDeleteBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    // Best-effort cleanup only -- the blob is transient transport (ADR
    // 0032), not a feature in its own right; a failed delete here should
    // never surface to the ASPL or block the upload.
  }
}

export type UploadFormState = { error: string | null };

// ADR 0032: the ASPL's browser uploads the file directly to Vercel Blob
// (client-side, via components/CampoutUploadForm.tsx) before this action
// ever runs -- a real file can exceed Vercel Functions' hard,
// unconfigurable 4.5MB request-body limit, which has nothing to do with
// this app's own MAX_FILE_BYTES or next.config.ts's bodySizeLimit. This
// action receives only `blobUrl`/`fileName`, fetches the bytes itself
// (no body-size limit on an outbound fetch from a function), and deletes
// the blob once it has them -- Blob storage here is transient upload
// transport only, not a persistent store (ADR 0031's "no blob storage for
// thumbnails" decision is unrelated and unchanged).
export async function uploadCampoutFile(
  _prevState: UploadFormState,
  formData: FormData
): Promise<UploadFormState> {
  const actor = await getActor();
  if (!canUploadCampouts(actor)) {
    throw new Error("Only the ASPL of Camping can upload campouts.");
  }

  const blobUrl = requireString(formData, "blobUrl");
  const fileName = requireString(formData, "fileName");

  if (!isOwnBlobUrl(blobUrl)) {
    return { error: "Invalid upload. Please try again." };
  }

  const isPdf = /\.pdf$/i.test(fileName);
  const isExcel = /\.(xlsx|xls)$/i.test(fileName);
  if (!isPdf && !isExcel) {
    await safeDeleteBlob(blobUrl);
    return { error: "Only PDF (.pdf) or Excel (.xlsx/.xls) files are supported." };
  }

  try {
    return await processUpload(blobUrl, fileName, isPdf);
  } finally {
    await safeDeleteBlob(blobUrl);
  }
}

async function processUpload(blobUrl: string, fileName: string, isPdf: boolean): Promise<UploadFormState> {
  let bytes: Uint8Array;
  try {
    // ADR 0032: a private blob isn't fetchable by URL alone -- `get()` is
    // the SDK's authenticated reader (OIDC on Vercel, BLOB_READ_WRITE_TOKEN
    // locally), the same pattern Vercel's own private-storage docs show.
    const result = await get(blobUrl, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("blob not found");
    }
    if (result.blob.size > MAX_FILE_BYTES) {
      return {
        error: `This file is too large -- uploads are limited to ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB.`,
      };
    }
    const buf = await new Response(result.stream).arrayBuffer();
    bytes = new Uint8Array(buf);
  } catch {
    return { error: "Could not read the uploaded file. Please try again." };
  }

  let sections: ParsedSection[];
  try {
    sections = isPdf ? await parsePdf(bytes, MAX_PDF_PAGES) : await parseExcel(bytes, MAX_EXCEL_SHEETS);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not read this file." };
  }

  let rawCampouts;
  try {
    rawCampouts = await extractCampoutsWithClaude(sections);
  } catch {
    // REQ-30: no non-AI fallback for segmentation/extraction (ADR 0031) --
    // a failed call surfaces a clean, actionable error instead of a bad
    // heuristic guess.
    return {
      error:
        "Could not extract campouts from this file right now. Please try again later, or add this campout manually.",
    };
  }

  if (rawCampouts.length === 0) {
    return { error: "No campouts found in this file." };
  }

  const existingCampouts = await db.campout.findMany();
  const imagesBySection = new Map(sections.map((s) => [s.sectionNumber, s.images]));

  const candidates: UploadCandidate[] = rawCampouts.map((raw) => {
    const matched = matchExistingCampout(raw, existingCampouts);
    const merged = buildMergePreview(raw, matched);
    const images = Array.from(new Set(raw.sourceSections.flatMap((n) => imagesBySection.get(n) ?? [])));

    return {
      tempId: crypto.randomUUID(),
      ...merged,
      images,
      selectedImageIndex: images.length > 0 ? 0 : null,
      matchedCampoutId: matched?.id ?? null,
      matchedCampoutName: matched?.name ?? null,
      discarded: false,
    };
  });

  await db.campoutUploadBatch.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - BATCH_MAX_AGE_MS) } } });

  const batch = await db.campoutUploadBatch.create({
    data: { sourceFileName: fileName, candidates },
  });

  redirect(`/campouts/upload/review/${batch.id}`);
}

function isUploadCandidateEdit(value: unknown): value is UploadCandidateEdit {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  const isStringOrNull = (v: unknown) => v === null || typeof v === "string";
  return (
    typeof c.tempId === "string" &&
    isStringOrNull(c.name) &&
    isStringOrNull(c.date) &&
    isStringOrNull(c.endDate) &&
    isStringOrNull(c.location) &&
    isStringOrNull(c.description) &&
    (c.selectedImageIndex === null || typeof c.selectedImageIndex === "number") &&
    typeof c.discarded === "boolean"
  );
}

export type ConfirmUploadFormState = { error: string | null };

// REQ-30.18-30.21: re-validates and commits the ASPL's edited review-screen
// state in one transaction -- every remaining (non-discarded) candidate is
// created or merged together, so a partial failure midway never leaves the
// campout list half-written (REQ-30.20).
//
// ADR 0032: the client submits only its *edits* (UploadCandidateEdit --
// text fields, selected image index, discarded flag), never the
// candidates' `images` data-URL arrays again. The real candidates,
// images included, are re-read here from the CampoutUploadBatch row
// written at upload time and matched back up by tempId -- both to keep
// this action's request body small (several base64 thumbnails could
// otherwise approach Vercel Functions' hard 4.5MB body limit on a
// large/many-campout upload) and because a campout's imageUrl should
// only ever be set from an image this app itself extracted, never from
// whatever bytes a client happens to submit in a public POST.
export async function confirmCampoutUpload(
  _prevState: ConfirmUploadFormState,
  formData: FormData
): Promise<ConfirmUploadFormState> {
  const actor = await getActor();
  if (!canUploadCampouts(actor)) {
    throw new Error("Only the ASPL of Camping can upload campouts.");
  }

  const batchId = requireString(formData, "batchId");
  const editsRaw = requireString(formData, "edits");

  let parsed: unknown;
  try {
    parsed = JSON.parse(editsRaw);
  } catch {
    throw new Error("Could not read the edited upload data.");
  }
  if (!Array.isArray(parsed) || !parsed.every(isUploadCandidateEdit)) {
    throw new Error("Could not read the edited upload data.");
  }
  const edits = parsed;

  const batch = await db.campoutUploadBatch.findUnique({ where: { id: batchId } });
  if (!batch) {
    return { error: "This upload has expired. Please upload the file again." };
  }
  const originalsByTempId = new Map(
    (batch.candidates as unknown as UploadCandidate[]).map((c) => [c.tempId, c])
  );

  type PendingWrite = { matchedCampoutId: string | null; data: Prisma.CampoutCreateInput };
  const toUpload: PendingWrite[] = [];

  for (const edit of edits) {
    if (edit.discarded) continue;
    const original = originalsByTempId.get(edit.tempId);
    if (!original) continue; // not from this batch -- ignore rather than trust a client-supplied id

    // REQ-30.9: enforced here too, not just via the review screen's
    // disabled button -- a Server Action is a public POST endpoint, not
    // only reachable through this form.
    if (!edit.name?.trim() || !edit.date) {
      return {
        error:
          "Every campout needs at least a name and a date before it can be uploaded. Fill in or discard the incomplete one(s).",
      };
    }

    const imageUrl =
      edit.selectedImageIndex !== null && edit.selectedImageIndex >= 0 && edit.selectedImageIndex < original.images.length
        ? original.images[edit.selectedImageIndex]
        : null;

    toUpload.push({
      matchedCampoutId: original.matchedCampoutId,
      data: {
        name: edit.name.trim(),
        date: new Date(edit.date),
        endDate: edit.endDate ? new Date(edit.endDate) : null,
        location: edit.location?.trim() || null,
        description: edit.description?.trim() || null,
        ...(imageUrl ? { imageUrl } : {}),
        lastUploadedFrom: batch.sourceFileName,
        lastUploadedAt: new Date(),
      },
    });
  }

  try {
    await db.$transaction(async (tx) => {
      for (const item of toUpload) {
        if (item.matchedCampoutId) {
          await tx.campout.update({ where: { id: item.matchedCampoutId }, data: item.data });
        } else {
          await tx.campout.create({ data: item.data });
        }
      }

      await tx.campoutUploadBatch.deleteMany({ where: { id: batchId } });
    });
  } catch {
    return { error: "Could not save this upload. Please try again." };
  }

  revalidatePath("/campouts");
  const count = toUpload.length;
  redirect(withToast("/campouts", `Uploaded ${count} campout${count === 1 ? "" : "s"}`));
}

// REQ-30.21: an explicit "Cancel"/"Close" out of the review screen --
// immediately deletes the pending batch rather than leaving it to the
// lazy age-based sweep, since this is a deliberate cancel, not just
// idle abandonment. Nothing was ever written to `Campout` at this
// point, so there's nothing to undo besides the staging row itself.
export async function discardCampoutUpload(formData: FormData): Promise<void> {
  const actor = await getActor();
  if (!canUploadCampouts(actor)) {
    throw new Error("Only the ASPL of Camping can upload campouts.");
  }

  const batchId = requireString(formData, "batchId");
  await db.campoutUploadBatch.deleteMany({ where: { id: batchId } });

  redirect("/campouts");
}
