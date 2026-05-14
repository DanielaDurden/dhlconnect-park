"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { DayStatus, Profile, UserDayStatus } from "@/types";

interface TeamStatus {
  user_id: string;
  date: string;
  status: DayStatus;
  profiles: { full_name: string; area: string };
}

interface Props {
  profile: Pick<Profile, "id" | "full_name" | "area">;
  role?: string;
  weekDates: string[];
  myStatuses: UserDayStatus[];
  teamStatuses: TeamStatus[];
  today: string;
}

const STATUS_OPTIONS: { value: DayStatus; label: string; icon: React.ReactNode; description: string; colors: string }[] = [
  {
    value: "office",
    label: "En Oficina",
    description: "Estaré en el CE",
    colors: "border-green-500 bg-green-50 text-green-800",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
        <path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/>
        <path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/>
        <path d="M8 10h.01"/><path d="M8 14h.01"/>
      </svg>
    ),
  },
  {
    value: "site",
    label: "En Site",
    description: "Voy a un centro de distribución",
    colors: "border-purple-500 bg-purple-50 text-purple-800",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
      </svg>
    ),
  },
  {
    value: "home_office",
    label: "Home Office",
    description: "Trabajo desde casa",
    colors: "border-blue-500 bg-blue-50 text-blue-800",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    value: "vacation",
    label: "Vacaciones",
    description: "Fuera de disponibilidad",
    colors: "border-orange-400 bg-orange-50 text-orange-800",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2"/><path d="M12 20v2"/>
        <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
        <path d="M2 12h2"/><path d="M20 12h2"/>
        <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
      </svg>
    ),
  },
];

function getStatusColor(status: DayStatus): string {
  switch (status) {
    case "office": return "bg-green-100 border-green-500 text-green-800";
    case "site": return "bg-purple-100 border-purple-500 text-purple-800";
    case "home_office": return "bg-blue-100 border-blue-500 text-blue-800";
    case "vacation": return "bg-orange-100 border-orange-500 text-orange-800";
  }
}

function getDayName(dateStr: string): { full: string } {
  const date = new Date(dateStr + "T12:00:00");
  return {
    full: date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric" }),
  };
}

export default function StatusForm({ profile, role, weekDates, myStatuses, teamStatuses, today }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, DayStatus>>(
    Object.fromEntries(myStatuses.map((s) => [s.date, s.status]))
  );
  const router = useRouter();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function setStatus(date: string, status: DayStatus) {
    setSaving(date);
    const supabase = createClient();

    const { error } = await supabase
      .from("user_day_status")
      .upsert(
        {
          user_id: profile.id,
          date,
          status,
        },
        { onConflict: "user_id,date" }
      );

    if (!error) {
      setLocalStatuses((prev) => ({ ...prev, [date]: status }));
      showToast("Estado actualizado");
      router.refresh();
    } else {
      showToast("Error al guardar. Intenta de nuevo.");
    }
    setSaving(null);
  }

  const teamByStatus = {
    office: teamStatuses.filter((s) => s.status === "office"),
    site: teamStatuses.filter((s) => s.status === "site"),
    home_office: teamStatuses.filter((s) => s.status === "home_office"),
    vacation: teamStatuses.filter((s) => s.status === "vacation"),
  };

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:space-y-0 lg:items-start">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-0 right-0 mx-4 z-50">
          <div className="bg-dhl-dark text-white text-sm rounded-xl px-4 py-3 shadow-xl max-w-lg mx-auto text-center">
            {toast}
          </div>
        </div>
      )}

      {/* Weekly Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray overflow-hidden">
        <div className="bg-dhl-yellow px-4 py-3">
          <h2 className="text-dhl-dark font-bold text-sm">Mi semana</h2>
        </div>
        <div className="p-4 space-y-3">
          {weekDates.map((date) => {
            const { full } = getDayName(date);
            const currentStatus = localStatuses[date];
            const isToday = date === today;
            const isPast = date < today;

            return (
              <div key={date} className={`rounded-xl overflow-hidden border ${isToday ? "border-dhl-red" : "border-dhl-mid-gray"}`}>
                <div className={`flex items-center justify-between px-3 py-2 ${isToday ? "bg-red-50" : "bg-dhl-light-gray"}`}>
                  <div>
                    <span className={`text-sm font-bold capitalize ${isToday ? "text-dhl-red" : "text-dhl-dark"}`}>
                      {full}
                    </span>
                    {isToday && (
                      <span className="ml-2 bg-dhl-red text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                        HOY
                      </span>
                    )}
                  </div>
                  {currentStatus && (
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium flex items-center gap-1 ${getStatusColor(currentStatus)}`}>
                      {STATUS_OPTIONS.find((o) => o.value === currentStatus)?.icon}
                      {STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label}
                    </span>
                  )}
                </div>

                {!isPast && (
                  <div className="grid grid-cols-2 gap-1.5 p-2">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setStatus(date, opt.value)}
                        disabled={saving === date}
                        className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                          currentStatus === opt.value
                            ? getStatusColor(opt.value)
                            : "bg-white border-dhl-mid-gray text-dhl-gray hover:border-dhl-gray"
                        } disabled:opacity-50`}
                      >
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {opt.icon}
                        </div>
                        <span className="truncate">{opt.label}</span>
                        {currentStatus === opt.value && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 ml-auto flex-shrink-0" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {isPast && !currentStatus && (
                  <div className="px-3 py-2 text-xs text-dhl-gray">Sin registro</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {role !== "host" && <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray overflow-hidden">
        <div className="bg-dhl-dark px-4 py-3">
          <h2 className="text-white font-bold text-sm">
            Ritmo del equipo — hoy
          </h2>
        </div>
        <div className="p-4 space-y-3">
          {(["office", "site", "home_office", "vacation"] as DayStatus[]).map((status) => {
            const people = teamByStatus[status];
            if (!people.length) return null;
            const opt = STATUS_OPTIONS.find((o) => o.value === status)!;
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-dhl-dark">{opt.icon}</span>
                  <span className="text-xs font-semibold text-dhl-dark">{opt.label}</span>
                  <span className="bg-dhl-mid-gray text-dhl-dark text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {people.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {people.map((s) => (
                    <span
                      key={s.user_id}
                      className="bg-dhl-light-gray text-dhl-dark text-xs px-2 py-1 rounded-full"
                    >
                      {s.profiles.full_name.split(" ")[0]}{" "}
                      <span className="text-dhl-gray">{s.profiles.area}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {teamStatuses.length === 0 && (
            <p className="text-sm text-dhl-gray text-center py-2">
              Nadie ha marcado su estado hoy aún.
            </p>
          )}
        </div>
      </div>}
    </div>
  );
}
