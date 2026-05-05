"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { DeskWithStatus, Profile } from "@/types";

interface Props {
  desks: DeskWithStatus[];
  myProfile: Pick<Profile, "id" | "area" | "full_name">;
  today: string;
  myReservationId: string | null;
}

const AREA_COLORS: Record<string, string> = {
  FIN: "bg-blue-100 text-blue-800",
  OE: "bg-purple-100 text-purple-800",
  SD: "bg-teal-100 text-teal-800",
  BD: "bg-orange-100 text-orange-800",
  Legal: "bg-pink-100 text-pink-800",
  MKT: "bg-rose-100 text-rose-800",
  IT: "bg-cyan-100 text-cyan-800",
  HR: "bg-indigo-100 text-indigo-800",
  KAM: "bg-amber-100 text-amber-800",
  GG: "bg-gray-100 text-gray-800",
  "Co-Work": "bg-green-100 text-green-800",
  "OE/FIN": "bg-violet-100 text-violet-800",
  "BD/SD": "bg-orange-100 text-orange-700",
  "SD/FIN": "bg-teal-100 text-teal-700",
  "IT/OE": "bg-cyan-100 text-cyan-700",
  "Legal/MKT": "bg-pink-100 text-pink-700",
};

function getDeskColor(desk: DeskWithStatus, myId: string): string {
  if (desk.type === "office" || desk.type === "meeting") {
    return "bg-purple-100 border-purple-300 text-purple-700";
  }
  // My fixed desk
  if (desk.assigned_user_id === myId) {
    return "bg-blue-500 border-blue-600 text-white";
  }
  // Has active reservation
  if (desk.reservation?.status === "confirmed") {
    // occupied by someone else
    return "bg-gray-200 border-gray-300 text-gray-500";
  }
  // Fixed desk with owner who is NOT in office
  if (desk.type === "fixed" && desk.assigned_user_id) {
    if (desk.owner_day_status === "site" || desk.owner_day_status === "home_office") {
      return "bg-green-100 border-green-400 text-green-800"; // available
    }
    return "bg-yellow-100 border-yellow-400 text-yellow-800"; // owner assigned
  }
  // Shared or CoWork — available
  return "bg-green-100 border-green-400 text-green-800";
}

function getDeskLabel(desk: DeskWithStatus, myId: string): string {
  if (desk.assigned_user_id === myId) return "Mi puesto";
  if (desk.reservation?.status === "confirmed") return "Ocupado";
  if (desk.type === "fixed" && desk.assigned_user_id) {
    if (desk.owner_day_status === "site" || desk.owner_day_status === "home_office") {
      return "Disponible";
    }
    return desk.assigned_profile?.full_name?.split(" ")[0] ?? "Asignado";
  }
  if (desk.type === "cowork") return "Co-Work";
  if (desk.type === "shared") return "Compartido";
  return "Disponible";
}

function canReserve(desk: DeskWithStatus, myId: string, hasReservation: boolean): boolean {
  if (hasReservation) return false;
  if (desk.type === "office" || desk.type === "meeting") return false;
  if (desk.reservation?.status === "confirmed") return false;
  if (desk.assigned_user_id === myId) return false; // already mine
  if (desk.type === "fixed" && desk.assigned_user_id) {
    return desk.owner_day_status === "site" || desk.owner_day_status === "home_office";
  }
  return true;
}

function canAskOwner(desk: DeskWithStatus, myId: string): boolean {
  return (
    desk.type === "fixed" &&
    !!desk.assigned_user_id &&
    desk.assigned_user_id !== myId &&
    !desk.owner_day_status &&
    !desk.reservation
  );
}

// Zone layout definitions
const ZONE_A = ["A01", "A02", "A03", "A04", "A05", "A06"];
const ZONE_B_LEFT_PAIRS = [
  ["B01", "B02"],
  ["B03", "B04"],
  ["B05", "B06"],
  ["B07", "B08"],
  ["B09", "B10"],
  ["B11", "B12"],
];
const ZONE_C = [
  ["C01", "C02", "C03"],
  ["C04", "C05", "C06"],
];
const ZONE_GG = ["GG01"];

export default function DeskMap({ desks, myProfile, today, myReservationId }: Props) {
  const [selected, setSelected] = useState<DeskWithStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  const deskMap = Object.fromEntries(desks.map((d) => [d.code, d]));
  const hasReservation = !!myReservationId;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleReserve(desk: DeskWithStatus) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("desk_reservations").insert({
      desk_id: desk.id,
      user_id: myProfile.id,
      date: today,
      status: "confirmed",
    });

    if (error) {
      showToast("Error al reservar. Intenta de nuevo.");
    } else {
      showToast(`✅ Reservaste el puesto ${desk.code}`);
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
      .from("desk_reservations")
      .update({ status: "cancelled" })
      .eq("id", myReservationId);

    showToast("Reserva cancelada");
    setSelected(null);
    router.refresh();
    setLoading(false);
  }

  async function handleAskOwner(desk: DeskWithStatus) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("owner_requests").insert({
      requester_id: myProfile.id,
      owner_id: desk.assigned_user_id,
      desk_id: desk.id,
      date: today,
      status: "pending",
    });

    if (error?.code === "23505") {
      showToast("Ya enviaste una solicitud a este colaborador hoy.");
    } else if (error) {
      showToast("Error al enviar solicitud.");
    } else {
      showToast("📨 Solicitud enviada al dueño del puesto");
    }
    setSelected(null);
    setLoading(false);
  }

  function DeskSquare({ code }: { code: string }) {
    const desk = deskMap[code];
    if (!desk) return <div className="w-14 h-14 rounded-lg bg-dhl-mid-gray/30" />;

    const color = getDeskColor(desk, myProfile.id);
    const label = getDeskLabel(desk, myProfile.id);
    const areaColor = AREA_COLORS[desk.area ?? ""] ?? "bg-gray-100 text-gray-700";

    return (
      <button
        onClick={() => setSelected(desk)}
        className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 active:scale-95 shadow-sm ${color}`}
        title={`${desk.code} — ${label}`}
      >
        <span className="text-[10px] font-bold leading-none">{desk.code}</span>
        <span className={`text-[8px] px-1 rounded font-medium leading-tight text-center ${areaColor}`}>
          {desk.area?.split("/")[0]}
        </span>
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

      {/* Map */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray overflow-hidden">
        {/* Header */}
        <div className="bg-dhl-red px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-bold text-sm">Planta CE — Vista general</h2>
          <span className="text-white/70 text-xs">Toca un puesto para reservar</span>
        </div>

        <div className="p-4 space-y-5">
          {/* Zone A - Top Row */}
          <div>
            <p className="text-[10px] text-dhl-gray font-semibold uppercase tracking-wide mb-2">
              Zona A — Fila superior
            </p>
            <div className="flex gap-2 flex-wrap">
              {ZONE_A.map((code) => (
                <DeskSquare key={code} code={code} />
              ))}
            </div>
          </div>

          <hr className="border-dhl-mid-gray" />

          {/* Zone B + C */}
          <div className="flex gap-4">
            {/* Zone B Left */}
            <div>
              <p className="text-[10px] text-dhl-gray font-semibold uppercase tracking-wide mb-2">
                Zona B — Planta abierta
              </p>
              <div className="space-y-2">
                {ZONE_B_LEFT_PAIRS.map(([left, right]) => (
                  <div key={left} className="flex gap-2">
                    <DeskSquare code={left} />
                    <DeskSquare code={right} />
                  </div>
                ))}
              </div>
            </div>

            {/* Zone C Right */}
            <div>
              <p className="text-[10px] text-dhl-gray font-semibold uppercase tracking-wide mb-2">
                Co-Work / HR
              </p>
              <div className="space-y-2">
                {ZONE_C.map((row, i) => (
                  <div key={i} className="flex gap-2">
                    {row.map((code) => (
                      <DeskSquare key={code} code={code} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-dhl-mid-gray" />

          {/* GG */}
          <div>
            <p className="text-[10px] text-dhl-gray font-semibold uppercase tracking-wide mb-2">
              Gerencia General
            </p>
            <div className="flex gap-2">
              {ZONE_GG.map((code) => (
                <DeskSquare key={code} code={code} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { color: "bg-green-100 border-green-400", label: "Disponible" },
          { color: "bg-yellow-100 border-yellow-400", label: "Dueño asignado" },
          { color: "bg-gray-200 border-gray-300", label: "Ocupado" },
          { color: "bg-blue-500 border-blue-600", label: "Mi puesto" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded border-2 flex-shrink-0 ${item.color}`} />
            <span className="text-xs text-dhl-gray">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Desk Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-dhl-dark text-lg">Puesto {selected.code}</h3>
                <p className="text-dhl-gray text-sm">
                  {selected.type === "cowork"
                    ? "Co-Work — Libre para todos"
                    : selected.type === "shared"
                    ? `Compartido — Área ${selected.area}`
                    : `Fijo — Área ${selected.area}`}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-dhl-light-gray flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Owner info */}
            {selected.assigned_profile && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs text-dhl-gray">Asignado a:</p>
                <p className="font-semibold text-dhl-dark text-sm">
                  {selected.assigned_profile.full_name}
                </p>
                {selected.owner_day_status && (
                  <p className="text-xs text-dhl-gray mt-0.5">
                    Hoy:{" "}
                    {selected.owner_day_status === "site"
                      ? "🏭 En site (puesto libre)"
                      : selected.owner_day_status === "home_office"
                      ? "🏠 Home Office (puesto libre)"
                      : "🏢 En oficina"}
                  </p>
                )}
              </div>
            )}

            {/* Occupied info */}
            {selected.reservation?.status === "confirmed" &&
              selected.reservation.user_id !== myProfile.id && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
                  <p className="text-sm text-dhl-gray">Este puesto está ocupado hoy.</p>
                </div>
              )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* My reservation */}
              {selected.reservation?.user_id === myProfile.id && (
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {loading ? "Cancelando..." : "Cancelar mi reserva"}
                </button>
              )}

              {/* Reserve available */}
              {canReserve(selected, myProfile.id, hasReservation) && (
                <button
                  onClick={() => handleReserve(selected)}
                  disabled={loading}
                  className="w-full bg-dhl-red text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {loading ? "Reservando..." : "Reservar este puesto"}
                </button>
              )}

              {/* Ask the owner */}
              {canAskOwner(selected, myProfile.id) && (
                <button
                  onClick={() => handleAskOwner(selected)}
                  disabled={loading}
                  className="w-full bg-dhl-yellow text-dhl-dark font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-60"
                >
                  {loading ? "Enviando..." : "📨 Preguntar al dueño"}
                </button>
              )}

              {hasReservation && !selected.reservation && selected.assigned_user_id !== myProfile.id && (
                <p className="text-center text-sm text-dhl-gray">
                  Ya tienes una reserva para hoy. Cancela la actual para reservar otro puesto.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
