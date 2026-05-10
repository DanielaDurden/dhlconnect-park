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

export default function PlannerForm({ weekStart, weekDates, initialPlans }: Props) {
  const router = useRouter();
  const [plans, setPlans] = useState<Record<number, WeeklyPlanRow>>(() => {
    const map: Record<number, WeeklyPlanRow> = {};
    for (const p of initialPlans) map[p.day_of_week] = p;
    return map;
  });
  const [loading, setLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function savePlan(dayOfWeek: number, goToOffice: boolean) {
    setLoading(dayOfWeek);
    const res = await fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_start: weekStart,
        day_of_week: dayOfWeek,
        planned_status: goToOffice ? "office" : "home_office",
        solidarity_released: !goToOffice,
      }),
    });
    if (res.ok) {
      setPlans((prev) => ({
        ...prev,
        [dayOfWeek]: {
          day_of_week: dayOfWeek,
          planned_status: goToOffice ? "office" : "home_office",
          solidarity_released: !goToOffice,
        },
      }));
      showToast(goToOffice ? `${DAY_NAMES[dayOfWeek - 1]} reservado` : `+50 Riffs — ${DAY_NAMES[dayOfWeek - 1]} liberado`);
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
        const isReleased = plan?.solidarity_released === true;
        const isOffice = plan?.planned_status === "office" && !plan?.solidarity_released;
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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isReleased
                    ? "bg-green-100 text-green-700"
                    : "bg-dhl-dark/10 text-dhl-dark"
                }`}>
                  {isReleased ? "🎸 Compartido" : "🏢 En oficina"}
                </span>
              )}
            </div>

            {/* Actions */}
            {!isPast ? (
              <div className="px-4 py-3 flex flex-col gap-2">
                <button
                  onClick={() => savePlan(dayOfWeek, true)}
                  disabled={loading === dayOfWeek}
                  className={`w-full py-3 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-50 ${
                    isOffice
                      ? "bg-dhl-dark text-white border-dhl-dark"
                      : "bg-white text-dhl-dark border-dhl-mid-gray hover:border-dhl-dark"
                  }`}
                >
                  {loading === dayOfWeek ? "..." : "🏢 Voy a la oficina"}
                </button>
                <button
                  onClick={() => savePlan(dayOfWeek, false)}
                  disabled={loading === dayOfWeek}
                  className={`w-full py-3 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-50 ${
                    isReleased
                      ? "bg-dhl-yellow text-dhl-dark border-dhl-yellow"
                      : "bg-white text-dhl-dark border-dhl-mid-gray hover:border-dhl-yellow"
                  }`}
                >
                  {loading === dayOfWeek ? "..." : "🎸 Comparto mi espacio"}
                  {isReleased && <span className="ml-1.5 text-[10px] font-normal opacity-70">+50 Riffs</span>}
                </button>
              </div>
            ) : (
              <div className="px-4 py-3">
                <p className="text-xs text-dhl-gray/50 text-center">
                  {plan
                    ? isReleased ? "Espacio compartido" : "En oficina"
                    : "Sin registro"}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
