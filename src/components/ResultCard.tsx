import { formatRupiah } from "@/lib/format";
import type { GrossResult } from "@/lib/calculate";
import type { PtkpStatus } from "@/lib/tax";
import { CopyButton } from "@/components/CopyButton";

interface ResultCardProps {
  /** Hasil kalkulasi; null = belum ada input valid. */
  result: GrossResult | null;
  /** Status PTKP (untuk ringkasan salin). */
  ptkp: PtkpStatus;
}

/**
 * Kartu hasil: highlight Gross Salary + rincian potongan + THP.
 *
 * Aksesibilitas & keterbacaan (panduan UI UX Pro Max):
 * - Angka pakai `tabular-nums` + pemisah ribuan (Number Formatting, High).
 * - Label status jelas; breakdown memakai <dl> semantik.
 */
export function ResultCard({ result, ptkp }: ResultCardProps) {
  if (!result) {
    return (
      <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background p-8 text-center">
        <EmptyIcon className="h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">
          Masukkan Take Home Pay untuk melihat estimasi gaji gross.
        </p>
      </div>
    );
  }

  const rows = [
    { key: "jht", label: "JHT (2%)", value: result.jht },
    { key: "jp", label: "JP (1%)", value: result.jp },
    { key: "bpjs", label: "BPJS Kesehatan (1%)", value: result.bpjs },
    { key: "pph21", label: "PPh 21", value: result.pph21 },
  ];

  return (
    <div className="space-y-5">
      {/* Highlight Gross Salary */}
      <div className="rounded-xl border border-success-border bg-success-surface p-5">
        <p className="text-sm font-medium text-success">
          Gross Salary (estimasi)
        </p>
        <p className="tabular-nums mt-1 font-heading text-3xl font-semibold text-success sm:text-4xl">
          {formatRupiah(result.gross)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Gaji kotor yang perlu dicantumkan di offering letter.
        </p>
      </div>

      {/* Rincian potongan */}
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="tabular-nums text-sm font-medium text-foreground">
              {row.value > 0 ? `- ${formatRupiah(row.value)}` : formatRupiah(0)}
            </dd>
          </div>
        ))}
      </dl>

      {/* Total potongan */}
      <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
        <span className="text-sm font-medium text-foreground">
          Total potongan
        </span>
        <span className="tabular-nums text-sm font-semibold text-foreground">
          - {formatRupiah(result.total)}
        </span>
      </div>

      {/* THP */}
      <div className="flex items-center justify-between gap-4 rounded-xl bg-background px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          Take Home Pay
        </span>
        <span className="tabular-nums font-heading text-lg font-semibold text-foreground">
          {formatRupiah(result.thp)}
        </span>
      </div>

      <CopyButton result={result} ptkp={ptkp} />
    </div>
  );
}

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}
