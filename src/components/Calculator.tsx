"use client";

import { useMemo, useState } from "react";

import {
  CalculatorForm,
  type DeductionToggles,
} from "@/components/CalculatorForm";
import { ResultCard } from "@/components/ResultCard";
import { findGross } from "@/lib/calculate";
import type { PtkpStatus } from "@/lib/tax";
import { isThpComputable, validateThp } from "@/lib/validate";

export function Calculator() {
  const [thp, setThp] = useState(0);
  const [ptkp, setPtkp] = useState<PtkpStatus>("TK/0");
  const [toggles, setToggles] = useState<DeductionToggles>({
    jht: true,
    jp: true,
    bpjs: true,
  });

  const handleToggleChange = (key: keyof DeductionToggles, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
  };

  // Hasil dihitung hanya bila THP valid; null = belum diisi / tidak valid.
  const result = useMemo(() => {
    if (!isThpComputable(thp)) return null;
    return findGross(thp, { ptkp, ...toggles });
  }, [thp, ptkp, toggles]);

  const thpError = validateThp(thp) ?? undefined;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Kartu Form Input */}
      <section
        aria-labelledby="form-heading"
        className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-7"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FormIcon className="h-5 w-5" />
          </span>
          <div>
            <h2
              id="form-heading"
              className="font-heading text-lg font-semibold text-foreground"
            >
              Form Input
            </h2>
            <p className="text-sm text-muted-foreground">
              Masukkan target Take Home Pay kandidat.
            </p>
          </div>
        </div>

        <CalculatorForm
          thp={thp}
          onThpChange={setThp}
          ptkp={ptkp}
          onPtkpChange={setPtkp}
          toggles={toggles}
          onToggleChange={handleToggleChange}
          thpError={thpError}
        />
      </section>

      {/* Kartu Hasil — diisi penuh pada TASK-09 */}
      <section
        aria-labelledby="result-heading"
        className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-7"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
            <ChartIcon className="h-5 w-5" />
          </span>
          <div>
            <h2
              id="result-heading"
              className="font-heading text-lg font-semibold text-foreground"
            >
              Hasil
            </h2>
            <p className="text-sm text-muted-foreground">
              Estimasi gaji gross &amp; rincian potongan.
            </p>
          </div>
        </div>

        <ResultCard result={result} ptkp={ptkp} />
      </section>
    </div>
  );
}

function FormIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4h16v16H4z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </svg>
  );
}
