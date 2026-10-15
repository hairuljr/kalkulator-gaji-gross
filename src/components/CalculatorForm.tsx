"use client";

import { useId } from "react";

import { CurrencyInput } from "@/components/CurrencyInput";
import { PTKP_OPTIONS, type PtkpStatus } from "@/lib/tax";

/** Komponen potongan yang bisa dinyalakan/dimatikan. */
export interface DeductionToggles {
  jht: boolean;
  jp: boolean;
  bpjs: boolean;
}

interface CalculatorFormProps {
  thp: number;
  onThpChange: (value: number) => void;
  ptkp: PtkpStatus;
  onPtkpChange: (value: PtkpStatus) => void;
  toggles: DeductionToggles;
  onToggleChange: (key: keyof DeductionToggles, value: boolean) => void;
  /** Pesan error untuk field THP (opsional). */
  thpError?: string;
}

const TOGGLE_META: {
  key: keyof DeductionToggles;
  label: string;
  detail: string;
}[] = [
  { key: "jht", label: "JHT", detail: "Jaminan Hari Tua — 2%" },
  { key: "jp", label: "JP", detail: "Jaminan Pensiun — 1%" },
  { key: "bpjs", label: "BPJS Kesehatan", detail: "1% (maks. upah Rp12 jt)" },
];

export function CalculatorForm({
  thp,
  onThpChange,
  ptkp,
  onPtkpChange,
  toggles,
  onToggleChange,
  thpError,
}: CalculatorFormProps) {
  const ptkpId = useId();

  return (
    <div className="space-y-5">
      <CurrencyInput
        label="Take Home Pay (Rp)"
        value={thp}
        onChange={onThpChange}
        error={thpError}
        hint="Nominal bersih yang diminta kandidat per bulan."
        placeholder="0"
        autoFocus
      />

      <div>
        <label
          htmlFor={ptkpId}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Status PTKP
        </label>
        <select
          id={ptkpId}
          value={ptkp}
          onChange={(event) => onPtkpChange(event.target.value as PtkpStatus)}
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-foreground shadow-sm outline-none transition-colors hover:border-muted-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        >
          {PTKP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Menentukan PTKP tahunan untuk perhitungan PPh 21.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">
          Komponen potongan
        </legend>
        <div className="flex flex-wrap gap-2">
          {TOGGLE_META.map(({ key, label, detail }) => {
            const active = toggles[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                title={detail}
                onClick={() => onToggleChange(key, !active)}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    active
                      ? "border-primary bg-primary text-on-primary"
                      : "border-muted-foreground/40 bg-transparent"
                  }`}
                >
                  {active ? (
                    <CheckIcon className="h-3 w-3" />
                  ) : null}
                </span>
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Matikan komponen yang tidak dipotong perusahaan.
        </p>
      </fieldset>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
