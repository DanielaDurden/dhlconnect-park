"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DayStatus } from "@/types";

interface WeeklyPlanRow {
  day_of_week: number;
  planned_status: DayStatus;
  solidarity_released: boolean;
}

interface Props {
  weekStart: string;
  weekDates: string[];
  initialPlans: WeeklyPlanRow[];
}

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const STATUS_OPTIONS: { value: DayStatus; label: string; colors: string }[] = [
  { value: "office",      label: "En Oficina",  colors: "border-green-500 bg-green-50 text-green-800" },
  { value: "site",        label: "En Site",     colors: "border-purple-500 bg-purple-50 text-purple-800" },
  { value: "home_office", label: "Home Office", colors: "border-blue-500 bg-blue-50 text-blue-800" },
  { value: "vacation",    label: "Vacaciones",  colors: "border-orange-400 bg-orange-50 text-orange-800" },
];

export default function PlannerForm({ weekStart, weekDates, initialPlans }: Props) {
  const router = useRouter();
  const [plans, setPlans] = useState<Record<number, WeeklyPlanRow>>(() => {
    const map: Record<number, WeeklyPlanRow> = {};
    for (const p of initialPlans) {
      map[p.day_of_week] = p;
    }
    return map;
  });
  const [loading, setLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function savePlan(dayOfWeek: number, status: DayStatus, solidarity: boolean) {
    setLoading(dayOfWeek);
    const res = await fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_start: weekStart,
        day_of_week: dayOfWeek,
        planned_status: status,
        solidarity_released: solidarity,
      }),
    });
    if (res.ok) {
      setPlans((prev) => ({
        ...prev,
        [dayOfWeek]: { day_of_week: dayOfWeek, planned_status: status, solidarity_released: solidarity },
      }));
      if (solidarity) showToast(`+50 Riffs por liberación solidaria del ${DAY_NAMES[dayOfWeek - 1]}`);
      else showToast(`${DAY_NAMES[dayOfWeek - 1]} actualizado`);
      router.refresh();
    } else {
      showToast("Error al guardar. Intenta de nuevo.");
    }
    setLoading(null);
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-3">
      {toast && (
        <div className="fixed top-16 left-0 right-0 mx-4 z-50 pointer-events-none">
          <div className="bg-dhl-dark text-white text-sm rounded-xl px-4 py-3 shadow-xl max-w-lg mx-auto text-center">
            {toast}
          </div>
        </div>
      )}

      {weekDates.map((date, i) => {
        const dayOfWeek = i + 1;
        const plan = plans[dayOfWeek];
        const isPast = date < today;
        const isToday = date === today;
        const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short" });

        return (
          <div
            key={date}
            className={`bg-white rounded-2xl shadow-sm border ${isToday ? "border-dhl-yellow" : "border-dhl-mid-gray"} overflow-hidden`}
          >
            {/* Day header */}
            <div className={`px-4 py-3 flex items-center justify-between ${isToday ? "bg-dhl-yellow" : "bg-dhl-light-gray"}`}>
              <div>
                <p className={`text-sm font-bold ${isToday ? "text-dhl-dark" : "text-dhl-gray"}`}>
                  {DAY_NAMES[i]}
                  {isToday && <span className="ml-1.5 text-xs font-normal opacity-70">(Hoy)</span>}
                </p>
                <p className={`text-xs ${isToday ? "text-dhl-dark/60" : "text-dhl-gray/60"}`}>{dateLabel}</p>
              </div>
              {plan && (
                <div className="flex items-center gap-1.5">
                  {plan.solidarity_released && (
                    <span className="text-[10px] bg-dhl-yellow/30 text-dhl-dark font-bold px-2 py-0.5 rounded-full">
                      +50 Riffs
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_OPTIONS.find((s) => s.value === plan.planned_status)?.colors ?? ""}`}>
                    {STATUS_OPTIONS.find((s) => s.value === plan.planned_status)?.label}
                  </span>
                </div>
              )}
            </div>

            {/* Status buttons */}
            {!isPast && (
              <div className="px-4 py-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = plan?.planned_status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => savePlan(dayOfWeek, opt.value, false)}
                        disabled={loading === dayOfWeek}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                          isSelected ? opt.colors : "border-dhl-mid-gray text-dhl-gray hover:border-dhl-dark"
                        } disabled:opacity-50`}
                      >
                        {loading === dayOfWeek ? "..." : opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Solidarity release — only when not office */}
                {plan && plan.planned_status !== "office" && !plan.solidarity_released && (
                  <button
                    onClick={() => savePlan(dayOfWeek, plan.planned_status, true)}
                    disabled={loading === dayOfWeek}
                    className="w-full flex items-center justify-center gap-2 bg-dhl-yellow text-dhl-dark font-bold py-2.5 rounded-xl text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
                      <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                    </svg>
                    Liberar solidariamente (+50 Riffs)
                  </button>
                )}

                {plan?.solidarity_released && (
                  <div className="bg-dhl-yellow/10 border border-dhl-yellow rounded-xl px-3 py-2 text-center">
                    <p className="text-xs font-semibold text-dhl-dark">Liberado solidariamente</p>
                    <p className="text-[10px] text-dhl-gray">Tu espacio está disponible para colegas</p>
                  </div>
                )}
              </div>
            )}

            {isPast && (
              <div className="px-4 py-3">
                <p className="text-xs text-dhl-gray/50 text-center">
                  {plan ? STATUS_OPTIONS.find((s) => s.value === plan.planned_status)?.label : "Sin registro"}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
