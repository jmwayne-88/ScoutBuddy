# Requirement 30 — AI-Assisted Campout Import from PDF/Excel

Status: Done
Depends on: [Iteration 3 - Multiple Campouts](../roadmap-iterations/03-multiple-campouts.md) (the `Campout` entity this feature creates/updates); follows this app's precedent of calling Claude (first established by [ADR 0021](../../adr/0021-claude-api-ingredient-categorization.md)), though this requirement's extraction task is materially larger (structured multi-record extraction + document segmentation, not single-string classification) and deliberately departs from 0021's "always have a non-AI fallback" pattern — see [ADR 0031](../../adr/0031-campout-import-parsing-extraction-and-merge.md).

## Goal

Let the ASPL of Camping upload a single PDF or Excel file — a council calendar, a term's camping schedule, a flyer, a spreadsheet of dates — and have ScoutBuddy automatically find every distinct campout described in it, extract what it can about each (name, dates, location, description, a representative photo), and create or update `Campout` rows accordingly, without the ASPL having to pre-split the file, mark where one event ends and another begins, or manually re-type anything the file already says. The ASPL reviews and confirms the result before anything is saved.

## Source

User request, 2026-10-19: add a feature letting the ASPL upload a campout list from a PDF or Excel file; harvest as much as possible; use an embedded image as a thumbnail if present; must be visually appealing and easy to navigate; must not duplicate existing campouts — merge information and resolve conflicts using the newest upload; must extract as many campouts as a single file actually contains, without assuming one campout per page, by inferring the breakpoints between events and the file's format itself; extraction must be well-tuned at identifying name, description, and dates specifically. Follow-up clarifications, same day: a review/confirm screen is required before anything saves; only PDFs with a real text layer are supported (no OCR for scanned/photographed pages) for this first version; and a detected multi-day date range gets a real `Campout.endDate` column rather than being flattened into free text.

## Problem

Today the ASPL creates every campout one at a time through `app/(app)/campouts/new/page.tsx` — typing in a name and date, with location/description/photo URL as optional free text (`createCampout`, [`app/(app)/campouts/actions.ts`](../../../app/(app)/campouts/actions.ts)). For a troop planning a full term's worth of campouts from a council calendar or outing-committee schedule, that means manually re-keying every event from a document that already contains all of it — tedious, and error-prone exactly where it matters most (dates). This requirement adds a bulk ingestion path alongside that manual form; the manual form is unchanged and remains the way to create or edit a single campout by hand.

## Non-Goals

This is not a general document-management feature. It does not store the uploaded source file for browsing later (beyond whatever is needed to extract images from it, per REQ-30.12), does not support formats other than PDF and Excel (`.xlsx`/`.xls`), and does not let a Patrol Leader upload anything — this is ASPL-only, matching every other campout-authoring action today (`canCreateCampout`, [`lib/permissions.ts`](../../../lib/permissions.ts)).

## Requirements

### Upload & file handling

- **REQ-30.1** A new ASPL-only entry point (e.g. an "Import from file" action on the campout list, gated by a new `canImportCampouts` permission that mirrors `canCreateCampout`'s ASPL-only check) accepts exactly one file per upload: PDF (`.pdf`) or Excel (`.xlsx`/`.xls`). Any other file type is rejected up front with a clear message before any parsing or AI call is attempted.
- **REQ-30.2** Uploads are capped at a fixed maximum size (recommend 15 MB, generous for any real troop flyer or calendar while bounding parsing time, AI token cost, and Vercel function execution limits) and a fixed maximum page count for PDFs (recommend 30 pages). A file over either limit is rejected with a message telling the ASPL what the limit is, not a silent truncation or a generic error.
- **REQ-30.3** Only PDFs with a real, extractable text layer are supported in this version. A PDF with no extractable text on any page (i.e. scanned/photographed pages with no OCR) is detected and rejected with a message explaining why, rather than silently producing empty or garbage extraction results. OCR support for scanned pages is explicitly out of scope (see Out of Scope).
- **REQ-30.4** Parsing never executes anything embedded in the uploaded file as code: no Excel macro execution, no PDF JavaScript execution, no formula evaluation beyond reading a cell's already-computed display value. Parsing libraries are used strictly as read-only data/text extractors.

### Segmentation & field extraction

- **REQ-30.5** The system does not assume any fixed document shape — not "one campout per PDF page," not "one campout per spreadsheet row," not "one campout per worksheet." It inspects the actual content (headings, repeated date/name patterns, blank-row or page-break separators, table structure) and infers where one campout's description ends and the next begins, extracting as many distinct campouts as the file actually contains from a single upload.
- **REQ-30.6** For each inferred campout, extraction targets these fields, in priority order: **name** and **date(s)** (required — see REQ-30.9 for what happens when these can't be confidently extracted), then location, then a free-text description, then a date range if the source distinguishes a start and end day (e.g. "Friday–Sunday," "10/24–10/26"). Per the user's explicit direction, name/description/date extraction accuracy is this requirement's primary quality bar, not a secondary concern — see Acceptance Criteria for how this gets verified.
- **REQ-30.7** For Excel files, extraction is driven by the same content-inference approach as PDFs (REQ-30.5), not a hardcoded assumption about column names or order — a sheet with columns literally labeled "Campout Name"/"Date" and a sheet with an unlabeled, loosely-formatted list of events are both handled by the same inference step. Every worksheet in the workbook is considered, and a single worksheet may itself contain more than one campout (REQ-30.5 applies per-sheet too, not just per-file).
- **REQ-30.8** Extraction is implemented as a single Claude API call over the file's extracted text/structure (the REQ-30.2 size/page caps keep one upload's input comfortably within context limits, so no multi-call chunking is needed), returning a structured list of candidate campouts with their extracted fields. The exact model, prompt design, and whether structured output formatting is used are build-time decisions (see [ADR 0031](../../adr/0031-campout-import-parsing-extraction-and-merge.md)) — this requirement specifies the required *behavior* (REQ-30.5–30.7), not the SDK call shape.
- **REQ-30.9** A candidate campout missing a confidently-extracted name or date is still surfaced in the review screen (REQ-30.13), not silently dropped — but visibly flagged as incomplete, and the "Save"/"Import" action for that specific candidate stays disabled until the ASPL fills in the missing required field by hand in the review screen. A file that yields zero candidates at all (nothing recognizable as a campout) shows a plain "No campouts found in this file" result, not an error.
- **REQ-30.10** Every extracted field is editable in the review screen before anything saves (REQ-30.13) — extraction is a draft, never a final, unreviewable write.

### Image extraction & thumbnails

- **REQ-30.11** If the uploaded file contains one or more embedded images (a PDF page image, a photo floating in or anchored near a cell in an Excel sheet), the extraction step associates each image with whichever inferred campout it's nearest to in the document, and offers it as that campout's thumbnail candidate (`Campout.imageUrl`) in the review screen.
- **REQ-30.12** An embedded image below a minimum pixel-dimension threshold (recommend 100×100px) is treated as decorative (a logo, bullet icon, etc.) and never offered as a thumbnail candidate.
- **REQ-30.13** If a candidate campout has more than one associated image, the review screen shows all of them and lets the ASPL pick which (if any) becomes the thumbnail — extraction doesn't have to guess correctly on its own when there's a real choice to offer instead.
- **REQ-30.14** Thumbnail images that were extracted but never attached to a confirmed campout (candidate edited to remove the image, or the whole candidate discarded in review) are not left behind in storage — cleaned up rather than accumulating as orphaned files.

### Duplicate detection & merge

- **REQ-30.15** An extracted candidate is treated as the **same campout** as an existing `Campout` row when its name matches case-insensitively (ignoring leading/trailing whitespace) **and** its date is identical or within a small tolerance window (recommend ±2 days, to absorb minor date-parsing ambiguity for the same event). Anything less certain than that is treated as a **new** campout, never auto-merged on a guess — REQ-30.13's review screen is exactly where a near-miss gets caught before it becomes a bad merge.
- **REQ-30.16** Merging into an existing campout is field-by-field and additive, not a full overwrite: for each field (name, date, endDate, location, description, imageUrl), a non-empty value from the new upload replaces the existing stored value; a field the new upload didn't extract anything for leaves the existing value untouched. "Resolve conflicts using the newest upload" means **the upload being confirmed right now always wins** over whatever is already stored — "newest" is determined by when the ASPL confirms the import in the review screen (REQ-30.13), not by any date printed inside the document or the uploaded file's own timestamp.
- **REQ-30.17** The review screen (REQ-30.13) shows, for any candidate that matches an existing campout, a clear before/after comparison of every field that would change — not just a bare "this will update Fall Campout" notice — so the ASPL can see and approve exactly what's being overwritten before confirming.

### Review & confirm screen

- **REQ-30.18** After extraction, the ASPL sees a review screen listing every candidate campout found in the file before anything is written to the database: new campouts to be created, existing campouts to be updated (with the before/after diff from REQ-30.17), and incomplete candidates blocked pending manual completion (REQ-30.9).
- **REQ-30.19** The ASPL can edit any field on any candidate, deselect/discard any individual candidate from the batch entirely, and choose a thumbnail where more than one image was found (REQ-30.13) — all before confirming.
- **REQ-30.20** Confirming the review commits the whole batch in one action: every remaining (non-discarded) candidate is created or merged in a single transaction, so a partial failure midway doesn't leave the campout list in a half-imported state.
- **REQ-30.21** Leaving the review screen without confirming (navigating away, closing the tab) discards the pending extraction results — nothing is saved, and no partial state is left behind for the ASPL to stumble into later.

### Permissions & security

- **REQ-30.22** The upload entry point, the review screen, and the final confirm action are all gated by the new `canImportCampouts` permission (ASPL-only, mirroring `canCreateCampout`) — a Patrol Leader can never see or trigger this feature, consistent with every other campout-authoring action today.
- **REQ-30.23** Uploaded file content and anything extracted from it (names, descriptions, locations) is treated as untrusted input: rendered through the same escaping/sanitization every other user-supplied text field in the app already gets (React's default escaping), never interpolated into a raw HTML string or used to build a file path/query dynamically.

## Data Model / Architecture Impact

Resolved by two new ADRs written at build time, per CLAUDE.md's working conventions:

1. **`Campout.endDate`** (nullable `DateTime`) — a real schema change, resolving the date-range question raised by this requirement in favor of accurate multi-day representation everywhere `Campout` is shown, not just in this import feature. Existing single-day campouts simply leave it null. See [ADR 0030](../../adr/0030-campout-end-date-and-import-provenance.md).
2. **Lightweight import-provenance fields on `Campout`** (`lastImportedFrom`, `lastImportedAt`, both nullable) so a future "why did this change" question about a campout has an answer — not a full audit log (no REQ-26-style per-field history), just enough to know a given campout's last touch came from an upload rather than the manual form. See [ADR 0030](../../adr/0030-campout-end-date-and-import-provenance.md).
3. **No new file/blob storage.** A thumbnail is resized/recompressed and stored as a `data:` URL directly in the existing `Campout.imageUrl` column, rather than standing up Vercel Blob or any other storage service — this app's data volume doesn't justify the new infrastructure/secret. See [ADR 0031](../../adr/0031-campout-import-parsing-extraction-and-merge.md).
4. **Document-parsing libraries**: `pdfjs-dist` (PDF text + embedded-image extraction, no `canvas` dependency) and `exceljs` (Excel sheets/images), both listed in `next.config.ts`'s `serverExternalPackages` to avoid a Turbopack bundling issue discovered while building this. See [ADR 0031](../../adr/0031-campout-import-parsing-extraction-and-merge.md).
5. **In-progress extraction results live in a real staging table** (`CampoutImportBatch`), not a signed payload or session store — this app has no session infrastructure, and a batch's thumbnails are too large to keep round-tripping through hidden form fields on every edit. A stale, never-confirmed batch is swept lazily by age on the next upload, not via a cron job. See [ADR 0031](../../adr/0031-campout-import-parsing-extraction-and-merge.md).

## Acceptance Criteria

Verified by running the real app end-to-end (dev server + direct requests replicating the browser's own Server Action POSTs) rather than only unit tests, per CLAUDE.md. Live Claude extraction *accuracy* against real documents (the first four items) is unverified in the build environment itself, same ceiling [ADR 0021](../../adr/0021-claude-api-ingredient-categorization.md) documented — no `ANTHROPIC_API_KEY` is configured there — but the mechanical pipeline each of them depends on (parsing, segmentation input, the review/confirm UI, the clean failure path) was verified directly.

- [ ] Uploading a text-layer PDF containing three clearly-separated campout announcements on a single page (no page breaks between them) produces three distinct candidates, not one merged blob or only the first one found. *(Needs a live API key to verify Claude's actual segmentation; the section-tagged input it receives was verified directly.)*
- [ ] Uploading a text-layer PDF with one campout per page across five pages produces five distinct candidates. *(Same caveat as above.)*
- [ ] Uploading an Excel file with one campout per row (with header row) produces one candidate per data row. *(Same caveat as above.)*
- [ ] Uploading an Excel file where a single worksheet contains two unrelated campouts' worth of information (e.g. two blocks separated by blank rows, not one row each) produces two distinct candidates, not one. *(Same caveat as above.)*
- [x] A PDF page containing a photo near a campout's description offers that photo as a thumbnail candidate for that specific campout in the review screen. Verified mechanically: a hand-built PDF with an embedded raster image was parsed, resized, and rendered as a selectable thumbnail in the review screen; the section-based proximity pooling (REQ-30.11) that attributes it to a specific campout was verified with seeded candidate data.
- [x] A file with no extractable campout information shows "No campouts found in this file," not an error or a blank screen. (Code path verified; triggering the zero-campouts branch specifically needs a live key, so the empty-array path was verified via `extract-with-claude.test.ts` instead.)
- [x] A scanned/image-only PDF (no text layer) is rejected up front with a clear explanatory message. Verified against a hand-built image-only PDF.
- [x] A candidate matching an existing campout by name and date shows a before/after diff of every field that would change, and confirming updates only the fields the new upload actually provided values for — fields the upload didn't mention keep their existing stored value. Verified end-to-end against a real existing campout row.
- [x] A candidate with no confident date or name is shown but cannot be confirmed/imported until the ASPL fills in the missing field by hand. Verified both client-side (disabled submit button) and server-side (the confirm action rejects it even when posted directly, bypassing the disabled button).
- [x] Discarding a candidate in the review screen (including one with an extracted image) leaves no orphaned image file in storage and creates/updates nothing for that candidate. (No separate "file" to orphan by design — ADR 0031's data-URL-not-blob-storage decision means a discarded candidate's image data simply isn't written anywhere; verified nothing was created for it.)
- [x] Navigating away from the review screen without confirming results in zero database changes. Verified: a pending batch sat inert with zero `Campout` writes until explicitly confirmed.
- [x] A Patrol Leader actor cannot reach the upload entry point, the review screen, or the confirm action (403/redirect, consistent with other ASPL-only actions). Verified against all three.
- [x] A campout created or updated via import that included a detected date range has both `date` (start) and the new `endDate` populated correctly. Verified end-to-end.
- [x] `npm test` passes, including `lib/theme/contrast.test.ts`. The 360px/1440px visual check was not done — no browser/screenshot tooling was available in the build environment this shipped from; flagged rather than claimed.

## Out of Scope for This Requirement

- OCR for scanned/photographed PDF pages with no text layer (REQ-30.3) — a real follow-up if troop flyers turn out to commonly be phone photos rather than typed documents.
- CSV/plain-text/Word (`.docx`) uploads — only PDF and Excel were requested; adding a format later is additive, not a redesign of this requirement's segmentation approach.
- Uploading more than one file in a single import action — one file per upload; a term's worth of separate flyers would be separate upload actions, each going through its own review screen.
- A persistent, browsable archive of previously uploaded source files — only the data extracted from them is kept (plus the minimal provenance noted in Data Model Impact).
- Any change to the manual single-campout creation form (`campouts/new`) — it remains exactly as it is today, as the non-bulk path.
- De-duplicating identical images re-uploaded across separate import actions (e.g. the same flyer photo uploaded twice) — each confirmed thumbnail is stored independently; no content-hash dedup of blob storage.
- Notifications or announcements triggered by a newly-imported campout — unrelated to [Requirement 24](../24-due-date-and-review-notifications.md), which covers due-date/review notifications, not import events.

## Open Questions

- **Review vs. fully automatic import** — **resolved**: a review/confirm screen is required (REQ-30.18–30.21); nothing saves without explicit ASPL confirmation.
- **Scanned/photographed PDFs (OCR)** — **resolved**: out of scope for this version (REQ-30.3); only text-layer PDFs are supported.
- **Multi-day campouts (date range)** — **resolved**: `Campout` gains a real nullable `endDate` column (Data Model Impact #1) rather than folding the range into free text.

## Related

- [Iteration 3 - Multiple Campouts](../roadmap-iterations/03-multiple-campouts.md) — the `Campout` entity and campout-list view this requirement writes into.
- [ADR 0021 - Ingredient categorization via the Claude API](../../adr/0021-claude-api-ingredient-categorization.md) — this app's first external-AI-service call and its fallback/verification precedent; this requirement's extraction step is a larger, structured-output version of that same pattern and deliberately departs from 0021's fallback behavior — see ADR 0031.
- [ADR 0030 - `Campout.endDate` and lightweight import-provenance columns](../../adr/0030-campout-end-date-and-import-provenance.md) — the schema change this requirement needed.
- [ADR 0031 - Campout-import parsing, extraction, and merge architecture](../../adr/0031-campout-import-parsing-extraction-and-merge.md) — the parsing/AI/storage/staging decisions this requirement needed.
- [Requirement 20 - Inline Validation Errors](../ux-interaction-polish/20-inline-validation-errors.md) — the review screen's per-field incomplete/invalid states (REQ-30.9) follow this existing inline-validation convention rather than inventing a new one.
- [Requirement 15 - Consistent Destructive-Action Pattern](../ux-interaction-polish/15-consistent-destructive-action-pattern.md) — the merge-conflict confirmation (REQ-30.17) is a close cousin of this existing confirm-before-acting convention, applied to an overwrite rather than a delete.
