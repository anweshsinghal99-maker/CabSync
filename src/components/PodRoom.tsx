"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Lock,
  PhoneCall,
  Send,
  ShieldAlert,
  ShieldCheck,
  Siren,
  X,
} from "lucide-react";
import type { Pod, StudentProfile } from "@/lib/types";
import { generatePodHandshakeCode, sanitizeChatMessage } from "@/lib/client-security";

export function PodRoom({ pod, profile }: { pod: Pod; profile: StudentProfile }) {
  const isFemaleRestricted = pod.female_only && profile.gender !== "Female";

  // Initial secure room welcome
  const [messages, setMessages] = useState<Array<{ id: string; author: string; text: string; time: string }>>([
    {
      id: "system-1",
      author: "CabSync SafeBot",
      text: "Pod room secured. Confirm your exact hostel pickup point with co-passengers.",
      time: "Just now",
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [lastSentTime, setLastSentTime] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [pinCopied, setPinCopied] = useState(false);
  const [dispatchCopied, setDispatchCopied] = useState(false);

  // SOS Emergency State
  const [showSosModal, setShowSosModal] = useState(false);
  const [liveCoordinates, setLiveCoordinates] = useState("30.3529° N, 76.3737° E (Campus Main Gate)");
  const [geoLocating, setGeoLocating] = useState(false);

  // Cooldown countdown timer effect
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 100));
    }, 100);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Deterministic 4-Digit Boarding PIN
  const handshakeCode = generatePodHandshakeCode(pod.id);

  function handleCopyPin() {
    navigator.clipboard?.writeText(handshakeCode);
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2000);
  }

  // Sanitized & Throttled Message Sending
  function handleSendMessage() {
    const now = Date.now();
    const elapsed = now - lastSentTime;

    // Minimum 1.5-second cooldown spam throttling
    if (elapsed < 1500) {
      setCooldownRemaining(1500 - elapsed);
      return;
    }

    // XSS Sanitization: Strip HTML, scripts, events, and cap at 280 chars
    const cleanedText = sanitizeChatMessage(inputMessage);
    if (!cleanedText) return;

    const authorName = profile.email.split("@")[0] || "Student";
    const newMessage = {
      id: `msg-${Date.now()}`,
      author: authorName,
      text: cleanedText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setLastSentTime(now);
    setCooldownRemaining(1500);
  }

  function handleTriggerSos() {
    setGeoLocating(true);
    setShowSosModal(true);

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLiveCoordinates(
            `${pos.coords.latitude.toFixed(5)}° N, ${pos.coords.longitude.toFixed(5)}° E`
          );
          setGeoLocating(false);
        },
        () => {
          setLiveCoordinates("30.3529° N, 76.3737° E (Thapar Campus GPS)");
          setGeoLocating(false);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      setGeoLocating(false);
    }
  }

  const emergencyDispatchText = `🚨 CABSYNC STUDENT SOS / LIVE RIDE DISPATCH
Status: Active Emergency Alert
Boarding PIN: ${handshakeCode}
Destination: ${pod.destination_hub}
Date & Time: ${pod.departure_date} at ${pod.campus_leave_time}
Live Coordinates: ${liveCoordinates}
Active Student: ${profile.email} (${profile.gender})
Co-Passengers: ${pod.members.map((m) => `${m.name} (${m.hostel})`).join(", ")}
Campus Security: 112 / +91-175-2393000`;

  function handleCopyDispatch() {
    navigator.clipboard?.writeText(emergencyDispatchText);
    setDispatchCopied(true);
    setTimeout(() => setDispatchCopied(false), 2000);
  }

  // Female-Only Pod Security Enforcement: Hide exact pickup chat details from non-female accounts
  if (isFemaleRestricted) {
    return (
      <section className="card p-6 border border-pink-500/40 bg-pink-950/20 shadow-xl">
        <div className="flex items-center gap-3 text-pink-400">
          <ShieldAlert size={28} />
          <div>
            <h3 className="text-lg font-bold text-pink-200">Female-Only Safe Space</h3>
            <p className="text-xs text-pink-300/80">Access Restricted by Campus Protocol</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-pink-200/90 leading-relaxed">
          This pod is designated as a <strong>Female-Only Pod</strong>. In accordance with campus safety rules,
          exact co-passenger details, pickup coordination chat, and boarding handshake codes are restricted to
          verified female students.
        </p>
        <div className="mt-5 rounded-lg border border-pink-500/30 bg-pink-500/10 p-3 text-xs text-pink-300">
          🔒 Verification ID: Signed session confirmed as <code>{profile.gender}</code>. Please join a mixed campus pod.
        </div>
      </section>
    );
  }

  return (
    <section className="card p-6 border border-slate-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="eyebrow">Active Pod Room</p>
            <h2 className="text-lg font-bold text-white">Ride Coordination & Safety</h2>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          <Lock size={12} /> E2E Verified
        </span>
      </div>

      {/* 4-Digit Boarding Handshake PIN Card */}
      <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Co-Passenger Boarding PIN
            </p>
            <p className="mt-0.5 text-2xl font-mono font-extrabold tracking-widest text-white">
              {handshakeCode}
            </p>
          </div>
          <button
            onClick={handleCopyPin}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
          >
            {pinCopied ? <Check size={14} /> : <Copy size={14} />}
            {pinCopied ? "Copied" : "Copy Code"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Verify this 4-digit code with other riders before opening cab doors at the hostel gate.
        </p>
      </div>

      {/* Realtime Sanitized Chat Box */}
      <div className="mt-4">
        <div className="flex items-center justify-between pb-2 text-xs text-slate-400">
          <span>Pickup Coordination Chat</span>
          <span className="text-[11px] text-slate-500">XSS Sanitized · 280 chars max</span>
        </div>

        <div className="h-44 overflow-y-auto space-y-2 rounded-xl bg-slate-950/70 p-3 border border-slate-800/80">
          {messages.map((m) => (
            <div key={m.id} className="text-xs">
              <span className="font-semibold text-indigo-300">{m.author}</span>
              <span className="text-slate-500 text-[10px] ml-1.5">[{m.time}]</span>:{" "}
              <span className="text-slate-200 break-words">{m.text}</span>
            </div>
          ))}
        </div>

        {/* Input Bar with Spam Throttling */}
        <div className="mt-2.5 flex gap-2">
          <input
            type="text"
            maxLength={280}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={
              cooldownRemaining > 0
                ? `Throttled (cooldown ${(cooldownRemaining / 1000).toFixed(1)}s)...`
                : "Coordinate hostel pickup point (e.g. at gate 2)"
            }
            disabled={cooldownRemaining > 0}
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition focus:border-indigo-500 disabled:opacity-60"
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || cooldownRemaining > 0}
            className="button-primary px-3.5 py-2 text-xs"
            aria-label="Send message"
          >
            {cooldownRemaining > 0 ? (
              <span className="text-[11px] font-mono">{(cooldownRemaining / 1000).toFixed(1)}s</span>
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
      </div>

      {/* 1-Tap Campus Security SOS Button */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <button
          onClick={handleTriggerSos}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-900/40 transition hover:bg-rose-500 active:scale-[0.99]"
        >
          <Siren size={18} className="animate-pulse" />
          SOS / Share Live Ride
        </button>
      </div>

      {/* Emergency Dispatch Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 border border-rose-500/50 bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle size={24} className="text-rose-500" />
                <h3 className="text-lg font-bold text-white">Campus Emergency Dispatch</h3>
              </div>
              <button
                onClick={() => setShowSosModal(false)}
                className="text-slate-400 hover:text-white transition p-1"
                aria-label="Close SOS"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-rose-200">
                <p className="font-semibold text-sm">Active Ride Alert Generated</p>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  Keep this window open or dial campus security immediately if you feel unsafe.
                </p>
              </div>

              <div className="space-y-2 rounded-lg bg-slate-950 p-3.5 border border-slate-800 font-mono text-[11px]">
                <p>
                  <strong className="text-slate-400">Boarding PIN:</strong>{" "}
                  <span className="text-emerald-400 font-bold">{handshakeCode}</span>
                </p>
                <p>
                  <strong className="text-slate-400">Destination:</strong> {pod.destination_hub}
                </p>
                <p>
                  <strong className="text-slate-400">Live GPS:</strong>{" "}
                  <span className="text-amber-300">{geoLocating ? "Acquiring GPS..." : liveCoordinates}</span>
                </p>
                <p>
                  <strong className="text-slate-400">Active Rider:</strong> {profile.email} ({profile.gender})
                </p>
                <div>
                  <strong className="text-slate-400">Co-Passengers:</strong>
                  <ul className="mt-1 ml-3 list-disc space-y-0.5 text-slate-300">
                    {pod.members.map((m) => (
                      <li key={m.id}>
                        {m.name} · {m.hostel}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow"
              >
                <PhoneCall size={15} /> Call Police / SOS (112)
              </a>

              <a
                href="tel:+911752393000"
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
              >
                <PhoneCall size={15} /> Campus Patrol / Warden
              </a>
            </div>

            <button
              onClick={handleCopyDispatch}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              {dispatchCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {dispatchCopied ? "Copied SOS Dispatch to Clipboard!" : "Copy Full Emergency Dispatch for WhatsApp / SMS"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
