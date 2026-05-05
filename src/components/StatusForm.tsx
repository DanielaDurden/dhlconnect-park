"use client";

import { useState } from "react";
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
  weekDates: string[];
  myStatuses: UserDayStatus[];
  teamStatuses: TeamStatus[];
  today: string;
}

const STATUS_OPTIONS: { value: DayStatus; label: string; emoji: string; description: string }[] = [
  { value: "office", label: "En Oficina", emoji: "🏢", description: "Estaré en el CE" },
  { value: "site", label: "En Site", emoji: "🏭", description: "Voy a un centro de distribución" },
  { value: "home_office", label: "Home Office", emoji: "🏠", description: "Trabajo desde casa" },
  { value: "vacation", label: "Vacaciones", emoji: "🏖️", description: "Fuera de disponibilidad" },
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

export default function StatusForm({ profile, weekDates, myStatuses, teamStatuses, today }: Props) {
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
      showToast("Estado actualizado ✅");
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
    <div className="space-y-4">
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
        <div className="bg-dhl-red px-4 py-3">
          <h2 className="text-white font-bold text-sm">Mi semana</h2>
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
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(currentStatus)}`}>
                      {STATUS_OPTIONS.find((o) => o.value === currentStatus)?.emoji}{" "}
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
                        <span>{opt.emoji}</span>
                        <span className="truncate">{opt.label}</span>
                        {currentStatus === opt.value && <span className="ml-auto">✓</span>}
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

      {/* Team Status Today */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray overflow-hidden">
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
                  <span className="text-base">{opt.emoji}</span>
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
      </div>
    </div>
  );
}
