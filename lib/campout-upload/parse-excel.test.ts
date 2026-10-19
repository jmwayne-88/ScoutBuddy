import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { parseExcel } from "./parse-excel";

// REQ-30.7: a real round-trip through exceljs, not a hand-built fixture
// file -- builds a tiny in-memory workbook and parses it straight back.
describe("parseExcel", () => {
  it("dumps every non-empty row's cell text, one section per worksheet", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet1 = workbook.addWorksheet("Fall");
    sheet1.addRow(["Campout Name", "Date"]);
    sheet1.addRow(["Fall Campout", "2026-10-24"]);
    const sheet2 = workbook.addWorksheet("Spring");
    sheet2.addRow(["Spring Campout", "2027-04-10"]);

    const buffer = await workbook.xlsx.writeBuffer();
    const sections = await parseExcel(new Uint8Array(buffer as ArrayBuffer), 30);

    expect(sections).toHaveLength(2);
    expect(sections[0].sectionNumber).toBe(1);
    expect(sections[0].text).toContain("Campout Name");
    expect(sections[0].text).toContain("Fall Campout");
    expect(sections[1].text).toContain("Spring Campout");
  });

  it("does not assume a header row or fixed columns -- an unlabeled block still comes through as text", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Notes");
    sheet.addRow(["Winter Camporee - Jan 2027 at Pine Ridge"]);
    sheet.addRow([]);
    sheet.addRow(["Summer Trip - July 2027"]);

    const buffer = await workbook.xlsx.writeBuffer();
    const sections = await parseExcel(new Uint8Array(buffer as ArrayBuffer), 30);

    expect(sections[0].text).toContain("Winter Camporee");
    expect(sections[0].text).toContain("Summer Trip");
  });

  it("respects the worksheet cap", async () => {
    const workbook = new ExcelJS.Workbook();
    for (let i = 0; i < 5; i++) {
      workbook.addWorksheet(`Sheet${i}`).addRow(["x"]);
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const sections = await parseExcel(new Uint8Array(buffer as ArrayBuffer), 3);
    expect(sections).toHaveLength(3);
  });
});
