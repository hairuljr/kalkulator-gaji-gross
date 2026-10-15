import { describe, expect, it } from "vitest";

import { calcDeductions, calcPph21, findGross } from "./calculate";
import { PTKP } from "./tax";

/**
 * Nilai harapan dihitung manual dari aturan di `./tax`:
 *   JHT 2% (tanpa cap), JP 1% (cap 11.086.300), BPJS 1% (cap 12.000.000),
 *   biaya jabatan 5% cap 6jt/tahun, PTKP TK/0 = 54jt, tarif progresif UU HPP.
 */

describe("calcDeductions — kasus terhitung manual", () => {
  it("gross 12jt, TK/0, semua toggle aktif", () => {
    const r = calcDeductions(12_000_000, {
      ptkp: "TK/0",
      jht: true,
      jp: true,
      bpjs: true,
    });

    // JHT 2% x 12.000.000 = 240.000
    expect(r.jht).toBe(240_000);
    // JP 1% x min(12jt, cap 11.086.300) = 110.863
    expect(r.jp).toBe(110_863);
    // BPJS 1% x min(12jt, cap 12jt) = 120.000
    expect(r.bpjs).toBe(120_000);
    // PPh: bruto 144jt − biaya jabatan 6jt − (240k+110.863k)x12 = neto 133.789.644
    //      PKP 79.789.000 -> 5%x60jt + 15%x19.789.000 = 5.968.350 setahun
    //      bulanan 497.362,5 -> 497.363
    expect(r.pph21).toBe(497_363);
    expect(r.total).toBe(968_226);
    expect(r.thp).toBe(11_031_774);
    expect(r.gross).toBe(12_000_000);
  });

  it("penghasilan di bawah PTKP -> PPh 21 = 0", () => {
    const r = calcDeductions(3_000_000, {
      ptkp: "TK/0",
      jht: true,
      jp: true,
      bpjs: true,
    });
    expect(r.pph21).toBe(0);
    // JHT 60.000, JP 30.000, BPJS 30.000
    expect(r.jht).toBe(60_000);
    expect(r.jp).toBe(30_000);
    expect(r.bpjs).toBe(30_000);
    expect(r.total).toBe(120_000);
    expect(r.thp).toBe(2_880_000);
  });

  it("gross 0 -> semua nol", () => {
    const r = calcDeductions(0, {
      ptkp: "TK/0",
      jht: true,
      jp: true,
      bpjs: true,
    });
    expect(r).toEqual({
      gross: 0,
      jht: 0,
      jp: 0,
      bpjs: 0,
      pph21: 0,
      total: 0,
      thp: 0,
    });
  });

  it("gaji tinggi: JP & BPJS mentok cap, JHT tidak", () => {
    const r = calcDeductions(30_000_000, {
      ptkp: "TK/0",
      jht: true,
      jp: true,
      bpjs: true,
    });
    expect(r.jht).toBe(600_000); // 2% x 30jt (tanpa cap)
    expect(r.jp).toBe(110_863); // cap 11.086.300
    expect(r.bpjs).toBe(120_000); // cap 12.000.000
  });

  it("toggle off -> potongan terkait 0, PPh naik (pengurang hilang)", () => {
    const off = calcDeductions(12_000_000, {
      ptkp: "TK/0",
      jht: false,
      jp: false,
      bpjs: false,
    });
    expect(off.jht).toBe(0);
    expect(off.jp).toBe(0);
    expect(off.bpjs).toBe(0);
    // pengurang hanya biaya jabatan 6jt -> neto 138jt -> PKP 84jt
    // 5%x60jt + 15%x24jt = 6.600.000 setahun -> 550.000/bulan
    expect(off.pph21).toBe(550_000);
  });

  it("PTKP lebih besar -> PPh lebih kecil", () => {
    const tk0 = calcDeductions(20_000_000, {
      ptkp: "TK/0",
      jht: true,
      jp: true,
      bpjs: true,
    });
    const k3 = calcDeductions(20_000_000, {
      ptkp: "K/3",
      jht: true,
      jp: true,
      bpjs: true,
    });
    expect(k3.pph21).toBeLessThan(tk0.pph21);
  });
});

describe("calcPph21 — invarian & ketahanan", () => {
  it("input tidak valid -> 0", () => {
    expect(calcPph21(0, PTKP["TK/0"])).toBe(0);
    expect(calcPph21(-5_000_000, PTKP["TK/0"])).toBe(0);
    expect(calcPph21(Number.NaN, PTKP["TK/0"])).toBe(0);
  });

  it("selalu >= 0 dan naik monoton terhadap gross", () => {
    const samples = [0, 1, 1_000_000, 5_000_000, 8_000_000, 12_000_000, 50_000_000];
    let prev = -1;
    for (const g of samples) {
      const pph = calcPph21(g, PTKP["TK/0"]);
      expect(pph).toBeGreaterThanOrEqual(0);
      expect(pph).toBeGreaterThanOrEqual(prev);
      prev = pph;
    }
  });

  it("batas PTKP: penghasilan tepat di PTKP -> PPh 0", () => {
    // gross 4.500.000/bln (54jt/tahun) dgn TK/0: neto setahun setelah biaya
    // jabatan & JHT/JP masih di bawah PTKP -> PPh 0.
    const r = calcDeductions(4_500_000, {
      ptkp: "TK/0",
      jht: true,
      jp: true,
      bpjs: true,
    });
    expect(r.pph21).toBe(0);
  });

  it("PPh 21 sesuai lapisan tarif progresif UU HPP", () => {
    // Verifikasi tarif per lapisan lewat PKP yang dikonstruksi dari bruto.
    // Lapisan 5%: PKP ≤ 60jt. Bruto 10jt/bln, TK/0:
    //   bruto 120jt − biaya jabatan 6jt − (200k+100k)x12 = neto 110.4jt
    //   PKP 56.400.000 -> 5% x 56.4jt = 2.820.000/thn -> 235.000/bln
    const c5 = calcDeductions(10_000_000, {
      ptkp: "TK/0",
      jht: true,
      jp: true,
      bpjs: true,
    });
    expect(c5.pph21).toBe(235_000);

    // Lapisan 15% aktif (PKP > 60jt). Bruto 20jt/bln, TK/0:
    //   bruto 240jt − 6jt − (400k+110.863)x12 = neto 227.869.644
    //   PKP 173.869.000 -> 5%x60jt + 15%x113.869.000 = 3jt + 17.080.350
    //   = 20.080.350/thn -> 1.673.363/bln (dibulatkan)
    const c15 = calcDeductions(20_000_000, {
      ptkp: "TK/0",
      jht: true,
      jp: true,
      bpjs: true,
    });
    expect(c15.pph21).toBe(1_673_363);
  });
});

describe("calcDeductions — invarian struktural", () => {
  const grosses = [
    0, 1, 500_000, 3_000_000, 5_000_000, 8_000_000, 12_000_000, 25_000_000,
    100_000_000,
  ];
  const statuses = ["TK/0", "K/3"] as const;

  it("total = jumlah semua potongan; thp = gross - total; tidak ada negatif", () => {
    for (const gross of grosses) {
      for (const ptkp of statuses) {
        const r = calcDeductions(gross, {
          ptkp,
          jht: true,
          jp: true,
          bpjs: true,
        });
        expect(r.total).toBe(r.jht + r.jp + r.bpjs + r.pph21);
        expect(r.thp).toBe(r.gross - r.total);
        expect(r.jht).toBeGreaterThanOrEqual(0);
        expect(r.jp).toBeGreaterThanOrEqual(0);
        expect(r.bpjs).toBeGreaterThanOrEqual(0);
        expect(r.pph21).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("findGross — solver THP → gross", () => {
  const allOn = { jht: true, jp: true, bpjs: true } as const;

  it("target 0 -> gross 0", () => {
    const r = findGross(0, { ptkp: "TK/0", ...allOn });
    expect(r.gross).toBe(0);
    expect(r.thp).toBe(0);
    expect(r.difference).toBe(0);
  });

  it("round-trip: |thp - target| ≤ 100 untuk banyak target (TK/0)", () => {
    const targets = [
      3_000_000, 4_500_000, 5_000_000, 7_000_000, 8_000_000, 10_000_000,
      11_031_774, 15_000_000, 20_000_000, 35_000_000, 50_000_000, 100_000_000,
    ];
    for (const target of targets) {
      const r = findGross(target, { ptkp: "TK/0", ...allOn });
      expect(Math.abs(r.thp - target)).toBeLessThanOrEqual(100);
      expect(r.gross).toBeGreaterThanOrEqual(target);
      // gross dibulatkan ke atas ke Rp100
      expect(r.gross % 100).toBe(0);
    }
  });

  it("round-trip untuk berbagai status PTKP", () => {
    for (const ptkp of ["TK/0", "TK/3", "K/0", "K/3"] as const) {
      const r = findGross(12_000_000, { ptkp, ...allOn });
      expect(Math.abs(r.thp - 12_000_000)).toBeLessThanOrEqual(100);
    }
  });

  it("round-trip dengan toggle berbeda", () => {
    const variants = [
      { jht: true, jp: true, bpjs: true },
      { jht: true, jp: true, bpjs: false },
      { jht: false, jp: false, bpjs: false },
    ];
    for (const v of variants) {
      const r = findGross(9_000_000, { ptkp: "TK/0", ...v });
      expect(Math.abs(r.thp - 9_000_000)).toBeLessThanOrEqual(100);
    }
  });

  it("THP final tidak pernah di bawah target (karena dibulatkan ke atas)", () => {
    for (const target of [4_000_000, 9_500_000, 25_000_000]) {
      const r = findGross(target, { ptkp: "TK/0", ...allOn });
      expect(r.thp).toBeGreaterThanOrEqual(target);
    }
  });

  it("konsisten dengan calcDeductions pada gross hasil", () => {
    const r = findGross(13_750_000, { ptkp: "K/1", ...allOn });
    const direct = calcDeductions(r.gross, { ptkp: "K/1", ...allOn });
    expect(r).toMatchObject(direct);
  });
});
