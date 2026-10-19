// REQ-30: shared shapes for the upload -> review -> confirm flow. A
// RawExtractedCampout is exactly what the Claude extraction step returns
// (lib/campout-import/extract-with-claude.ts) -- nothing matched or merged
// yet. An ImportCandidate is what gets stored on CampoutImportBatch and
// rendered in the review screen: the raw extraction plus the proposed
// merge result against any matching existing campout (lib/campout-import/
// match.ts), ready to edit and confirm as-is.

// A PDF page or an Excel worksheet -- the unit both parsers split a
// document into before handing it to Claude (REQ-30.5/30.7).
export type ParsedSection = {
  sectionNumber: number;
  text: string;
  images: string[]; // data: URLs, already filtered/resized
};

export type RawExtractedCampout = {
  name: string | null;
  date: string | null; // ISO yyyy-mm-dd, or null if not confidently found
  endDate: string | null;
  location: string | null;
  description: string | null;
  // REQ-30.11: which 1-indexed section(s) of the input (PDF page, or Excel
  // worksheet) this campout's text came from, per Claude's own reading of
  // the page/sheet-tagged input -- used to pool "nearby" images (REQ-30.5
  // segmentation + REQ-30.11 proximity) without needing pixel-coordinate
  // reasoning.
  sourceSections: number[];
};

export type ImportFieldKey = "name" | "date" | "endDate" | "location" | "description";

export type ImportCandidate = {
  tempId: string;
  // The proposed final values -- for a new campout this is just the raw
  // extraction; for a campout matched to an existing one (REQ-30.15) this
  // is already the merged result (REQ-30.16: new upload's non-empty value
  // wins, blank preserves the existing one). Directly editable in the
  // review screen and written as-is on confirm -- no further merge logic
  // happens at confirm time.
  name: string | null;
  date: string | null;
  endDate: string | null;
  location: string | null;
  description: string | null;
  images: string[];
  selectedImageIndex: number | null;
  matchedCampoutId: string | null;
  matchedCampoutName: string | null;
  // REQ-30.17: which fields actually differ from the matched campout's
  // current stored value, so the review screen can show a "was: ..." hint
  // without recomputing the diff itself (and so it still reads correctly
  // even after the ASPL edits a field away from the proposed value).
  changedFields: ImportFieldKey[];
  previousValues: Partial<Record<ImportFieldKey, string | null>>;
  discarded: boolean;
};

// ADR 0032: what the review screen actually submits on confirm -- the
// ASPL's edits to the small text fields plus which image (by index) and
// whether to discard, deliberately *not* the `images` data-URL array
// itself. The server already holds the real candidates (with their
// images) on the CampoutImportBatch row from upload time and looks them
// up by tempId, both because re-sending potentially several images'
// worth of base64 on every confirm needlessly risks Vercel Functions'
// hard request-body limit, and because trusting client-supplied image
// bytes for what becomes Campout.imageUrl has no reason to be allowed in
// the first place.
export type ImportCandidateEdit = Pick<
  ImportCandidate,
  "tempId" | "name" | "date" | "endDate" | "location" | "description" | "selectedImageIndex" | "discarded"
>;
