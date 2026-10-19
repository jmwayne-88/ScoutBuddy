"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canImportCampouts } from "@/lib/permissions";
import { requireString } from "@/lib/form-data";
import { withToast } from "@/lib/toast";
import { parsePdf } from "@/lib/campout-import/parse-pdf";
import { parseExcel } from "@/lib/campout-import/parse-excel";
import { extractCampoutsWithClaude } from "@/lib/campout-import/extract-with-claude";
import { matchExistingCampout, buildMergePreview } from "@/lib/campout-import/match";
import type { ImportCandidate, ParsedSection } from "@/lib/campout-import/types";

// REQ-30.2: generous for any real troop flyer/calendar, bounded to keep
// parsing time, AI token cost, and the Vercel function's execution time
// reasonable.
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_PDF_PAGES = 30;
const MAX_EXCEL_SHEETS = 30;

// REQ-30 Data Model Impact #5: no cron job exists in this app -- a pending
// batch nobody ever confirmed or discarded is cleaned up lazily, the next
// time anyone starts a new import, rather than on a schedule.
const BATCH_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type ImportUploadFormState = { error: string | null };

export async function uploadCampoutFile(
  _prevState: ImportUploadFormState,
  formData: FormData
): Promise<ImportUploadFormState> {
  const actor = await getActor();
  if (!canImportCampouts(actor)) {
    throw new Error("Only the ASPL of Camping can import campouts.");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a PDF or Excel file to upload." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: `This file is too large -- imports are limited to ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB.` };
  }

  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const isExcel = /\.(xlsx|xls)$/i.test(file.name);
  if (!isPdf && !isExcel) {
    return { error: "Only PDF (.pdf) or Excel (.xlsx/.xls) files are supported." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

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
    data: { sourceFileName: file.name, candidates },
  });

  redirect(`/campouts/import/review/${batch.id}`);
}

function isImportCandidate(value: unknown): value is ImportCandidate {
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
    Array.isArray(c.images) &&
    c.images.every((img) => typeof img === "string") &&
    (c.selectedImageIndex === null || typeof c.selectedImageIndex === "number") &&
    isStringOrNull(c.matchedCampoutId) &&
    typeof c.discarded === "boolean"
  );
}

export type ImportConfirmFormState = { error: string | null };

// REQ-30.18-30.21: re-validates and commits the ASPL's edited review-screen
// state in one transaction -- every remaining (non-discarded) candidate is
// created or merged together, so a partial failure midway never leaves the
// campout list half-imported (REQ-30.20).
export async function confirmCampoutImport(
  _prevState: ImportConfirmFormState,
  formData: FormData
): Promise<ImportConfirmFormState> {
  const actor = await getActor();
  if (!canImportCampouts(actor)) {
    throw new Error("Only the ASPL of Camping can import campouts.");
  }

  const batchId = requireString(formData, "batchId");
  const sourceFileName = requireString(formData, "sourceFileName");
  const candidatesRaw = requireString(formData, "candidates");

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidatesRaw);
  } catch {
    throw new Error("Could not read the edited import data.");
  }
  if (!Array.isArray(parsed) || !parsed.every(isImportCandidate)) {
    throw new Error("Could not read the edited import data.");
  }
  const candidates = parsed;

  const toImport = candidates.filter((c) => !c.discarded);
  // REQ-30.9: enforced here too, not just via the review screen's disabled
  // button -- a Server Action is a public POST endpoint, not only reachable
  // through this form.
  const incomplete = toImport.some((c) => !c.name?.trim() || !c.date);
  if (incomplete) {
    return {
      error: "Every campout needs at least a name and a date before importing. Fill in or discard the incomplete one(s).",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      for (const candidate of toImport) {
        const imageUrl =
          candidate.selectedImageIndex !== null ? candidate.images[candidate.selectedImageIndex] ?? null : null;

        const data = {
          name: candidate.name!.trim(),
          date: new Date(candidate.date!),
          endDate: candidate.endDate ? new Date(candidate.endDate) : null,
          location: candidate.location?.trim() || null,
          description: candidate.description?.trim() || null,
          ...(imageUrl ? { imageUrl } : {}),
          lastImportedFrom: sourceFileName,
          lastImportedAt: new Date(),
        };

        if (candidate.matchedCampoutId) {
          await tx.campout.update({ where: { id: candidate.matchedCampoutId }, data });
        } else {
          await tx.campout.create({ data });
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
