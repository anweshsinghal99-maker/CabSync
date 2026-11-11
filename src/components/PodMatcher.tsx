"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Crown, Lock, ShieldAlert, ShieldCheck, Sparkles, Users } from "lucide-react";
import { CAMPUS_NODES, TRANSIT_HUBS, type HostelKey } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type { LuggageSize, ParsedTicket, Pod, StudentProfile } from "@/lib/types";
import { fmtTime, timeToMinutes } from "@/lib/utils";

const INITIAL_LIVE_PODS: Pod[] = [
  {
    id: "rajpura-live",
    destination_hub: "Rajpura Junction Railway Station",
    departure_date: "2026-11-15",
    campus_leave_time: "17:15",
    female_only: false,
    fare: 800,
    members: [
      { id: "1", name: "Riya Mehta", hostel: "Hostel FRG / Block F", luggage: "Medium", female: true },
      { id: "2", name: "Kabir Singh", hostel: "Hostel M / O Cluster", luggage: "Small" },
    ],
  },
  {
    id: "airport-live",
    destination_hub: "Chandigarh Airport (IXC) / ISBT-43",
    departure_date: "2026-11-16",
    campus_leave_time: "10:00",
    female_only: true,
    fare: 1800,
    members: [
      { id: "3", name: "Ananya Gupta", hostel: "Girls Hostel Cluster (E / G / I / N)", luggage: "Large", female: true },
    ],
  },
  {
    id: "rajpura-girls-live",
    destination_hub: "Rajpura Junction Railway Station",
    departure_date: "2026-11-15",
    campus_leave_time: "17:00",
    female_only: true,
    fare: 800,
    members: [
      { id: "4", name: "Tanvi Sharma", hostel: "Girls Hostel Cluster (E / G / I / N)", luggage: "Medium", female: true },
    ],
  },
];

export function PodMatcher({
  ticket,
  profile,
  onPod,
}: {
  ticket: ParsedTicket;
  profile: StudentProfile;
  onPod: (pod: Pod) => void;
}) {
  const [hostel, setHostel] = useState<HostelKey>("Hostel FRG / Block F");
  const [luggage, setLuggage] = useState<LuggageSize>("Medium");
  const [requestFemaleOnly, setRequestFemaleOnly] = useState(profile.gender === "Female");
  const [pods, setPods] = useState<Pod[]>(INITIAL_LIVE_PODS);
  const [joinedPodId, setJoinedPodId] = useState<string | null>(null);
  const [securityNotice, setSecurityNotice] = useState<string>("");

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    client
      .from("pods")
      .select("*")
      .then(({ data }) => {
        if (data?.length) setPods([...INITIAL_LIVE_PODS, ...(data as Pod[])]);
      });

    const channel = client
      .channel("pods-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "pods" }, () => {
        client
          .from("pods")
          .select("*")
          .then(({ data }) => {
            if (data?.length) setPods([...INITIAL_LIVE_PODS, ...(data as Pod[])]);
          });
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  // Filter pods matching destination & date & +/- 45 mins of campus exit
  const matchedPods = useMemo(() => {
    return pods.filter((p) => {
      const sameHub = p.destination_hub === ticket.destination_hub;
      const sameDate = p.departure_date === ticket.departure_date;
      const timeDiff = Math.abs(
        timeToMinutes(p.campus_leave_time) - timeToMinutes(ticket.recommended_campus_leave_time)
      );
      const timeWindowMatch = timeDiff <= 45;

      // Luggage and seat capacity constraint (max 4 passengers, or 3 if >=2 large bags)
      const largeBags =
        p.members.filter((x) => x.luggage === "Large").length + (luggage === "Large" ? 1 : 0);
      const capacityLimit = largeBags >= 2 ? 3 : 4;
      const hasSeat = p.members.length < capacityLimit;

      return sameHub && sameDate && timeWindowMatch && hasSeat;
    });
  }, [pods, ticket, luggage]);

  // Strict Female-Only Pod Access Control Enforcement
  function handleJoin(podToJoin: Pod) {
    setSecurityNotice("");
    if (podToJoin.female_only && profile.gender !== "Female") {
      setSecurityNotice(
        "Security Enforcement: Access denied to Female-Only Pod. This pod is strictly restricted to verified female students."
      );
      return;
    }

    const updatedPod: Pod = {
      ...podToJoin,
      members: [
        ...podToJoin.members,
        {
          id: `member-${Date.now()}`,
          name: ticket.passenger_name,
          hostel,
          luggage,
          female: profile.gender === "Female",
        },
      ],
    };

    setPods((prev) => prev.map((item) => (item.id === podToJoin.id ? updatedPod : item)));
    setJoinedPodId(updatedPod.id);
    onPod(updatedPod);
  }

  function handleCreatePod() {
    setSecurityNotice("");
    const isFemalePod = requestFemaleOnly && profile.gender === "Female";
    const routeFare = TRANSIT_HUBS[ticket.destination_hub]?.fare || 800;

    const newPod: Pod = {
      id: `pod-${Date.now().toString(36)}`,
      destination_hub: ticket.destination_hub,
      departure_date: ticket.departure_date,
      campus_leave_time: ticket.recommended_campus_leave_time,
      female_only: isFemalePod,
      fare: routeFare,
      members: [
        {
          id: "creator",
          name: ticket.passenger_name,
          hostel,
          luggage,
          female: profile.gender === "Female",
        },
      ],
    };

    setPods((prev) => [newPod, ...prev]);
    setJoinedPodId(newPod.id);
    onPod(newPod);
  }

  return (
    <section className="card p-6 md:p-8 border border-slate-800 shadow-xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Users size={20} />
          </span>
          <div>
            <p className="eyebrow">Smart Transit Pod Matcher</p>
            <h2 className="text-xl font-bold text-white">Select or Launch Your Pod</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profile.gender === "Female" ? (
            <span className="flex items-center gap-1 rounded-full border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 text-xs font-semibold text-pink-300">
              <ShieldCheck size={13} /> Verified Female Student
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
              Verified Student ({profile.gender})
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="field">
          Hostel Pickup Point
          <select
            value={hostel}
            onChange={(e) => setHostel(e.target.value as HostelKey)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
          >
            {Object.keys(CAMPUS_NODES).map((block) => (
              <option key={block} value={block}>
                {block}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Luggage Size
          <select
            value={luggage}
            onChange={(e) => setLuggage(e.target.value as LuggageSize)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="Small">Small (Backpack / Laptop bag)</option>
            <option value="Medium">Medium (Cabin trolley)</option>
            <option value="Large">Large (Checked-in suitcase)</option>
          </select>
        </label>

        <div className="flex flex-col justify-end">
          <label
            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-xs transition ${
              profile.gender === "Female"
                ? "border-pink-500/30 bg-pink-500/10 text-pink-200 hover:bg-pink-500/15"
                : "border-slate-800 bg-slate-900/40 text-slate-500 cursor-not-allowed"
            }`}
          >
            <input
              type="checkbox"
              className="accent-pink-500"
              checked={requestFemaleOnly}
              disabled={profile.gender !== "Female"}
              onChange={(e) => setRequestFemaleOnly(e.target.checked)}
            />
            <ShieldCheck size={16} className={profile.gender === "Female" ? "text-pink-400" : "text-slate-600"} />
            <span className="font-medium">
              Create Female-Only Pod {profile.gender !== "Female" && "(Restricted)"}
            </span>
          </label>
        </div>
      </div>

      {securityNotice && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          <ShieldAlert size={18} className="shrink-0 text-rose-400" />
          <span>{securityNotice}</span>
        </div>
      )}

      {/* Available Pods List */}
      <div className="mt-6 space-y-3">
        {matchedPods.map((p) => {
          const isJoined = joinedPodId === p.id;
          const isFemaleRestricted = p.female_only && profile.gender !== "Female";
          const perPersonFare = Math.ceil(p.fare / (p.members.length + 1));

          return (
            <div
              key={p.id}
              className={`rounded-xl border p-4 transition ${
                p.female_only
                  ? "border-pink-500/30 bg-pink-500/5"
                  : "border-emerald-500/25 bg-emerald-500/5"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-100 text-base">{p.destination_hub}</p>
                    {p.female_only ? (
                      <span className="flex items-center gap-1 rounded-full border border-pink-500/30 bg-pink-500/10 px-2 py-0.5 text-[11px] font-semibold text-pink-300">
                        <Lock size={10} /> Female-Only Pod
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                        Mixed Campus Pod
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">
                    Hostel departure: <strong className="text-slate-200">{fmtTime(p.campus_leave_time)}</strong> ·{" "}
                    Occupancy: <strong className="text-slate-200">{p.members.length}/4 seats</strong> · Estimated fare:{" "}
                    <strong className="text-emerald-400">₹{perPersonFare}/rider</strong>
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                    <span>Riders:</span>
                    {p.members.map((m) => (
                      <span
                        key={m.id}
                        className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700/60"
                      >
                        {m.name} ({m.hostel.split("/")[0].trim()})
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  {isFemaleRestricted ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-300 flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                        <Lock size={13} /> Female Students Only
                      </span>
                    </div>
                  ) : (
                    <button
                      className="button-primary text-sm px-4 py-2"
                      onClick={() => handleJoin(p)}
                      disabled={Boolean(joinedPodId)}
                    >
                      {isJoined ? (
                        <>
                          <Check size={16} /> Joined
                        </>
                      ) : (
                        "1-Tap Join Pod"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {matchedPods.length === 0 && !joinedPodId && (
          <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
            <Crown className="mx-auto mb-2 text-amber-400" size={26} />
            <p className="text-sm font-medium text-slate-300">No active pod matching your exact schedule yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Be the pod leader! Start a verified campus pod for {ticket.destination_hub} at{" "}
              {fmtTime(ticket.recommended_campus_leave_time)}.
            </p>
            <button className="button-primary mt-4" onClick={handleCreatePod}>
              <Sparkles size={16} /> Create New Campus Pod
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
