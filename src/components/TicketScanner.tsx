"use client";

import { useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import type { ParsedTicket } from "@/lib/types";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB

export function TicketScanner({ onParsed }: { onParsed: (ticket: ParsedTicket) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function parsePayload(payload: object) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/parse-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process ticket.");
      }

      onParsed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ticket scanning failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(file?: File) {
    if (!file) return;
    setError("");

    // 1. Client-Side Size Gate (< 4 MB)
    if (file.size > MAX_FILE_BYTES) {
      setError(
        `File is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed ticket size is 4 MB.`
      );
      return;
    }

    // 2. Client-Side MIME Gate
    if (!ALLOWED_MIMES.includes(file.type)) {
      setError("Unsupported format. Please upload a JPEG, PNG, WebP image or a PDF ticket.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      parsePayload({
        image: reader.result,
        mimeType: file.type,
      });
    };
    reader.onerror = () => {
      setError("Failed to read the selected file.");
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="card p-6 md:p-8 border border-slate-800 shadow-xl">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
          <Sparkles size={22} />
        </span>
        <div>
          <p className="eyebrow">Zero-Trust AI Ticket Engine</p>
          <h2 className="text-xl font-bold text-white">IRCTC & Transit Scanner</h2>
        </div>
      </div>

      <p className="mb-6 text-sm leading-6 text-slate-400">
        Upload your IRCTC train, flight, or bus ticket. Our rate-limited Gemini Vision parser securely extracts
        your schedule, masks your PNR, and calculates the optimal campus departure window.
      </p>

      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(e) => handleFileUpload(e.target.files?.[0])}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="button-secondary justify-center py-2.5"
        >
          <Upload size={18} />
          Upload Ticket Scan / PDF
        </button>

        <button
          type="button"
          onClick={() => parsePayload({ demo: true })}
          disabled={loading}
          className="button-primary justify-center py-2.5"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <FileText size={18} /> Load Sample IRCTC Ticket
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
        <span>Protected by Sliding-Window Rate Limiting</span>
        <span>Strict 4 MB & MIME Controls</span>
      </div>
    </section>
  );
}
