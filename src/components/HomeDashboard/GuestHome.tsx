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
    <div className="px-4 py-5 space-y-4">
      <p className="text-[1.1rem] font-bold text-dhl-dark">
        Hola, {firstName}.
      </p>

      {/* Status espacio */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
        <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide mb-2">Tu espacio hoy</p>
        {hasOccupied ? (
          <div>
            <p className="font-semibold text-dhl-dark text-sm">
              Espacio {deskCode} · Ocupado por ti
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleRelease}
                disabled={releasing}
                className="text-xs text-dhl-gray underline disabled:opacity-50"
              >
                {releasing ? "Liberando..." : "Liberar"}
              </button>
              <span className="text-xs text-dhl-gray">+20 Riffs</span>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-dhl-dark text-sm">Sin espacio ocupado ahora.</p>
            <Link href="/desks" className="text-xs text-dhl-gray underline mt-0.5 inline-block">
              Ver disponibilidad
            </Link>
          </div>
        )}
      </div>

      {/* Disponibilidad en tiempo real */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
        <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide mb-2">Disponibilidad ahora</p>
        <p className="text-sm text-dhl-dark font-semibold">
          {availableDesksCount} puestos libres ahora mismo
        </p>
        <p className="text-xs text-dhl-gray mt-0.5">Actualizado al cargar</p>
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

      {/* Nota cultural — solo si no tiene espacio */}
      {!hasOccupied && (
        <div className="bg-dhl-light-gray rounded-2xl p-4 border border-dhl-mid-gray">
          <p className="text-xs text-dhl-gray leading-relaxed">
            Si terminas antes, libera tu espacio. Alguien más lo agradecerá. +20 Riffs
          </p>
        </div>
      )}
    </div>
  );
}
