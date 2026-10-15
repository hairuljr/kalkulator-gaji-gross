import { describe, expect, it } from "vitest";

import { formatRupiah, formatRupiahInput, parseRupiah } from "./format";

describe("formatRupiah", () => {
  it("memformat dengan pemisah ribuan id-ID tanpa desimal", () => {
    expect(formatRupiah(1_234_567)).toBe("Rp1.234.567");
    expect(formatRupiah(0)).toBe("Rp0");
    expect(formatRupiah(1_000)).toBe("Rp1.000");
  });

  it("membulatkan pecahan ke bilangan bulat", () => {
    expect(formatRupiah(1_500.7)).toBe("Rp1.501");
    expect(formatRupiah(999.4)).toBe("Rp999");
  });

  it("menangani negatif", () => {
    expect(formatRupiah(-250_000)).toBe("-Rp250.000");
  });

  it("nilai non-finite -> Rp0", () => {
    expect(formatRupiah(Number.NaN)).toBe("Rp0");
    expect(formatRupiah(Number.POSITIVE_INFINITY)).toBe("Rp0");
  });
});

describe("parseRupiah", () => {
  it("mengambil digit dari berbagai format", () => {
    expect(parseRupiah("Rp1.234.567")).toBe(1_234_567);
    expect(parseRupiah("1.234.567")).toBe(1_234_567);
    expect(parseRupiah("Rp 10.000.000")).toBe(10_000_000);
  });

  it("input tanpa digit -> 0", () => {
    expect(parseRupiah("")).toBe(0);
    expect(parseRupiah("abc")).toBe(0);
    expect(parseRupiah("Rp")).toBe(0);
  });

  it("round-trip: parseRupiah(formatRupiah(n)) === n", () => {
    for (const n of [0, 1, 999, 1_000, 1_234_567, 98_765_432]) {
      expect(parseRupiah(formatRupiah(n))).toBe(n);
    }
  });
});

describe("formatRupiahInput", () => {
  it("memformat live sambil mengetik", () => {
    expect(formatRupiahInput("1234567")).toBe("Rp1.234.567");
    expect(formatRupiahInput("Rp1.234.567")).toBe("Rp1.234.567");
  });

  it("kosong -> string kosong", () => {
    expect(formatRupiahInput("")).toBe("");
    expect(formatRupiahInput("Rp")).toBe("");
  });

  it("membuang leading zero", () => {
    expect(formatRupiahInput("007")).toBe("Rp7");
    expect(formatRupiahInput("0")).toBe("Rp0");
  });
});
