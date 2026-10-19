# 0030. `Campout.endDate` and lightweight upload-provenance columns

Date: 2026-10-19
Status: Accepted

## Context

[Requirement 30](../requirements/data-upload/30-campout-upload-from-pdf-excel.md) lets the ASPL bulk-upload campouts from an uploaded PDF or Excel file. Real campout flyers routinely describe a multi-day span (e.g. "Friday–Sunday"), but `Campout` has only ever had a single `date` column (Iteration 3). Flattening a detected range into free text would lose it as structured data everywhere else the campout is shown. Separately, once a campout's fields can be overwritten by an unattended bulk process rather than only a human typing into the manual form, it's worth being able to tell, at a glance, whether a given campout's current values came from a recent upload.

## Decision

**`Campout` gains `endDate DateTime?`**, nullable. A single-day campout (everything that exists today, and most new ones going forward) simply leaves it null; nothing reads `endDate` as if it were always present. The upload flow (`app/(app)/campouts/upload/actions.ts`'s `confirmCampoutUpload`) populates it only when the uploaded document actually distinguished a start and end day; the manual creation form (`campouts/new`) is unchanged and never sets it in this pass.

**`Campout` also gains `lastUploadedFrom String?` and `lastUploadedAt DateTime?`**, both nullable, set every time an upload creates or merges into a campout (overwritten on each subsequent upload, never accumulated). This is deliberately *not* an audit trail — no history of prior uploads is kept, no per-field change log. It answers one narrow question ("was this last touched by an upload, and which file") for troubleshooting a bad extraction, not "show me everything that's ever changed."

Both are additive, nullable columns with no backfill migration — there is no pre-existing data that needs a value for either.

## Alternatives Considered

- **A separate `CampoutDateRange` or similar join/value-object table**: rejected as more schema than a single nullable column justifies for one optional field that's 1:1 with its parent and never queried independently.
- **A full upload audit log (who/what/when per field), mirroring [ADR 0026](0026-comment-annotation-data-model.md)'s `CommentActivity`**: rejected as disproportionate for this requirement. Comments needed a full audit trail because *disputing or reviewing history* is the point of that feature; campout upload provenance is a troubleshooting convenience, not a reviewed record — REQ-30 doesn't ask for one, and nothing in FEATURES.md's scope needs it. Worth revisiting only if misattributed/bad uploads turn out to be a recurring real problem.
- **Folding the date range into `description` as text** (this requirement's originally-sketched default, before the Open Question below was resolved): rejected once asked directly — a real column keeps the range queryable/sortable and keeps every future display of a campout's dates (list views, print view, exports) automatically correct, instead of depending on free text being parsed back out.

## Consequences

- Every place `Campout.date` is displayed (the campout list sidebar, the campout detail page, the print view) should be revisited to show `endDate` when present — not done as part of this ADR, tracked as part of Requirement 30's own build, not a separate migration concern.
- `lastUploadedFrom`/`lastUploadedAt` being "last touch only" means a campout uploaded twice shows only the second file's name — acceptable given this is a troubleshooting aid, not a record of truth; see Requirement 30's Data Model Impact section for the reasoning.
- No change to `Menu`, `MealFrameworkException`, or anything else keyed off `Campout.id` — both new columns are inert unless explicitly set by the upload flow.

## Related

- [Requirement 30 - AI-Assisted Campout Upload from PDF/Excel](../requirements/data-upload/30-campout-upload-from-pdf-excel.md) — Data Model Impact #1/#2, the requirement this ADR implements.
- [ADR 0031 - Campout-upload parsing, extraction, and merge architecture](0031-campout-upload-parsing-extraction-and-merge.md) — the rest of this same requirement's architecture.
- [Iteration 3 - Multiple Campouts](../requirements/roadmap-iterations/03-multiple-campouts.md) — where `Campout.date` was originally introduced.
