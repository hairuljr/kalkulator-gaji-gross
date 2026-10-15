"use client";

import { useId, useState } from "react";

import { formatRupiah, formatRupiahInput, parseRupiah } from "@/lib/format";

interface CurrencyInputProps {
  /** Label terlihat (wajib — jangan pakai placeholder sebagai label). */
  label: string;
  /** Nilai numerik terkontrol. */
  value: number;
  /** Callback saat nilai berubah (sudah dalam bentuk number). */
  onChange: (value: number) => void;
  /** Pesan error inline; bila ada, dihubungkan lewat aria-describedby. */
  error?: string;
  /** Petunjuk singkat di bawah input. */
  hint?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Input mata uang Rupiah dengan format live saat mengetik.
 *
 * Aksesibilitas (panduan UI UX Pro Max):
 * - Label terlihat terhubung via htmlFor/id.
 * - Error inline dihubungkan dengan aria-describedby + aria-invalid.
 * - inputMode numeric agar keyboard angka muncul di mobile.
 */
export function CurrencyInput({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder = "0",
  autoFocus,
}: CurrencyInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  const [display, setDisplay] = useState(() => (value ? formatRupiah(value) : ""));

  // Sinkronkan bila nilai dari parent berubah dari luar (mis. reset), tanpa
  // memakai effect: pola "adjust state during render" yang direkomendasikan React.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDisplay(value ? formatRupiah(value) : "");
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-medium text-muted-foreground"
        >
          Rp
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          value={display}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            const raw = event.target.value;
            setDisplay(formatRupiahInput(raw));
            onChange(parseRupiah(raw));
          }}
          className={`tabular-nums h-11 w-full rounded-xl border bg-surface pl-10 pr-3 text-base text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
            error
              ? "border-destructive focus-visible:ring-destructive"
              : "border-border hover:border-muted-foreground/40"
          }`}
        />
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
