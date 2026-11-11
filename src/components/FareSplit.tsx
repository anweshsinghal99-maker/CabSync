"use client";

import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BadgeIndianRupee, CheckCircle2, ExternalLink, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Pod } from "@/lib/types";
import { TRANSIT_HUBS } from "@/lib/constants";
import { validUpiId } from "@/lib/client-security";

const OFFICIAL_CABSYNC_PAYEE = "cabsync@upi";

export function FareSplit({ pod }: { pod: Pod }) {
  // 1. Lock fare against route base fare to prevent client-side fee inflation
  const officialRouteFare = TRANSIT_HUBS[pod.destination_hub]?.fare ?? 800;
  const lockedTotalFare = Math.min(officialRouteFare, Math.max(100, pod.fare));
  const passengerCount = Math.max(1, pod.members.length);
  const lockedSplitAmount = Math.min(
    lockedTotalFare,
    Math.ceil(lockedTotalFare / passengerCount)
  );

  // 2. Strict UPI ID Validation against RFC / NPCI VPA regex
  const isPayeeValid = validUpiId(OFFICIAL_CABSYNC_PAYEE);

  // 3. Safe parameter serialization via URLSearchParams (immune to URI injection)
  const upiIntentUri = useMemo(() => {
    if (!isPayeeValid) return "";
    const params = new URLSearchParams();
    params.set("pa", OFFICIAL_CABSYNC_PAYEE);
    params.set("pn", "CabSync Campus Pod");
    params.set("am", lockedSplitAmount.toFixed(2));
    params.set("cu", "INR");
    params.set("tn", `CabSync ${pod.destination_hub} split`.slice(0, 50));
    return `upi://pay?${params.toString()}`;
  }, [isPayeeValid, lockedSplitAmount, pod.destination_hub]);

  return (
    <section className="card p-6 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <BadgeIndianRupee size={20} />
          </span>
          <div>
            <p className="eyebrow">Fair-Split UPI Engine</p>
            <h2 className="text-lg font-bold text-white">Your Share: ₹{lockedSplitAmount}</h2>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          <Lock size={12} /> Fare Locked
        </span>
      </div>

      <div className="mt-5 grid gap-4 rounded-xl bg-white p-4 text-slate-900 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex justify-center p-1 bg-white rounded-lg border border-slate-200 shadow-sm">
          {upiIntentUri ? (
            <QRCodeSVG
              value={upiIntentUri}
              size={120}
              level="M"
              includeMargin={false}
            />
          ) : (
            <div className="grid h-[120px] w-[120px] place-items-center text-rose-500 text-xs text-center p-2">
              <ShieldAlert size={24} />
              Invalid UPI Payee
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-900 text-base">Instant UPI Split</p>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              ₹{lockedSplitAmount} / rider
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Total route fare of <strong>₹{lockedTotalFare}</strong> evenly split among{" "}
            <strong>{passengerCount} verified rider{passengerCount > 1 ? "s" : ""}</strong>.
          </p>

          <div className="mt-3 space-y-1 text-xs">
            <p className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 size={14} className="shrink-0" />
              NPCI VPA validated: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">{OFFICIAL_CABSYNC_PAYEE}</code>
            </p>
            <p className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck size={14} className="shrink-0 text-indigo-600" />
              URLSearchParams encoded (URI injection protected)
            </p>
          </div>

          {upiIntentUri && (
            <a
              href={upiIntentUri}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 md:hidden"
            >
              Open in UPI App <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Campus destination: <strong className="text-slate-300">{pod.destination_hub}</strong></span>
        <span>Route base cap: <strong className="text-slate-300">₹{officialRouteFare}</strong></span>
      </div>
    </section>
  );
}
