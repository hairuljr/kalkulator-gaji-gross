import { describe, expect, it } from "vitest";

import { findGross } from "./calculate";
import { buildOfferSummary } from "./summary";

describe("buildOfferSummary", () => {
  it("memuat semua baris penting dengan nominal terformat", () => {
    const result = findGross(10_000_000, {
      ptkp: "TK/0",
      jht: true,
      jp: true,
      bpjs: true,
    });
    const text = buildOfferSummary(result, "TK/0");

    expect(text).toContain("Status PTKP      : TK/0");
    expect(text).toContain("Rp54.000.000/tahun");
    expect(text).toContain("Gross Salary     : Rp10.742.800");
    expect(text).toContain("JHT (2%)");
    expect(text).toContain("JP (1%)");
    expect(text).toContain("BPJS Kesehatan");
    expect(text).toContain("PPh 21");
    expect(text).toContain("Total potongan    : Rp742.787");
    expect(text).toContain("Take Home Pay     : Rp10.000.013");
  });

  it("menyertakan nominal PTKP sesuai status", () => {
    const result = findGross(8_000_000, {
      ptkp: "K/3",
      jht: true,
      jp: true,
      bpjs: true,
    });
    const text = buildOfferSummary(result, "K/3");
    expect(text).toContain("Rp72.000.000/tahun");
  });
});
