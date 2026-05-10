"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  firstName: string;
  deskCode?: string;
  reservationId?: string;
  deskReservationToday: {
    id: string;
    desk_id: string;
    checked_in: boolean;
    carpooling: boolean;
    status: string;
  } | null;
  parkingResToday: {
    id: string;
    spotNumber?: number;
    level?: string;
  } | null;
  totalRiffs: number;
  riffsLevel: string;
  riffsProgress: number;
  riffsNext: number;
}

export default function ProfessionalHome({
  firstName,
  deskCode,
  deskReservationToday,
  parkingResToday,
  totalRiffs,
  riffsLevel,
  riffsProgress,
  riffsNext,
}: Props) {
  const router = useRouter();
  const [releasing, setReleasing] = useState(false);

  const hasDesk = !!deskReservationToday && deskReservationToday.checked_in;
  const cameByAuto = deskReservationToday?.carpooling === true;

  async function handleRelease() {
    if (!deskReservationToday?.id) return;
    setReleasing(true);
    await fetch("/api/desks/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: deskReservationToday.id, solidarity: false }),
    });
    setReleasing(false);
    router.refresh();
  }

  return (
    <div className="px-5 py-6 space-y-5">
      {/* Hero section */}
      <div>
        <p className="text-xs font-semibold text-dhl-gray/60 uppercase tracking-widest">Bienvenid@</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-3xl font-black text-dhl-dark">{firstName}.</p>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">Professional</span>
        </div>
      </div>

      {/* Status puesto */}
      {hasDesk ? (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">✅ CONFIRMADO</p>
          <p className="text-3xl font-black text-green-900 mt-1">Puesto {deskCode}</p>
          <p className="text-sm text-green-700/70 mt-1">Tu espacio está asegurado para hoy.</p>
          <button
            onClick={handleRelease}
            disabled={releasing}
            className="mt-3 text-xs text-green-600/70 underline disabled:opacity-50"
          >
            {releasing ? "Liberando..." : "Liberar ahora"}
          </button>
        </div>
      ) : deskReservationToday ? (
        <div className="bg-dhl-light-gray rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-dhl-gray uppercase tracking-widest">📭 SIN PUESTO HOY</p>
          <p className="text-xl font-bold text-dhl-dark mt-1">Tu puesto fue liberado.</p>
          <Link href="/desks" className="text-sm text-dhl-gray underline mt-2 inline-block">
            Mira qué hay libre →
          </Link>
        </div>
      ) : (
        <div className="bg-dhl-light-gray rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-dhl-gray uppercase tracking-widest">📭 SIN PUESTO HOY</p>
          <p className="text-xl font-bold text-dhl-dark mt-1">Aún no has confirmado asistencia.</p>
          <Link href="/desks" className="text-sm text-dhl-gray underline mt-2 inline-block">
            Mira qué hay libre →
          </Link>
        </div>
      )}

      {/* Status parking — solo si vino en auto */}
      {cameByAuto && (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          {parkingResToday ? (
            <div>
              <p className="text-xl font-bold text-dhl-dark">🅿️ Espacio {parkingResToday.spotNumber ?? "—"}</p>
              <p className="text-sm text-dhl-gray mt-1">Nivel {parkingResToday.level ?? "-2"}</p>
            </div>
          ) : (
            <div>
              <p className="text-base font-bold text-dhl-dark">Sin parking reservado.</p>
              <Link href="/parking" className="text-sm text-dhl-gray underline mt-1 inline-block">
                Reservar →
              </Link>
            </div>
          )}
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

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/status">
          <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2 active:scale-95 transition-transform">
            <span className="text-2xl">📅</span>
            <p className="text-sm font-bold text-dhl-dark">Mi Estado</p>
            <p className="text-xs text-dhl-gray">Esta semana</p>
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
