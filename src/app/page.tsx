import { Calculator } from "@/components/Calculator";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        {/* Header */}
        <header className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <CalculatorIcon className="h-3.5 w-3.5 text-primary" />
            Kalkulator Gaji
          </div>
          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Tools Mencari Gaji Gross
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Kandidat meminta Take Home Pay sebesar nominal tertentu. Berapa gaji
            gross yang perlu dicantumkan dalam penawaran kerja? Tools ini
            membantu HRD memperoleh estimasi gaji kotor setelah memperhitungkan
            JHT, JP, BPJS, dan PPh 21.
          </p>
        </header>

        <Calculator />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Estimasi bersifat indikatif. Tarif pajak &amp; batas upah mengikuti
          regulasi yang berlaku.
        </p>
      </div>
    </div>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
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
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="8" x2="8" y1="14" y2="14" />
      <line x1="12" x2="12" y1="14" y2="14" />
      <line x1="16" x2="16" y1="14" y2="14" />
      <line x1="8" x2="8" y1="18" y2="18" />
      <line x1="12" x2="12" y1="18" y2="18" />
      <line x1="16" x2="16" y1="18" y2="18" />
    </svg>
  );
}
