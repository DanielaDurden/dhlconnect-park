"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  firstName: string;
  isWeekend?: boolean;
  weeklyPlanToday: {
    id: string;
    planned_status: string;
    solidarity_released: boolean;
  } | null;
  weeklyPlansWeek: { day_of_week: number; planned_status: string; solidarity_released: boolean }[];
  totalRiffs: number;
  riffsLevel: string;
  riffsProgress: number;
  riffsNext: number;
  solidarityCount: number;
  guestReservationOnMyDesk: { id: string } | null;
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

export default function HostHome({
  firstName,
  weeklyPlanToday,
  weeklyPlansWeek,
  totalRiffs,
  riffsLevel,
  riffsProgress,
  riffsNext,
  solidarityCount,
  guestReservationOnMyDesk,
}: Props) {
  const router = useRouter();
  const [recovering, setRecovering] = useState(false);
  const [confirmRecover, setConfirmRecover] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");
  }, []);

  const isReleased = weeklyPlanToday?.solidarity_released === true;
  const hasGuestOnMyDesk = !!guestReservationOnMyDesk;

  async function handleRelease() {
    const now = new Date();
    const rawDay = now.getDay();
    const dayOfWeek = rawDay === 0 ? 7 : rawDay;
    const d = new Date(now);
    const diff = d.getDate() - rawDay + (rawDay === 0 ? -6 : 1);
    d.setDate(diff);
    const weekStart = d.toISOString().split("T")[0];

    setRecovering(true);
    const [planRes] = await Promise.all([
      fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: weekStart,
          day_of_week: dayOfWeek,
          planned_status: "home_office",
          solidarity_released: true,
        }),
      }),
      fetch("/api/riffs/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "voluntary_release" }),
      }),
    ]);
    setRecovering(false);
    if (planRes.ok) {
      showToast("Espacio liberado. +50 Riffs");
      router.refresh();
    } else {
      showToast("Error al liberar. Intenta de nuevo.");
    }
  }

  async function handleRecover() {
    setRecovering(true);
    setConfirmRecover(false);
    const res = await fetch("/api/desks/host-recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    setRecovering(false);
    if (res.ok) {
      const data = await res.json() as { hadGuestReservation: boolean; riffsPenalty: number };
      if (data.hadGuestReservation) {
        showToast("Base recuperada. -50 Riffs. El Guest fue notificado.");
      } else {
        showToast("Tu espacio ha sido recuperado.");
      }
      router.refresh();
    } else {
      showToast("Error al recuperar. Intenta de nuevo.");
    }
  }

  return (
    <div className="px-5 py-6 lg:py-8 lg:px-8">
      {toast && (
        <div className="fixed top-16 left-0 right-0 mx-4 z-50 pointer-events-none">
          <div className="bg-dhl-dark text-white text-sm rounded-xl px-4 py-3 shadow-xl max-w-lg mx-auto text-center">
            {toast}
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="mb-6">
        {greeting && <p className="text-xs font-semibold text-dhl-gray/60 uppercase tracking-widest">{greeting}</p>}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-3xl font-black text-dhl-dark leading-tight">{firstName}.</p>
          <span className="bg-dhl-yellow/30 text-dhl-dark text-xs font-bold px-2 py-0.5 rounded-full">Host</span>
        </div>
      </div>

      {/* Two-column grid on desktop */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:items-start space-y-5 lg:space-y-0">

        {/* ── Left column ── */}
        <div className="space-y-5">
          {/* Status card */}
          {isReleased ? (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-5 shadow-sm">
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">🟢 LIBERADO HOY</p>
              <p className="text-xl font-black text-green-900 mt-1">Tu espacio está disponible</p>
              <p className="text-sm text-green-700/70 mt-1">
                {hasGuestOnMyDesk
                  ? "Un colaborador ya reservó tu espacio."
                  : "El equipo puede reservarlo ahora."}
              </p>

              <div className="mt-4 pt-4 border-t border-green-200">
                {!confirmRecover ? (
                  <button
                    onClick={() => setConfirmRecover(true)}
                    disabled={recovering}
                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-red-200 text-red-600 font-bold py-2.5 rounded-2xl text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    🚩 {recovering ? "Recuperando..." : "Recuperar mi base"}
                  </button>
                ) : (
                  <div className="space-y-2">
                    {hasGuestOnMyDesk && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 text-center">
                        Un colaborador ya reservó tu espacio. Recuperar costará <strong>−50 Riffs</strong> y se les notificará.
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmRecover(false)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleRecover}
                        disabled={recovering}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white disabled:opacity-60"
                      >
                        {recovering ? "..." : "Confirmar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-dhl-yellow/20 to-dhl-yellow/5 rounded-3xl p-5 shadow-sm">
              <p className="text-[10px] font-black text-dhl-dark/50 uppercase tracking-widest">🔒 RESERVADO</p>
              <p className="text-xl font-black text-dhl-dark mt-1">Tu espacio está asegurado.</p>
              <p className="text-sm text-dhl-dark/60 mt-1">Tu espacio te espera hoy.</p>
              <button
                onClick={handleRelease}
                disabled={recovering}
                className="mt-4 w-full py-2.5 rounded-2xl text-sm font-bold bg-dhl-yellow text-dhl-dark hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                {recovering ? "..." : "Liberar mi espacio (+50 Riffs)"}
              </button>
            </div>
          )}

          {/* Mi semana widget */}
          <Link href="/planner">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-dhl-mid-gray">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-black text-dhl-dark">📅 Mi semana</p>
                <span className="text-[10px] text-dhl-gray font-medium">Editar →</span>
              </div>
              {weeklyPlansWeek.length === 0 ? (
                <div className="text-center py-2">
                  <p className="text-sm text-dhl-gray/70">Sin planificar</p>
                  <p className="text-xs text-dhl-yellow font-bold mt-1">Toca para planificar tu semana</p>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-1.5">
                  {DAY_LABELS.map((label, i) => {
                    const plan = weeklyPlansWeek.find((p) => p.day_of_week === i + 1);
                    const released = plan?.solidarity_released;
                    return (
                      <div key={label} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-dhl-gray/60 font-semibold">{label}</span>
                        <div className={`w-full rounded-xl py-2 flex items-center justify-center text-base ${
                          !plan ? "bg-dhl-light-gray" :
                          released ? "bg-dhl-yellow/30" : "bg-dhl-dark/10"
                        }`}>
                          {!plan ? <span className="text-dhl-gray/30 text-xs">—</span> :
                           released ? "🎸" : "🏢"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
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
                <div className="h-full bg-dhl-yellow rounded-full transition-all" style={{ width: `${riffsProgress}%` }} />
              </div>
              <p className="text-white/40 text-xs mt-1.5">
                {riffsLevel !== "Rock Legend"
                  ? `${riffsNext.toLocaleString("es-CL")} para siguiente nivel`
                  : "¡Nivel máximo!"}
              </p>
            </div>
          </Link>

          {/* Impacto */}
          {solidarityCount > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤝</span>
                <div>
                  <p className="font-bold text-dhl-dark text-sm">
                    Esta semana liberaste {solidarityCount} {solidarityCount === 1 ? "día" : "días"}.
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
            <Link href="/desks">
              <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2 active:scale-95 transition-transform hover:border-dhl-yellow border border-dhl-mid-gray">
                <span className="text-2xl">🗺️</span>
                <p className="text-sm font-bold text-dhl-dark">Puestos</p>
                <p className="text-xs text-dhl-gray">Mapa de hoy</p>
              </div>
            </Link>
            <Link href="/incidentes">
              <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2 active:scale-95 transition-transform hover:border-dhl-yellow border border-dhl-mid-gray">
                <span className="text-2xl">⚠️</span>
                <p className="text-sm font-bold text-dhl-dark">Incidentes</p>
                <p className="text-xs text-dhl-gray">Reportar</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
