"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DeskWithStatus, Profile, UserRole } from "@/types";
import { FLOOR_CANVAS, DESK_POSITIONS, ROOM_BOXES, GROUP_BORDERS, ZONE_LABELS } from "@/lib/floorPlan";

interface Props {
  desks: DeskWithStatus[];
  myProfile: Pick<Profile, "id" | "area" | "full_name">;
  today: string;
  myReservationId: string | null;
  myRole?: UserRole;
  releasedHostIds?: string[];
}

const DISABLED_CODES = new Set(["GG01"]);

type DeskState = "mine" | "available" | "occupied" | "disabled";

function getDeskState(
  desk: DeskWithStatus,
  myId: string,
  releasedHostIds: Set<string>
): DeskState {
  if (DISABLED_CODES.has(desk.code)) return "disabled";

  const reserved = desk.reservation?.status === "confirmed";
  const reservedByOther = reserved && desk.reservation?.user_id !== myId;

  // Co-Work: available unless someone else has it
  if (desk.type === "cowork") {
    return reservedByOther ? "occupied" : "available";
  }

  // Unassigned desks (shared without a permanent owner)
  if (!desk.assigned_user_id) {
    return reserved ? "occupied" : "available";
  }

  // My assigned desk (I'm the Host)
  if (desk.assigned_user_id === myId) {
    return "mine";
  }

  // Another host's desk — check if they released today
  if (releasedHostIds.has(desk.assigned_user_id)) {
    return reservedByOther ? "occupied" : "available";
  }

  // Host did not release → occupied
  return "occupied";
}

const STATE_STYLE: Record<DeskState, { bg: string; label: string; icon: string }> = {
  mine:     { bg: "bg-blue-500 border-blue-700 text-white",       label: "Mi puesto", icon: "★" },
  available:{ bg: "bg-green-500 border-green-700 text-white",     label: "Libre",     icon: "✓" },
  occupied: { bg: "bg-dhl-red border-red-700 text-white",         label: "Ocupado",   icon: "✕" },
  disabled: { bg: "bg-gray-200 border-gray-300 text-gray-400",    label: "",          icon: "" },
};

export default function DeskMap({
  desks,
  myProfile,
  today,
  myReservationId,
  myRole = "guest",
  releasedHostIds = [],
}: Props) {
  const [selected, setSelected] = useState<DeskWithStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState(false);
  const [confirmRecover, setConfirmRecover] = useState(false);
  const router = useRouter();

  const releasedSet = new Set(releasedHostIds);
  const deskMap = Object.fromEntries(desks.map((d) => [d.code, d]));
  const hasReservation = !!myReservationId;
  const isGuest = myRole === "guest" || myRole === "client";
  const isHost = myRole === "host";

  const myReleasedToday = isHost && releasedSet.has(myProfile.id);

  // Desk counters
  const availableCount = desks.filter((d) => getDeskState(d, myProfile.id, releasedSet) === "available").length;
  const isWorstCase = !hasReservation && !isHost && availableCount === 0;

  // Log worst-case once
  const worstCaseLogged = useRef(false);
  useEffect(() => {
    if (isWorstCase && !worstCaseLogged.current) {
      worstCaseLogged.current = true;
      fetch("/api/worst-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "desks_full" }),
      });
    }
  }, [isWorstCase]);

  function closeSheet() {
    setSelected(null);
    setPendingCancel(false);
    setConfirmRecover(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function awardRiffs(action: string) {
    await fetch("/api/riffs/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  async function handleReserve(desk: DeskWithStatus) {
    setLoading(true);
    const res = await fetch("/api/desks/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desk_id: desk.id, date: today }),
    });
    if (!res.ok) {
      showToast("Error al reservar. Intenta de nuevo.");
    } else {
      showToast(`Reservaste el puesto ${desk.code}`);
      setSelected(null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleCancel() {
    if (!myReservationId) return;
    setLoading(true);
    await fetch("/api/desks/reserve", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: myReservationId }),
    });
    showToast("Reserva cancelada");
    setSelected(null);
    router.refresh();
    setLoading(false);
  }

  async function handleRelease() {
    setLoading(true);
    const now = new Date();
    const rawDay = now.getDay();
    const dayOfWeek = rawDay === 0 ? 7 : rawDay;
    const d = new Date(now);
    const diff = d.getDate() - rawDay + (rawDay === 0 ? -6 : 1);
    d.setDate(diff);
    const weekStart = d.toISOString().split("T")[0];

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
      awardRiffs("voluntary_release"),
    ]);

    setLoading(false);
    if (planRes.ok) {
      showToast("Espacio liberado. +50 Riffs");
      setSelected(null);
      router.refresh();
    } else {
      showToast("Error al liberar. Intenta de nuevo.");
    }
  }

  async function handleRecover() {
    setLoading(true);
    setConfirmRecover(false);
    const res = await fetch("/api/desks/host-recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json() as { hadGuestReservation: boolean };
      showToast(data.hadGuestReservation
        ? "Base recuperada. -50 Riffs. El Guest fue notificado."
        : "Tu espacio ha sido recuperado."
      );
      setSelected(null);
      router.refresh();
    } else {
      showToast("Error al recuperar. Intenta de nuevo.");
    }
  }

  // ── Floor plan sub-components ──────────────────────────────────

  function FloorDesk({ code, x, y }: { code: string; x: number; y: number }) {
    const desk = deskMap[code];
    if (!desk) {
      return (
        <div
          className="absolute w-[52px] h-[44px] rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center"
          style={{ left: x, top: y }}
        >
          <span className="text-[9px] font-bold text-gray-400">{code}</span>
        </div>
      );
    }

    const state = getDeskState(desk, myProfile.id, releasedSet);
    const style = STATE_STYLE[state];
    const isSelected = selected?.id === desk.id;

    if (state === "disabled") {
      return (
        <div
          className={`absolute w-[52px] h-[44px] rounded-lg border-2 flex items-center justify-center ${style.bg}`}
          style={{ left: x, top: y }}
          aria-hidden="true"
        >
          <span className="text-[9px] font-bold opacity-50">{code}</span>
        </div>
      );
    }

    return (
      <button
        onClick={() => setSelected(desk)}
        className={`absolute w-[52px] h-[44px] rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm ${style.bg} ${isSelected ? "ring-2 ring-dhl-dark ring-offset-1 scale-105" : ""}`}
        style={{ left: x, top: y }}
        aria-label={`Puesto ${code} — ${style.label}`}
      >
        <span className="text-[10px] font-bold leading-none">{code}</span>
        <span className="text-[8px] font-bold leading-none mt-0.5 opacity-80">{style.icon}</span>
      </button>
    );
  }

  function RoomBox({ label, x, y, w = 62, h = 46, muted = false }: {
    label: string; x: number; y: number; w?: number; h?: number; muted?: boolean;
  }) {
    return (
      <div
        className={`absolute rounded-lg border-2 flex items-center justify-center ${
          muted ? "bg-gray-100 border-gray-200 text-gray-400" : "bg-white border-dhl-mid-gray text-dhl-gray"
        }`}
        style={{ left: x, top: y, width: w, height: h }}
        aria-hidden="true"
      >
        <span className="text-[8px] font-semibold text-center leading-tight px-1">{label}</span>
      </div>
    );
  }

  function GroupBorder({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
    return (
      <div
        className="absolute border border-dashed border-dhl-mid-gray rounded-xl pointer-events-none"
        style={{ left: x, top: y, width: w, height: h }}
        aria-hidden="true"
      />
    );
  }

  // ── Bottom Sheet ───────────────────────────────────────────────

  function BottomSheet() {
    if (!selected) return null;
    const state = getDeskState(selected, myProfile.id, releasedSet);
    const style = STATE_STYLE[state];

    const isMyDesk = selected.assigned_user_id === myProfile.id;
    const myDeskIsReleased = isMyDesk && myReleasedToday;
    const myDeskHasGuest = isMyDesk && !!selected.reservation && selected.reservation.user_id !== myProfile.id;

    const canBook = isGuest
      ? (state === "available") && !hasReservation && selected.type === "cowork"
      : (state === "available") && !hasReservation;

    const isMyGuestReservation = state !== "mine" && selected.reservation?.user_id === myProfile.id;

    return (
      <div
        className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center"
        onClick={closeSheet}
      >
        <div
          className="bg-white rounded-t-2xl w-full max-w-lg shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`px-5 py-4 flex items-center justify-between ${style.bg}`}>
            <div>
              <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">
                {selected.type === "cowork" ? "Co-Work" : selected.type === "office" ? "Oficina" : "Fijo"}
                {" · "}{selected.area}
              </p>
              <h3 className="text-xl font-bold mt-0.5">Puesto {selected.code}</h3>
              <p className="text-sm font-semibold mt-0.5">{style.label}</p>
            </div>
            <button onClick={closeSheet} aria-label="Cerrar"
              className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="px-5 py-4 space-y-3">
            {/* Info messages */}
            {state === "available" && selected.type === "cowork" && (
              <p className="text-sm text-dhl-gray">Co-Work siempre disponible. Sin dueño asignado.</p>
            )}
            {state === "available" && selected.assigned_user_id && selected.assigned_user_id !== myProfile.id && (
              <p className="text-sm text-dhl-gray">
                <span className="font-semibold">{selected.assigned_profile?.full_name ?? "Un Host"}</span> liberó su espacio hoy.
              </p>
            )}
            {state === "occupied" && !isMyDesk && (
              <p className="text-sm text-dhl-gray">Este puesto está ocupado hoy.</p>
            )}

            {/* My desk actions */}
            {state === "mine" && !myDeskIsReleased && (
              <>
                <p className="text-sm text-dhl-gray">Tu puesto asignado. Está reservado para ti hoy.</p>
                <button
                  onClick={handleRelease}
                  disabled={loading}
                  className="w-full bg-dhl-yellow text-dhl-dark font-bold py-3.5 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-60"
                >
                  {loading ? "Liberando..." : "Liberar mi espacio (+50 Riffs)"}
                </button>
              </>
            )}

            {state === "mine" && myDeskIsReleased && !confirmRecover && (
              <>
                <p className="text-sm text-green-700 font-medium">Tu espacio está libre hoy.</p>
                {myDeskHasGuest && (
                  <p className="text-xs text-dhl-gray">Un colaborador ya reservó tu espacio.</p>
                )}
                <button
                  onClick={() => setConfirmRecover(true)}
                  disabled={loading}
                  className="w-full bg-white border-2 border-red-200 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  🚩 Recuperar mi base
                </button>
              </>
            )}

            {state === "mine" && myDeskIsReleased && confirmRecover && (
              <div className="space-y-2">
                {myDeskHasGuest && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 text-center">
                    Un colaborador reservó tu espacio. Recuperar costará <strong>−50 Riffs</strong> y se les notificará.
                  </div>
                )}
                <p className="text-sm font-semibold text-dhl-dark text-center">¿Confirmas recuperar tu base?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmRecover(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700">
                    Cancelar
                  </button>
                  <button onClick={handleRecover} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white disabled:opacity-60">
                    {loading ? "..." : "Recuperar"}
                  </button>
                </div>
              </div>
            )}

            {/* Guest: solo Co-Work restriction */}
            {isGuest && state === "available" && selected.type !== "cowork" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-sm text-blue-700 font-medium">Solo puestos Co-Work</p>
                <p className="text-xs text-blue-600 mt-0.5">Como Guest, solo puedes reservar puestos Co-Work disponibles.</p>
              </div>
            )}

            {/* Reserve button */}
            {canBook && (
              <button onClick={() => handleReserve(selected)} disabled={loading}
                className="w-full bg-dhl-red text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60">
                {loading ? "Reservando..." : "Reservar este puesto"}
              </button>
            )}

            {state === "available" && hasReservation && !isMyDesk && !isMyGuestReservation && (
              <p className="text-center text-sm text-dhl-gray bg-gray-50 rounded-xl py-3">
                Ya tienes una reserva hoy. Libérala primero para reservar este puesto.
              </p>
            )}

            {/* Cancel my guest reservation */}
            {isMyGuestReservation && !pendingCancel && (
              <button onClick={() => setPendingCancel(true)} disabled={loading}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors">
                Cancelar reserva
              </button>
            )}
            {isMyGuestReservation && pendingCancel && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                <p className="text-sm font-semibold text-red-700 text-center">¿Confirmas cancelar tu reserva?</p>
                <div className="flex gap-2">
                  <button onClick={() => setPendingCancel(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700">
                    No, volver
                  </button>
                  <button onClick={handleCancel} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white disabled:opacity-60">
                    {loading ? "..." : "Sí, cancelar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="relative space-y-3">
      {toast && (
        <div className="fixed top-16 left-0 right-0 mx-4 z-50 pointer-events-none">
          <div className="bg-dhl-dark text-white text-sm rounded-xl px-4 py-3 shadow-xl max-w-lg mx-auto text-center">
            {toast}
          </div>
        </div>
      )}

      {/* Worst Case — Oficina llena */}
      {isWorstCase && (
        <div className="bg-gradient-to-br from-dhl-yellow/20 to-dhl-yellow/5 border border-dhl-yellow rounded-2xl px-5 py-5 text-center">
          <p className="text-2xl font-black text-dhl-dark mb-1">🚀</p>
          <p className="text-sm font-bold text-dhl-dark">¡Oficina a máxima capacidad!</p>
          <p className="text-xs text-dhl-gray mt-1.5 leading-relaxed">
            Hoy la base en Ciudad Empresarial está llena.<br/>
            Aprovecha para conectar con la operación visitando un Site o trabaja desde otro lugar inspirador.
          </p>
        </div>
      )}

      {/* Summary banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
        <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide mb-3">Disponibilidad ahora</p>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-green-50 border border-green-200 px-2 py-2.5">
            <p className="text-lg font-bold text-green-700">{availableCount}</p>
            <p className="text-[10px] font-semibold text-green-600 leading-tight">Puestos<br/>disponibles</p>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-200 px-2 py-2.5">
            <p className="text-lg font-bold text-dhl-red">{desks.length - availableCount}</p>
            <p className="text-[10px] font-semibold text-red-600 leading-tight">Puestos<br/>ocupados</p>
          </div>
        </div>
        {!hasReservation && !isHost && availableCount > 0 && (
          <p className="text-xs text-green-700 font-semibold text-center mt-3 bg-green-50 rounded-lg py-2">
            {availableCount} puesto{availableCount > 1 ? "s" : ""} disponible{availableCount > 1 ? "s" : ""} — toca uno para reservar
          </p>
        )}
        {hasReservation && (
          <p className="text-xs text-blue-700 font-semibold text-center mt-3 bg-blue-50 rounded-lg py-2">
            Ya tienes una reserva para hoy
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray px-4 py-3">
        <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide mb-2">Referencias</p>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          {[
            { bg: "bg-green-500 border-green-700",  icon: "✓", label: "Disponible" },
            { bg: "bg-dhl-red border-red-700",       icon: "✕", label: "Ocupado" },
            { bg: "bg-blue-500 border-blue-700",     icon: "★", label: "Mi puesto asignado" },
            { bg: "bg-gray-200 border-gray-300",     icon: "",  label: "Fuera de servicio" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-6 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                <span className="text-[8px] font-bold text-white">{item.icon}</span>
              </div>
              <span className="text-xs text-dhl-gray leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floor Plan */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray overflow-hidden">
        <div className="bg-dhl-yellow px-4 py-3 flex items-center justify-between">
          <h2 className="text-dhl-dark font-bold text-sm">Planta CE — Toca un puesto</h2>
          <span className="text-dhl-dark/60 text-xs">← desliza →</span>
        </div>

        <div className="overflow-x-auto p-3">
          <div className="relative rounded-xl bg-gray-50" style={{ width: FLOOR_CANVAS.width, height: FLOOR_CANVAS.height }}>

            {ZONE_LABELS.map((z) => (
              <span
                key={z.text}
                className="absolute text-[8px] font-bold text-dhl-gray/50 uppercase tracking-widest"
                style={{ left: z.x, top: z.y }}
              >
                {z.text}
              </span>
            ))}

            {ROOM_BOXES.map((room) => (
              <RoomBox key={room.label} {...room} />
            ))}

            {GROUP_BORDERS.map((b, i) => (
              <GroupBorder key={i} {...b} />
            ))}

            {Object.entries(DESK_POSITIONS).map(([code, pos]) => (
              <FloorDesk key={code} code={code} x={pos.x} y={pos.y} />
            ))}
          </div>
        </div>
      </div>

      <BottomSheet />
    </div>
  );
}
