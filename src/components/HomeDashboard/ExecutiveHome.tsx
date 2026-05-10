"use client";

import { useState, useEffect } from "react";
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
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");
  }, []);

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
    <div className="px-5 py-6 space-y-5">
      {/* Hero section */}
      <div>
        {greeting && <p className="text-xs font-semibold text-dhl-gray/60 uppercase tracking-widest">{greeting}</p>}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-3xl font-black text-dhl-dark leading-tight">{firstName}.</p>
          <span className="bg-dhl-yellow/30 text-dhl-dark text-xs font-bold px-2 py-0.5 rounded-full">Executive</span>
        </div>
      </div>

      {/* Status card — oficina */}
      {isReleased ? (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">🟢 LIBERADA HOY</p>
          <p className="text-xl font-black text-green-900 mt-1">CoWork Premium activo</p>
          <p className="text-sm text-green-700/70 mt-1">Tu espacio está disponible para el equipo.</p>
          <button
            onClick={handleRecover}
            disabled={recovering}
            className="mt-3 text-xs text-red-500 underline disabled:opacity-50"
          >
            {recovering ? "Recuperando..." : "Recuperar"}
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-dhl-yellow/20 to-dhl-yellow/5 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-dhl-dark/50 uppercase tracking-widest">🔒 RESERVADA</p>
          <p className="text-xl font-black text-dhl-dark mt-1">Tu oficina está asegurada.</p>
          <p className="text-sm text-dhl-dark/60 mt-1">Tu espacio te espera hoy.</p>
        </div>
      )}

      {/* Riffs card */}
      <Link href="/profile">
        <div className="bg-dhl-dark rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-dhl-yellow text-xs font-black uppercase tracking-wide">🎸 Rockstar Path</p>
            <span className="bg-dhl-yellow/20 text-dhl-yellow text-[10px] font-bold px-2 py-0.5 rounded-full">{riffsLevel}</span>
          </div>
          <p className="text-4xl font-black text-white leading-none mt-2">
            {totalRiffs.toLocaleString("es-CL")}
          </p>
          <p className="text-white/50 text-sm mt-0.5">{riffsLevel}</p>
          <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-dhl-yellow rounded-full transition-all"
              style={{ width: `${riffsProgress}%` }}
            />
          </div>
          <p className="text-white/40 text-xs mt-1.5">
            {riffsLevel !== "Rock Legend"
              ? `${riffsNext.toLocaleString("es-CL")} para siguiente nivel`
              : "¡Nivel máximo!"}
          </p>
        </div>
      </Link>

      {/* Impacto del mes */}
      {solidarityCount > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤝</span>
            <div>
              <p className="font-bold text-dhl-dark text-sm">
                Este mes liberaste {solidarityCount} {solidarityCount === 1 ? "día" : "días"}.
              </p>
              <p className="text-xs text-dhl-gray mt-0.5">
                Apoyaste a {solidarityCount} {solidarityCount === 1 ? "persona" : "personas"}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/planner">
          <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2 active:scale-95 transition-transform">
            <span className="text-2xl">📅</span>
            <p className="text-sm font-bold text-dhl-dark">Planner</p>
            <p className="text-xs text-dhl-gray">Tu semana</p>
          </div>
        </Link>
        <Link href="/incidentes">
          <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2 active:scale-95 transition-transform">
            <span className="text-2xl">⚠️</span>
            <p className="text-sm font-bold text-dhl-dark">Incidentes</p>
            <p className="text-xs text-dhl-gray">Reportar</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
