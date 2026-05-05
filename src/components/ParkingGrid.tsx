"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { ParkingSpotWithReservation, Profile } from "@/types";

interface Props {
  spots: ParkingSpotWithReservation[];
  myProfile: Pick<Profile, "id" | "full_name">;
  today: string;
  isMonday: boolean;
  myReservationId: string | null;
  totalCapacity: number;
  occupiedCount: number;
}

function getSpotColor(
  spot: ParkingSpotWithReservation,
  myId: string,
  isMonday: boolean
): string {
  if (spot.spot_status === "blocked") return "bg-red-100 border-red-400 text-red-600";
  if (spot.spot_status === "fixed") return "bg-yellow-100 border-yellow-400 text-yellow-800";
  if (spot.spot_status === "director_reserved" && isMonday)
    return "bg-orange-100 border-orange-400 text-orange-800";

  // Director spot on non-Monday = available
  if (spot.reservation?.status === "confirmed") {
    if (spot.reservation.user_id === myId) {
      return "bg-blue-500 border-blue-600 text-white";
    }
    return "bg-gray-200 border-gray-300 text-gray-500";
  }

  return "bg-green-100 border-green-400 text-green-800";
}

function getSpotLabel(
  spot: ParkingSpotWithReservation,
  myId: string,
  isMonday: boolean
): string {
  if (spot.spot_status === "blocked") return "Bloqueado";
  if (spot.spot_status === "fixed") {
    const name = spot.assigned_user_name?.split(",")[0] ?? "Fijo";
    return name;
  }
  if (spot.spot_status === "director_reserved" && isMonday) {
    return spot.director_name?.split(" ").slice(-1)[0] ?? "Director";
  }
  if (spot.reservation?.user_id === myId) return "Mi reserva";
  if (spot.reservation?.status === "confirmed") return "Ocupado";
  return "Libre";
}

function canReserveSpot(
  spot: ParkingSpotWithReservation,
  myId: string,
  isMonday: boolean,
  hasReservation: boolean
): boolean {
  if (hasReservation) return false;
  if (spot.spot_status === "blocked") return false;
  if (spot.spot_status === "fixed") return false;
  if (spot.spot_status === "director_reserved" && isMonday) return false;
  if (spot.reservation?.status === "confirmed") return false;
  return true;
}

export default function ParkingGrid({
  spots,
  myProfile,
  today,
  isMonday,
  myReservationId,
  totalCapacity,
  occupiedCount,
}: Props) {
  const [selected, setSelected] = useState<ParkingSpotWithReservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  const hasReservation = !!myReservationId;
  const availableCount = totalCapacity - occupiedCount;
  const isPlanB = availableCount === 0;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleReserve(spot: ParkingSpotWithReservation) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("parking_reservations").insert({
      spot_id: spot.id,
      user_id: myProfile.id,
      date: today,
      status: "confirmed",
    });

    if (error?.code === "23505") {
      showToast("Este espacio ya fue reservado. Intenta con otro.");
    } else if (error) {
      showToast("Error al reservar. Intenta de nuevo.");
    } else {
      showToast(`✅ Reservaste el Espacio ${spot.spot_number}`);
      setSelected(null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleCancel() {
    if (!myReservationId) return;
    setLoading(true);
    const supabase = createClient();

    await supabase
      .from("parking_reservations")
      .update({ status: "cancelled" })
      .eq("id", myReservationId);

    showToast("Reserva de parking cancelada");
    setSelected(null);
    router.refresh();
    setLoading(false);
  }

  const streetSpots = spots.filter((s) => s.level === "street");
  const minus2Spots = spots.filter((s) => s.level === "minus2");

  function SpotCard({ spot }: { spot: ParkingSpotWithReservation }) {
    const color = getSpotColor(spot, myProfile.id, isMonday);
    const label = getSpotLabel(spot, myProfile.id, isMonday);

    return (
      <button
        onClick={() => setSelected(spot)}
        className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 active:scale-95 shadow-sm ${color}`}
        title={`Espacio ${spot.spot_number} — ${label}`}
      >
        <span className="text-sm font-bold leading-none">{spot.spot_number}</span>
        <span className="text-[9px] font-medium text-center leading-tight px-1 line-clamp-1">
          {label}
        </span>
        {spot.is_accessible && <span className="text-xs">♿</span>}
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-0 right-0 mx-4 z-50">
          <div className="bg-dhl-dark text-white text-sm rounded-xl px-4 py-3 shadow-xl max-w-lg mx-auto text-center">
            {toast}
          </div>
        </div>
      )}

      {/* Plan B Alert */}
      {isPlanB && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-bold text-red-700 text-sm">Estacionamiento lleno — Plan B</p>
              <p className="text-red-600 text-xs mt-1">
                Todos los cupos están ocupados. Puedes usar los estacionamientos externos
                (ParkUp) cercanos. Guarda tu boleta para solicitar reembolso con RRHH.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Capacity Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-dhl-dark">Ocupación hoy</span>
          <span className={`text-sm font-bold ${isPlanB ? "text-red-600" : "text-green-600"}`}>
            {occupiedCount}/{totalCapacity}
          </span>
        </div>
        <div className="h-2 bg-dhl-mid-gray rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isPlanB ? "bg-red-500" : occupiedCount > totalCapacity * 0.8 ? "bg-orange-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min((occupiedCount / totalCapacity) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-dhl-gray">{availableCount} libres</span>
          {isMonday && (
            <span className="text-xs text-orange-600 font-medium">
              ⭐ Lunes — Spots 211-214 reservados directores
            </span>
          )}
        </div>
      </div>

      {/* Street Level */}
      {streetSpots.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4 mb-4">
          <h3 className="text-sm font-bold text-dhl-dark mb-3">
            🅿️ Nivel Calle
          </h3>
          <div className="flex gap-3">
            {streetSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        </div>
      )}

      {/* Minus 2 Level */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
        <h3 className="text-sm font-bold text-dhl-dark mb-3">
          🅿️ Nivel -2
        </h3>
        <div className="flex flex-wrap gap-2">
          {minus2Spots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { color: "bg-green-100 border-green-400", label: "Disponible" },
          { color: "bg-yellow-100 border-yellow-400", label: "Fijo (asignado)" },
          { color: "bg-orange-100 border-orange-400", label: "Director (lunes)" },
          { color: "bg-red-100 border-red-400", label: "Bloqueado" },
          { color: "bg-gray-200 border-gray-300", label: "Ocupado" },
          { color: "bg-blue-500 border-blue-600", label: "Mi reserva" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded border-2 flex-shrink-0 ${item.color}`} />
            <span className="text-xs text-dhl-gray">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Spot Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-dhl-dark text-lg">
                  Espacio {selected.spot_number}
                </h3>
                <p className="text-dhl-gray text-sm">
                  {selected.level === "street" ? "Nivel Calle" : "Nivel -2"}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-dhl-light-gray flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {selected.spot_status === "blocked" && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-sm font-semibold text-red-700">
                  🔒 Espacio bloqueado
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Contacta con la Asistente para acceder a este espacio.
                </p>
              </div>
            )}

            {selected.spot_status === "fixed" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs text-dhl-gray">Asignado permanentemente a:</p>
                <p className="font-semibold text-dhl-dark text-sm mt-0.5">
                  {selected.assigned_user_name}
                </p>
              </div>
            )}

            {selected.spot_status === "director_reserved" && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs text-dhl-gray">
                  {isMonday
                    ? "Reservado los lunes para:"
                    : "Disponible hoy (reservado solo lunes para):"}
                </p>
                <p className="font-semibold text-dhl-dark text-sm mt-0.5">
                  {selected.director_name}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {/* Cancel my reservation */}
              {selected.reservation?.user_id === myProfile.id && (
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {loading ? "Cancelando..." : "Cancelar mi reserva"}
                </button>
              )}

              {/* Reserve */}
              {canReserveSpot(selected, myProfile.id, isMonday, hasReservation) && (
                <button
                  onClick={() => handleReserve(selected)}
                  disabled={loading}
                  className="w-full bg-dhl-red text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {loading ? "Reservando..." : "Reservar este espacio"}
                </button>
              )}

              {hasReservation && !selected.reservation && (
                <p className="text-center text-sm text-dhl-gray">
                  Ya tienes un espacio reservado hoy.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
