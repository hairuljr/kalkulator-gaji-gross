import { describe, expect, it } from "vitest";

import { isThpComputable, validateThp } from "./validate";

describe("validateThp", () => {
  it("belum diisi (0) -> bukan error", () => {
    expect(validateThp(0)).toBeNull();
  });

  it("nilai valid -> null", () => {
    expect(validateThp(5_000_000)).toBeNull();
    expect(validateThp(100_000)).toBeNull();
    expect(validateThp(1_000_000_000)).toBeNull();
  });

  it("terlalu kecil -> pesan error", () => {
    expect(validateThp(50_000)).toMatch(/terlalu kecil/i);
  });

  it("negatif -> pesan error", () => {
    expect(validateThp(-1)).toMatch(/negatif/i);
  });

  it("terlalu besar -> pesan error", () => {
    expect(validateThp(2_000_000_000)).toMatch(/terlalu besar/i);
  });

  it("non-finite -> pesan error", () => {
    expect(validateThp(Number.NaN)).toMatch(/valid/i);
    expect(validateThp(Number.POSITIVE_INFINITY)).toMatch(/valid/i);
  });
});

describe("isThpComputable", () => {
  it("true hanya untuk rentang yang dihitung", () => {
    expect(isThpComputable(0)).toBe(false);
    expect(isThpComputable(50_000)).toBe(false);
    expect(isThpComputable(2_000_000_000)).toBe(false);
    expect(isThpComputable(Number.NaN)).toBe(false);
    expect(isThpComputable(5_000_000)).toBe(true);
    expect(isThpComputable(100_000)).toBe(true);
  });
});
