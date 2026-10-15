"use client";

import { useState } from "react";

import type { GrossResult } from "@/lib/calculate";
import { buildOfferSummary } from "@/lib/summary";
import type { PtkpStatus } from "@/lib/tax";

interface CopyButtonProps {
  result: GrossResult;
  ptkp: PtkpStatus;
}

type Status = "idle" | "copied" | "error";

/**
 * Tombol salin ringkasan offering letter ke clipboard.
 *
 * Aksesibilitas & feedback (panduan UI UX Pro Max):
 * - Success Feedback: berubah jadi "Tersalin!" + ikon centang.
 * - Toast Notifications: feedback otomatis kembali ke idle (~2,5 dtk).
 * - Gagal-aman bila clipboard diblokir: tampilkan pesan error, tidak crash.
 * - aria-live agar perubahan status diumumkan ke screen reader.
 */
export function CopyButton({ result, ptkp }: CopyButtonProps) {
  const [status, setStatus] = useState<Status>("idle");

  const handleCopy = async () => {
    const text = buildOfferSummary(result, ptkp);
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API tidak tersedia");
      }
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      // Fallback: seleksi teks di textarea tersembunyi.
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        setStatus(ok ? "copied" : "error");
      } catch {
        setStatus("error");
      }
    }
    window.setTimeout(() => setStatus("idle"), 2500);
  };

  const label =
    status === "copied"
      ? "Tersalin!"
      : status === "error"
        ? "Gagal menyalin"
        : "Salin ringkasan";

  return (
    <div>
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
          status === "error"
            ? "border-destructive text-destructive"
            : status === "copied"
              ? "border-success-border bg-success-surface text-success"
              : "border-border bg-surface text-foreground hover:border-muted-foreground/40 hover:bg-background"
        }`}
      >
        {status === "copied" ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )}
        {label}
      </button>
      <p aria-live="polite" className="sr-only">
        {status === "copied"
          ? "Ringkasan tersalin ke clipboard"
          : status === "error"
            ? "Gagal menyalin ringkasan"
            : ""}
      </p>
    </div>
  );
}

function CopyIcon({ className }: { className?: string }) {
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
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
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
