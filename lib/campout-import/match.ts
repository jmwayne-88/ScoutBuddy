import type { Campout } from "@prisma/client";
import type { ImportCandidate, ImportFieldKey, RawExtractedCampout } from "./types";

// REQ-30.15: a small tolerance window, to absorb minor date-parsing
// ambiguity for what's really the same event (e.g. the flyer says "the
// 24th" and a prior upload recorded the 25th for the same weekend) --
// without being loose enough to merge two genuinely different campouts
// that happen to be close together.
const DATE_TOLERANCE_DAYS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function daysApart(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / DAY_MS;
}

// REQ-30.15: an ambiguous match (more than one existing campout qualifies)
// is treated as no match at all -- left for the ASPL to reconcile by hand
// in the review screen rather than auto-resolved on a guess.
export function matchExistingCampout(
  candidate: Pick<RawExtractedCampout, "name" | "date">,
  existingCampouts: Campout[]
): Campout | null {
  if (!candidate.name || !candidate.date) return null;

  const candidateName = normalizeName(candidate.name);
  const candidateDate = new Date(candidate.date);

  const matches = existingCampouts.filter(
    (c) => normalizeName(c.name) === candidateName && daysApart(c.date, candidateDate) <= DATE_TOLERANCE_DAYS
  );

  return matches.length === 1 ? matches[0] : null;
}

function toIsoDateOrNull(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

// REQ-30.16/30.17: computes the proposed final values for one extracted
// campout up front -- the new upload's non-empty value wins, a field it
// didn't extract anything for keeps the existing stored value -- plus
// which fields that actually changes, so the review screen's "was: ..."
// hint and the final write both just use this result directly with no
// further merge logic at confirm time.
export function buildMergePreview(
  raw: RawExtractedCampout,
  matched: Campout | null
): Pick<ImportCandidate, "name" | "date" | "endDate" | "location" | "description" | "changedFields" | "previousValues"> {
  if (!matched) {
    return {
      name: raw.name,
      date: raw.date,
      endDate: raw.endDate,
      location: raw.location,
      description: raw.description,
      changedFields: [],
      previousValues: {},
    };
  }

  const previous: Record<ImportFieldKey, string | null> = {
    name: matched.name,
    date: toIsoDateOrNull(matched.date),
    endDate: toIsoDateOrNull(matched.endDate),
    location: matched.location,
    description: matched.description,
  };

  const merged: Record<ImportFieldKey, string | null> = {
    name: raw.name ?? previous.name,
    date: raw.date ?? previous.date,
    endDate: raw.endDate ?? previous.endDate,
    location: raw.location ?? previous.location,
    description: raw.description ?? previous.description,
  };

  const changedFields = (Object.keys(merged) as ImportFieldKey[]).filter((key) => merged[key] !== previous[key]);

  return { ...merged, changedFields, previousValues: previous };
}
