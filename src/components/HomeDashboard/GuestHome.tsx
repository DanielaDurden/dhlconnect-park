"use client";

import Link from "next/link";

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
  totalRiffs: number;
  riffsLevel: string;
  riffsProgress: number;
  riffsNext: number;
  availableDesksCount: number;
}

export default function GuestHome({
  firstName,
  deskCode,
  deskReservationToday,
  totalRiffs,
  riffsLevel,
  riffsProgress,
  riffsNext,
  availableDesksCount,
}: Props) {
  const hasReservation = !!deskReservationToday && deskReservationToday.status === "confirmed";

  return (
    <div className="px-5 py-6 lg:py-8 lg:px-8">
      {/* Hero */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-dhl-gray/60 uppercase tracking-widest">Hola de nuevo,</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-3xl font-black text-dhl-dark">{firstName}.</p>
          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">Guest</span>
        </div>
      </div>

      {/* Two-column grid on desktop */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:items-start space-y-5 lg:space-y-0">

        {/* ── Left column ── */}
        <div className="space-y-5">
          {hasReservation ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-5 shadow-sm">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">📍 RESERVA ACTIVA</p>
              <p className="text-3xl font-black text-blue-900 mt-1">Puesto {deskCode}</p>
              <p className="text-sm text-blue-700/70 mt-1">Tu reserva está confirmada para hoy.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-dhl-mid-gray">
              <p className="text-5xl font-black text-dhl-dark">{availableDesksCount}</p>
              <p className="text-sm text-dhl-gray mt-1">espacios disponibles ahora</p>
              <p className="text-xs text-dhl-gray/70 mt-2 leading-relaxed">
                Reserva tu puesto para el día desde el mapa de puestos.
              </p>
              <Link
                href="/desks"
                className="block bg-dhl-dark text-white py-3 rounded-2xl text-sm font-bold text-center w-full mt-4"
              >
                🗺️ Ver mapa de puestos →
              </Link>
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/parking">
              <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2 active:scale-95 transition-transform hover:border-dhl-yellow border border-dhl-mid-gray">
                <span className="text-2xl">🚗</span>
                <p className="text-sm font-bold text-dhl-dark">Parking</p>
                <p className="text-xs text-dhl-gray">Reservar espacio</p>
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

          {/* Info card */}
          <div className="bg-dhl-yellow/10 border border-dhl-yellow rounded-2xl px-4 py-4">
            <p className="text-xs font-bold text-dhl-dark mb-1">¿Cómo funciona?</p>
            <ul className="text-xs text-dhl-dark/70 space-y-1 list-disc list-inside leading-relaxed">
              <li>Reserva tu puesto desde el mapa</li>
              <li>Usa carpooling para ganar +30 Riffs</li>
              <li>Sube niveles en el Rockstar Path</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
