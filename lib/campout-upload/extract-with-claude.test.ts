import { describe, expect, it } from "vitest";
import { parseExtractionReply } from "./extract-with-claude";

// ADR 0031: there's no live ANTHROPIC_API_KEY in this build environment, so
// the live success path (a real Claude call returning real extraction
// accuracy) is unverified here, same caveat ADR 0021 documented. What *is*
// fully testable without a key is the deterministic parsing/validation of
// whatever text comes back.
describe("parseExtractionReply", () => {
  it("parses a well-formed JSON array reply", () => {
    const reply = JSON.stringify([
      { name: "Fall Campout", date: "2026-10-24", endDate: "2026-10-26", location: "Eagle Lake", description: "Annual fall trip", sourceSections: [1] },
    ]);
    expect(parseExtractionReply(reply)).toEqual([
      { name: "Fall Campout", date: "2026-10-24", endDate: "2026-10-26", location: "Eagle Lake", description: "Annual fall trip", sourceSections: [1] },
    ]);
  });

  it("strips a markdown code fence the model wasn't supposed to add", () => {
    const reply = "```json\n[]\n```";
    expect(parseExtractionReply(reply)).toEqual([]);
  });

  it("treats missing/null fields as null rather than throwing", () => {
    const reply = JSON.stringify([{ name: "Spring Campout", date: null, endDate: null, location: null, description: null, sourceSections: [] }]);
    expect(parseExtractionReply(reply)).toEqual([
      { name: "Spring Campout", date: null, endDate: null, location: null, description: null, sourceSections: [] },
    ]);
  });

  it("throws a clean error on invalid JSON rather than returning garbage", () => {
    expect(() => parseExtractionReply("not json at all")).toThrow();
  });

  it("throws a clean error when the reply isn't a JSON array", () => {
    expect(() => parseExtractionReply(JSON.stringify({ name: "oops" }))).toThrow();
  });

  it("drops a malformed date rather than accepting a non-ISO string", () => {
    const reply = JSON.stringify([{ name: "X", date: "October 24th", endDate: null, location: null, description: null, sourceSections: [1] }]);
    expect(parseExtractionReply(reply)[0].date).toBeNull();
  });
});
