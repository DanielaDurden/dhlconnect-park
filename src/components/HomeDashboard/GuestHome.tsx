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
  const router = useRouter();
  const [releasing, setReleasing] = useState(false);

  const hasOccupied = !!deskReservationToday && deskReservationToday.checked_in;

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
        <p className="text-xs font-semibold text-dhl-gray/60 uppercase tracking-widest">Hola de nuevo,</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-3xl font-black text-dhl-dark">{firstName}.</p>
          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">Guest</span>
        </div>
      </div>

      {/* Status espacio */}
      {hasOccupied ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">📍 OCUPADO POR TI</p>
          <p className="text-3xl font-black text-blue-900 mt-1">Espacio {deskCode}</p>
          <div className="mt-3">
            <button
              onClick={handleRelease}
              disabled={releasing}
              className="inline-flex items-center gap-1 text-xs text-blue-500/80 underline disabled:opacity-50"
            >
              {releasing ? "Liberando..." : "Liberar espacio"}
            </button>
            <p className="text-[10px] text-dhl-gray mt-1">+20 Riffs si liberas antes</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="text-5xl font-black text-dhl-dark">{availableDesksCount}</p>
          <p className="text-sm text-dhl-gray mt-1">espacios disponibles ahora</p>
          <p className="text-xs text-dhl-gray/70 mt-2">
            Si terminas antes, libera tu espacio. Alguien más lo agradecerá. +20 Riffs 🙌
          </p>
          <Link
            href="/desks"
            className="block bg-dhl-dark text-white py-3 rounded-2xl text-sm font-bold text-center w-full mt-3"
          >
            Ver el mapa →
          </Link>
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

      {/* Quick action — un solo botón grande */}
      <Link
        href="/desks"
        className="block bg-dhl-yellow text-dhl-dark w-full py-4 rounded-2xl font-bold text-sm text-center"
      >
        🗺️ Ver mapa de puestos
      </Link>
    </div>
  );
}
