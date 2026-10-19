"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canImportCampouts } from "@/lib/permissions";
import { requireString } from "@/lib/form-data";
import { withToast } from "@/lib/toast";
import { parsePdf } from "@/lib/campout-import/parse-pdf";
import { parseExcel } from "@/lib/campout-import/parse-excel";
import { extractCampoutsWithClaude } from "@/lib/campout-import/extract-with-claude";
import { matchExistingCampout, buildMergePreview } from "@/lib/campout-import/match";
import { MAX_FILE_BYTES } from "@/lib/campout-import/constants";
import type { ImportCandidate, ImportCandidateEdit, ParsedSection } from "@/lib/campout-import/types";

const MAX_PDF_PAGES = 30;
const MAX_EXCEL_SHEETS = 30;

// REQ-30 Data Model Impact #5: no cron job exists in this app -- a pending
// batch nobody ever confirmed or discarded is cleaned up lazily, the next
// time anyone starts a new import, rather than on a schedule.
const BATCH_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// ADR 0032: a real Vercel Blob URL always has this hostname shape. The
// client picks `blobUrl` and hands it to this public Server Action, so
// it's validated the same defense-in-depth way every other action in this
// app validates client-supplied values -- without this, the action would
// `fetch()` whatever URL it's given, an SSRF-shaped risk.
function isOwnBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
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
    // never surface to the ASPL or block the import.
  }
}

export type ImportUploadFormState = { error: string | null };

// ADR 0032: the ASPL's browser uploads the file directly to Vercel Blob
// (client-side, via components/CampoutImportUploadForm.tsx) before this
// action ever runs -- a real file can exceed Vercel Functions' hard,
// unconfigurable 4.5MB request-body limit, which has nothing to do with
// this app's own MAX_FILE_BYTES or next.config.ts's bodySizeLimit. This
// action receives only `blobUrl`/`fileName`, fetches the bytes itself
// (no body-size limit on an outbound fetch from a function), and deletes
// the blob once it has them -- Blob storage here is transient upload
// transport only, not a persistent store (ADR 0031's "no blob storage for
// thumbnails" decision is unrelated and unchanged).
export async function uploadCampoutFile(
  _prevState: ImportUploadFormState,
  formData: FormData
): Promise<ImportUploadFormState> {
  const actor = await getActor();
  if (!canImportCampouts(actor)) {
    throw new Error("Only the ASPL of Camping can import campouts.");
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

async function processUpload(blobUrl: string, fileName: string, isPdf: boolean): Promise<ImportUploadFormState> {
  let bytes: Uint8Array;
  try {
    const response = await fetch(blobUrl);
    if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
    const buf = await response.arrayBuffer();
    if (buf.byteLength > MAX_FILE_BYTES) {
      return {
        error: `This file is too large -- imports are limited to ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB.`,
      };
    }
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

  const candidates: ImportCandidate[] = rawCampouts.map((raw) => {
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

  await db.campoutImportBatch.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - BATCH_MAX_AGE_MS) } } });

  const batch = await db.campoutImportBatch.create({
    data: { sourceFileName: fileName, candidates },
  });

  redirect(`/campouts/import/review/${batch.id}`);
}

function isImportCandidateEdit(value: unknown): value is ImportCandidateEdit {
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

export type ImportConfirmFormState = { error: string | null };

// REQ-30.18-30.21: re-validates and commits the ASPL's edited review-screen
// state in one transaction -- every remaining (non-discarded) candidate is
// created or merged together, so a partial failure midway never leaves the
// campout list half-imported (REQ-30.20).
//
// ADR 0032: the client submits only its *edits* (ImportCandidateEdit --
// text fields, selected image index, discarded flag), never the
// candidates' `images` data-URL arrays again. The real candidates,
// images included, are re-read here from the CampoutImportBatch row
// written at upload time and matched back up by tempId -- both to keep
// this action's request body small (several base64 thumbnails could
// otherwise approach Vercel Functions' hard 4.5MB body limit on a
// large/many-campout import) and because a campout's imageUrl should
// only ever be set from an image this app itself extracted, never from
// whatever bytes a client happens to submit in a public POST.
export async function confirmCampoutImport(
  _prevState: ImportConfirmFormState,
  formData: FormData
): Promise<ImportConfirmFormState> {
  const actor = await getActor();
  if (!canImportCampouts(actor)) {
    throw new Error("Only the ASPL of Camping can import campouts.");
  }

  const batchId = requireString(formData, "batchId");
  const editsRaw = requireString(formData, "edits");

  let parsed: unknown;
  try {
    parsed = JSON.parse(editsRaw);
  } catch {
    throw new Error("Could not read the edited import data.");
  }
  if (!Array.isArray(parsed) || !parsed.every(isImportCandidateEdit)) {
    throw new Error("Could not read the edited import data.");
  }
  const edits = parsed;

  const batch = await db.campoutImportBatch.findUnique({ where: { id: batchId } });
  if (!batch) {
    return { error: "This import has expired. Please upload the file again." };
  }
  const originalsByTempId = new Map(
    (batch.candidates as unknown as ImportCandidate[]).map((c) => [c.tempId, c])
  );

  type PendingWrite = { matchedCampoutId: string | null; data: Prisma.CampoutCreateInput };
  const toImport: PendingWrite[] = [];

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
          "Every campout needs at least a name and a date before importing. Fill in or discard the incomplete one(s).",
      };
    }

    const imageUrl =
      edit.selectedImageIndex !== null && edit.selectedImageIndex >= 0 && edit.selectedImageIndex < original.images.length
        ? original.images[edit.selectedImageIndex]
        : null;

    toImport.push({
      matchedCampoutId: original.matchedCampoutId,
      data: {
        name: edit.name.trim(),
        date: new Date(edit.date),
        endDate: edit.endDate ? new Date(edit.endDate) : null,
        location: edit.location?.trim() || null,
        description: edit.description?.trim() || null,
        ...(imageUrl ? { imageUrl } : {}),
        lastImportedFrom: batch.sourceFileName,
        lastImportedAt: new Date(),
      },
    });
  }

  try {
    await db.$transaction(async (tx) => {
      for (const item of toImport) {
        if (item.matchedCampoutId) {
          await tx.campout.update({ where: { id: item.matchedCampoutId }, data: item.data });
        } else {
          await tx.campout.create({ data: item.data });
        }
      }

      await tx.campoutImportBatch.deleteMany({ where: { id: batchId } });
    });
  } catch {
    return { error: "Could not save this import. Please try again." };
  }

  revalidatePath("/campouts");
  const count = toImport.length;
  redirect(withToast("/campouts", `Imported ${count} campout${count === 1 ? "" : "s"}`));
}
