"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  firstName: string;
  weeklyPlanToday: {
    id: string;
    planned_status: string;
    solidarity_released: boolean;
  } | null;
  totalRiffs: number;
  riffsLevel: string;
  riffsProgress: number;
  riffsNext: number;
  solidarityCount: number;
}

export default function ExecutiveHome({
  firstName,
  weeklyPlanToday,
  totalRiffs,
  riffsLevel,
  riffsProgress,
  riffsNext,
  solidarityCount,
}: Props) {
  const router = useRouter();
  const [recovering, setRecovering] = useState(false);

  const isReleased = weeklyPlanToday?.solidarity_released === true;

  async function handleRecover() {
    setRecovering(true);
    const now = new Date();
    const day = now.getDay();
    const rawDay = day === 0 ? 7 : day;
    const d = new Date(now);
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const weekStart = d.toISOString().split("T")[0];

    await fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_start: weekStart,
        day_of_week: rawDay,
        planned_status: "office",
        solidarity_released: false,
      }),
    });
    setRecovering(false);
    router.refresh();
  }

  return (
    <div className="px-4 py-5 space-y-4">
      <p className="text-[1.1rem] font-bold text-dhl-dark">
        Hola, {firstName}.
      </p>

      {/* Status card */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
        <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide mb-2">Tu oficina hoy</p>
        {isReleased ? (
          <div>
            <p className="font-semibold text-dhl-dark text-sm">Tu oficina · Liberada hoy</p>
            <p className="text-xs text-dhl-gray mt-0.5">Tu espacio está disponible para colegas.</p>
            <button
              onClick={handleRecover}
              disabled={recovering}
              className="mt-2 text-xs text-red-500 underline disabled:opacity-50"
            >
              {recovering ? "Recuperando..." : "Recuperar"}
            </button>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-dhl-dark text-sm">Tu oficina · Reservada</p>
            <p className="text-xs text-dhl-gray mt-0.5">Tu espacio está asegurado para hoy.</p>
          </div>
        )}
      </div>

      {/* Riffs card */}
      <Link href="/profile">
        <div className="bg-dhl-dark rounded-2xl px-4 py-3.5 flex items-center justify-between hover:opacity-90 transition-opacity">
          <div>
            <p className="text-dhl-yellow text-xs font-bold uppercase tracking-wide">Mis Riffs</p>
            <p className="text-white text-xl font-black leading-tight">
              {totalRiffs.toLocaleString("es-CL")}
            </p>
            <p className="text-white/60 text-xs mt-0.5">{riffsLevel}</p>
          </div>
          <div className="text-right">
            <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-dhl-yellow rounded-full transition-all"
                style={{ width: `${riffsProgress}%` }}
              />
            </div>
            <p className="text-white/50 text-[10px]">
              {riffsLevel !== "Rock Legend"
                ? `${riffsNext.toLocaleString("es-CL")} para siguiente nivel`
                : "Nivel máximo"}
            </p>
          </div>
        </div>
      </Link>

      {/* Impacto del mes */}
      {solidarityCount > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
          <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide mb-2">Impacto del mes</p>
          <p className="text-sm text-dhl-dark">Este mes liberaste {solidarityCount} {solidarityCount === 1 ? "día" : "días"}.</p>
          <p className="text-xs text-dhl-gray mt-0.5">Apoyaste a {solidarityCount} {solidarityCount === 1 ? "persona" : "personas"}.</p>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray divide-y divide-dhl-mid-gray overflow-hidden">
        <Link href="/planner" className="flex items-center justify-between px-4 py-3 hover:bg-dhl-light-gray transition-colors">
          <span className="text-sm text-dhl-dark font-medium">Planner semanal</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-dhl-mid-gray" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </Link>
        <Link href="/incidentes" className="flex items-center justify-between px-4 py-3 hover:bg-dhl-light-gray transition-colors">
          <span className="text-sm text-dhl-dark font-medium">Incidentes</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-dhl-mid-gray" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </Link>
      </div>
    </div>
  );
}
