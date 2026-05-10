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
    <div className="px-4 py-5 space-y-4">
      <p className="text-[1.1rem] font-bold text-dhl-dark">
        Hola, {firstName}.
      </p>

      {/* Status puesto */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
        <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide mb-2">Tu puesto hoy</p>
        {hasDesk ? (
          <div>
            <p className="font-semibold text-dhl-dark text-sm">
              Puesto {deskCode} · Confirmado
            </p>
            <p className="text-xs text-dhl-gray mt-0.5">Hoy hasta las 18:00</p>
            <button
              onClick={handleRelease}
              disabled={releasing}
              className="mt-2 text-xs text-dhl-gray underline disabled:opacity-50"
            >
              {releasing ? "Liberando..." : "Liberar ahora"}
            </button>
          </div>
        ) : deskReservationToday ? (
          <div>
            <p className="font-semibold text-dhl-dark text-sm">Puesto liberado automáticamente.</p>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-dhl-dark text-sm">Sin puesto hoy</p>
            <Link href="/desks" className="text-xs text-dhl-gray underline mt-0.5 inline-block">
              Mira qué está disponible.
            </Link>
          </div>
        )}
      </div>

      {/* Status parking — solo si vino en auto */}
      {cameByAuto && (
        <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
          <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide mb-2">Parking hoy</p>
          {parkingResToday ? (
            <p className="font-semibold text-dhl-dark text-sm">
              Parking · Nivel {parkingResToday.level ?? "-2"} · Espacio {parkingResToday.spotNumber ?? "—"}
            </p>
          ) : (
            <div>
              <p className="text-sm text-dhl-dark">Sin parking reservado hoy.</p>
              <Link href="/parking" className="text-xs text-dhl-gray underline mt-0.5 inline-block">
                Reservar
              </Link>
            </div>
          )}
        </div>
      )}

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

      {/* Accesos rápidos */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray divide-y divide-dhl-mid-gray overflow-hidden">
        <Link href="/status" className="flex items-center justify-between px-4 py-3 hover:bg-dhl-light-gray transition-colors">
          <span className="text-sm text-dhl-dark font-medium">Mi estado semanal</span>
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
