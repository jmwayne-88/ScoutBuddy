import Anthropic from "@anthropic-ai/sdk";
import type { ParsedSection, RawExtractedCampout } from "./types";

// REQ-30.8/ADR 0031: one Claude call does both segmentation (REQ-30.5/30.7
// -- find the breakpoints between campouts) and field extraction (REQ-30.6
// -- name/dates/location/description), returning plain JSON text that's
// manually validated below rather than relying on structured-output
// formatting -- same reason ADR 0021 gave: there's no live API key in this
// build environment to verify a structured-output response shape against.
//
// Unlike ADR 0021's ingredient classification, there's no sane non-AI
// fallback for "find and extract N campouts from an arbitrary document" --
// a missing/invalid key, a network error, or a reply that doesn't parse as
// the expected JSON shape all surface as a thrown ExtractionFailedError,
// which the calling Server Action turns into a clean, actionable error
// message instead of ever writing a bad heuristic guess into the review
// screen. See ADR 0031.
export class ExtractionFailedError extends Error {}

const MODEL = "claude-sonnet-5-5";

const SYSTEM_PROMPT = `You are reading a document a Scout troop's ASPL of Camping uploaded to import campouts into a planning app. The document is split into numbered sections below (PDF pages or Excel worksheets).

Find every distinct campout described anywhere in the document. Do not assume one campout per section -- a single section can describe several campouts, and a single campout's description can span multiple sections. Infer the breakpoints between campouts from the content itself (headings, repeated date/name patterns, blank lines, table rows).

For each campout found, extract:
- name: its title/name, as written
- date: its start date, as an ISO yyyy-mm-dd string, or null if you can't confidently determine one
- endDate: its last day, as an ISO yyyy-mm-dd string, if the source distinguishes a start and end day (e.g. "Friday-Sunday"), else null
- location: where it is, or null
- description: a short free-text description/notes, or null
- sourceSections: an array of the 1-indexed section numbers this campout's information came from

Reply with ONLY a JSON array of objects with exactly these keys: name, date, endDate, location, description, sourceSections. No prose, no markdown code fences. If you find no campouts, reply with an empty array: []`;

function buildUserMessage(sections: ParsedSection[]): string {
  return sections
    .filter((s) => s.text.trim() !== "")
    .map((s) => `--- Section ${s.sectionNumber} ---\n${s.text}`)
    .join("\n\n");
}

function isIsoDateOrNull(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function validateExtracted(parsed: unknown): RawExtractedCampout[] {
  if (!Array.isArray(parsed)) {
    throw new ExtractionFailedError("Claude's reply wasn't a JSON array.");
  }

  return parsed.map((raw, index) => {
    if (typeof raw !== "object" || raw === null) {
      throw new ExtractionFailedError(`Entry ${index} wasn't an object.`);
    }
    const r = raw as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() || null : null;
    const location = typeof r.location === "string" ? r.location.trim() || null : null;
    const description = typeof r.description === "string" ? r.description.trim() || null : null;
    const date = isIsoDateOrNull(r.date) ? r.date : null;
    const endDate = isIsoDateOrNull(r.endDate) ? r.endDate : null;
    const sourceSections = Array.isArray(r.sourceSections) ? r.sourceSections.filter((n) => typeof n === "number") : [];

    return { name, date, endDate, location, description, sourceSections };
  });
}

function parseJsonReply(text: string): unknown {
  // Strip a markdown code fence if the model wrapped its reply in one
  // despite the system prompt's instruction not to.
  const stripped = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(stripped);
  } catch {
    throw new ExtractionFailedError("Claude's reply wasn't valid JSON.");
  }
}

// Exported separately from extractCampoutsWithClaude so its parsing/
// validation logic -- the part that's actually deterministic and testable
// without a live API key -- can be exercised directly. See
// extract-with-claude.test.ts.
export function parseExtractionReply(text: string): RawExtractedCampout[] {
  return validateExtracted(parseJsonReply(text));
}

export async function extractCampoutsWithClaude(sections: ParsedSection[]): Promise<RawExtractedCampout[]> {
  const userMessage = buildUserMessage(sections);
  if (userMessage.trim() === "") {
    return [];
  }

  let replyText: string;
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = response.content.find((b) => b.type === "text");
    replyText = block && block.type === "text" ? block.text : "";
  } catch (err) {
    throw new ExtractionFailedError(err instanceof Error ? err.message : "The extraction request failed.");
  }

  return parseExtractionReply(replyText);
}
