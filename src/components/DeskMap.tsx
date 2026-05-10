"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DeskWithStatus, Profile, UserRole } from "@/types";

interface Props {
  desks: DeskWithStatus[];
  myProfile: Pick<Profile, "id" | "area" | "full_name">;
  today: string;
  myReservationId: string | null;
  myRole?: UserRole;
}

const DISABLED_CODES = new Set(["GG01"]);
const CUTOFF_HOUR = 9;
const CUTOFF_MIN  = 1; // 9:01 AM

function isPastCutoff(): boolean {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() >= CUTOFF_HOUR * 60 + CUTOFF_MIN;
}

type DeskState = "mine" | "checkedin" | "cowork" | "available" | "pending" | "occupied" | "disabled";

function getDeskState(desk: DeskWithStatus, myId: string): DeskState {
  if (DISABLED_CODES.has(desk.code)) return "disabled";
  const reserved = desk.reservation?.status === "confirmed";
  if (desk.type === "cowork") return reserved ? "occupied" : "cowork";
  if (!desk.assigned_user_id) return reserved ? "occupied" : "available";
  if (desk.assigned_user_id === myId) {
    return reserved && desk.reservation?.user_id === myId ? "checkedin" : "mine";
  }
  if (reserved) return "occupied";
  return isPastCutoff() ? "available" : "pending";
}

const STATE_STYLE: Record<DeskState, { bg: string; label: string; icon: string }> = {
  cowork:   { bg: "bg-dhl-yellow border-yellow-400 text-dhl-dark", label: "Co-Work", icon: "★" },
  available:{ bg: "bg-green-500 border-green-700 text-white",      label: "Libre",   icon: "✓" },
  pending:  { bg: "bg-amber-400 border-amber-600 text-amber-900",  label: "Esperar", icon: "⏱" },
  mine:     { bg: "bg-blue-500 border-blue-700 text-white",        label: "Mi puesto",icon: "↓" },
  checkedin:{ bg: "bg-blue-700 border-blue-900 text-white",        label: "Llegué",  icon: "✓" },
  occupied: { bg: "bg-gray-400 border-gray-500 text-white",        label: "Ocupado", icon: "✕" },
  disabled: { bg: "bg-gray-200 border-gray-300 text-gray-400",     label: "",        icon: "" },
};

export default function DeskMap({ desks, myProfile, today, myReservationId, myRole = "professional" }: Props) {
  const [selected, setSelected] = useState<DeskWithStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [carpooling, setCarpooling] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(false);
  const router = useRouter();

  function closeSheet() {
    setSelected(null);
    setPendingCancel(false);
  }

  const deskMap = Object.fromEntries(desks.map((d) => [d.code, d]));
  const hasReservation = !!myReservationId;
  const past901 = isPastCutoff();
  const isGuest = myRole === "guest";
  const isExecutive = myRole === "executive";

  const coworkAvail  = desks.filter((d) => getDeskState(d, myProfile.id) === "cowork").length;
  const released     = desks.filter((d) => getDeskState(d, myProfile.id) === "available" && d.assigned_user_id).length;
  const pendingCount = desks.filter((d) => getDeskState(d, myProfile.id) === "pending").length;
  const totalFree    = desks.filter((d) => ["cowork","available"].includes(getDeskState(d, myProfile.id))).length;
  const isWorstCase  = !hasReservation && totalFree === 0 && past901;

  // Log worst-case once when the condition first becomes true
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

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function awardRiffs(action: string, ref_id?: string) {
    await fetch("/api/riffs/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ref_id }),
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

  async function handleCheckin(desk: DeskWithStatus) {
    setLoading(true);
    const res = await fetch("/api/desks/reserve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desk_id: desk.id, date: today, carpooling }),
    });
    if (!res.ok) {
      showToast("Error al marcar llegada.");
    } else {
      const riffsAction = carpooling ? "checkin_carpooling" : "checkin_ontime";
      await awardRiffs(riffsAction, desk.id);
      const riffsMsg = carpooling ? " +30 Riffs por carpooling" : " +10 Riffs";
      showToast(`Llegada marcada.${riffsMsg}`);
      setSelected(null);
      setCarpooling(false);
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

  async function handleEarlyCheckout(solidarity = false) {
    if (!myReservationId) return;
    setLoading(true);
    const res = await fetch("/api/desks/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: myReservationId, solidarity }),
    });
    if (res.ok) {
      const pts = solidarity ? 50 : 20;
      showToast(`Espacio liberado. +${pts} Riffs`);
      setSelected(null);
      router.refresh();
    } else {
      showToast("Error al liberar. Intenta de nuevo.");
    }
    setLoading(false);
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

    const state = getDeskState(desk, myProfile.id);
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

  // ── Bottom sheet ───────────────────────────────────────────────

  function BottomSheet() {
    if (!selected) return null;
    const state = getDeskState(selected, myProfile.id);
    const style = STATE_STYLE[state];

    // Guests can only book cowork
    const canBook = isGuest
      ? state === "cowork" && !hasReservation
      : (state === "cowork" || state === "available") && !hasReservation;

    const isMyCheckedIn = state === "checkedin" || selected.reservation?.user_id === myProfile.id;

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
                {selected.type === "cowork" ? "Co-Work" : selected.type === "shared" ? "Compartido" : "Fijo"}
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
            {state === "mine" && (
              <p className="text-sm text-dhl-gray">
                Tu puesto asignado. Marca tu llegada antes de las 9:01 AM para asegurarlo.
              </p>
            )}
            {state === "checkedin" && (
              <p className="text-sm text-green-700 font-medium">Tu puesto está asegurado para hoy.</p>
            )}
            {state === "cowork" && (
              <p className="text-sm text-dhl-gray">Co-Work sin dueño asignado. Disponible todos los días.</p>
            )}
            {state === "available" && selected.assigned_user_id && (
              <p className="text-sm text-dhl-gray">
                Asignado a <span className="font-semibold">{selected.assigned_profile?.full_name ?? "un colaborador"}</span>, liberado automáticamente a las 9:01 AM.
              </p>
            )}
            {state === "available" && !selected.assigned_user_id && (
              <p className="text-sm text-dhl-gray">Puesto compartido disponible para hoy.</p>
            )}
            {state === "pending" && (
              <p className="text-sm text-dhl-gray">
                Asignado a <span className="font-semibold">{selected.assigned_profile?.full_name ?? "un colaborador"}</span>. Si no hace check-in antes de las <span className="font-semibold">9:01 AM</span>, quedará libre.
              </p>
            )}
            {state === "occupied" && selected.reservation?.user_id !== myProfile.id && (
              <p className="text-sm text-dhl-gray">Este puesto ya está ocupado hoy.</p>
            )}

            {/* Guest restriction banner */}
            {isGuest && state !== "cowork" && state !== "occupied" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-sm text-blue-700 font-medium">Solo puestos Co-Work</p>
                <p className="text-xs text-blue-600 mt-0.5">Como visita, solo puedes reservar puestos Co-Work (amarillos).</p>
              </div>
            )}

            {/* Carpooling toggle — shown on "mine" state for professionals */}
            {state === "mine" && !isGuest && (
              <label className="flex items-center gap-3 bg-dhl-yellow/10 border border-dhl-yellow rounded-xl px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={carpooling}
                  onChange={(e) => setCarpooling(e.target.checked)}
                  className="w-4 h-4 accent-dhl-red"
                />
                <div>
                  <p className="text-sm font-semibold text-dhl-dark">Vine en Carpooling</p>
                  <p className="text-xs text-dhl-gray">+30 Riffs por compartir el viaje</p>
                </div>
              </label>
            )}

            {/* Actions */}
            {state === "mine" && (
              <button onClick={() => handleCheckin(selected)} disabled={loading}
                className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-60">
                {loading ? "Marcando llegada..." : carpooling ? "Marcar llegada + Carpooling" : "Marcar mi llegada"}
              </button>
            )}

            {/* Professional: Early checkout */}
            {isMyCheckedIn && !isExecutive && (
              <button onClick={() => handleEarlyCheckout(false)} disabled={loading}
                className="w-full bg-orange-100 text-orange-700 font-semibold py-3 rounded-xl hover:bg-orange-200 transition-colors disabled:opacity-60">
                {loading ? "Liberando..." : "Liberar espacio ahora (+20 Riffs)"}
              </button>
            )}

            {/* Executive: Solidarity release */}
            {isMyCheckedIn && isExecutive && (
              <button onClick={() => handleEarlyCheckout(true)} disabled={loading}
                className="w-full bg-dhl-yellow text-dhl-dark font-bold py-3.5 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-60">
                {loading ? "Liberando..." : "Liberar solidariamente (+50 Riffs)"}
              </button>
            )}

            {isMyCheckedIn && !pendingCancel && (
              <button onClick={() => setPendingCancel(true)} disabled={loading}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60">
                Cancelar reserva
              </button>
            )}
            {isMyCheckedIn && pendingCancel && (
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

            {canBook && (
              <button onClick={() => handleReserve(selected)} disabled={loading}
                className="w-full bg-dhl-red text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60">
                {loading ? "Reservando..." : "Reservar este puesto"}
              </button>
            )}

            {(state === "cowork" || state === "available") && hasReservation && selected.reservation?.user_id !== myProfile.id && (
              <p className="text-center text-sm text-dhl-gray bg-gray-50 rounded-xl py-3">
                Ya tienes una reserva hoy. Libérala primero para reservar este puesto.
              </p>
            )}

            {state === "pending" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-semibold text-amber-700">Vuelve después de las 9:01 AM</p>
                <p className="text-xs text-amber-600 mt-0.5">Si el dueño no llega, podrás reservar este puesto.</p>
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

      {/* Guest banner */}
      {isGuest && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-700">Modo Explorador</p>
            <p className="text-xs text-blue-600 mt-0.5">Ingresa a la app para buscar puestos Co-Work disponibles después de las 9:01 AM.</p>
          </div>
        </div>
      )}

      {/* Worst Case — Oficina llena */}
      {isWorstCase && (
        <div
          className="bg-gradient-to-br from-dhl-yellow/20 to-dhl-yellow/5 border border-dhl-yellow rounded-2xl px-5 py-5 text-center"
        >
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
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-dhl-yellow/20 border border-yellow-300 px-2 py-2.5">
            <p className="text-lg font-bold text-dhl-dark">{coworkAvail}</p>
            <p className="text-[10px] font-semibold text-dhl-dark/70 leading-tight">Co-Work<br/>siempre libres</p>
          </div>
          <div className="rounded-xl bg-green-50 border border-green-200 px-2 py-2.5">
            <p className="text-lg font-bold text-green-700">{released}</p>
            <p className="text-[10px] font-semibold text-green-600 leading-tight">Liberados<br/>{past901 ? "desde 9:01" : "a las 9:01"}</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-2 py-2.5">
            <p className="text-lg font-bold text-amber-700">{pendingCount}</p>
            <p className="text-[10px] font-semibold text-amber-600 leading-tight">Pendientes<br/>check-in</p>
          </div>
        </div>
        {!hasReservation && totalFree > 0 && (
          <p className="text-xs text-green-700 font-semibold text-center mt-3 bg-green-50 rounded-lg py-2">
            {totalFree} puesto{totalFree > 1 ? "s" : ""} disponible{totalFree > 1 ? "s" : ""} — toca uno para reservar
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
            { bg: "bg-dhl-yellow border-yellow-400", icon: "★", label: "Co-Work — siempre libre" },
            { bg: "bg-green-500 border-green-700",   icon: "✓", label: "Libre / disponible ahora" },
            { bg: "bg-amber-400 border-amber-600",   icon: "⏱", label: "Pendiente (antes 9:01)" },
            { bg: "bg-blue-500 border-blue-700",     icon: "↓", label: "Mi puesto asignado" },
            { bg: "bg-gray-400 border-gray-500",     icon: "✕", label: "Ocupado hoy" },
            { bg: "bg-gray-200 border-gray-300",     icon: "",  label: "No disponible" },
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

      {/* Cutoff banner */}
      {!past901 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <p className="text-xs text-amber-700">
            Los puestos <span className="font-semibold">⏱ Pendiente</span> se liberan automáticamente a las <span className="font-semibold">9:01 AM</span>.
          </p>
        </div>
      )}

      {/* Floor Plan */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray overflow-hidden">
        <div className="bg-dhl-yellow px-4 py-3 flex items-center justify-between">
          <h2 className="text-dhl-dark font-bold text-sm">Planta CE — Toca un puesto</h2>
          <span className="text-dhl-dark/60 text-xs">← desliza →</span>
        </div>

        <div className="overflow-x-auto p-3">
          <div className="relative rounded-xl bg-gray-50" style={{ width: 548, height: 636 }}>

            <span className="absolute text-[8px] font-bold text-dhl-gray/50 uppercase tracking-widest" style={{ left: 72, top: 12 }}>Zona A</span>
            <span className="absolute text-[8px] font-bold text-dhl-gray/50 uppercase tracking-widest" style={{ left: 72, top: 92 }}>Zona B</span>
            <span className="absolute text-[8px] font-bold text-dhl-gray/50 uppercase tracking-widest" style={{ left: 248, top: 92 }}>Zona C</span>

            {/* ZONA A */}
            <FloorDesk code="A01" x={72}  y={24} />
            <FloorDesk code="A02" x={130} y={24} />
            <FloorDesk code="A03" x={188} y={24} />
            <FloorDesk code="A04" x={246} y={24} />
            <FloorDesk code="A05" x={304} y={24} />
            <FloorDesk code="A06" x={362} y={24} />
            <RoomBox label="Oficina OE" x={424} y={24} w={116} h={44} />

            <RoomBox label="HR"   x={4} y={108} />
            <RoomBox label="FIN"  x={4} y={162} />
            <RoomBox label="BD"   x={4} y={240} />
            <RoomBox label="SD"   x={4} y={294} />
            <RoomBox label="OE"   x={4} y={372} />
            <RoomBox label="Sala" x={4} y={426} />
            <RoomBox label="Ops"  x={4} y={498} muted />
            <RoomBox label="GG"   x={4} y={554} />

            {/* ZONA B */}
            <GroupBorder x={68} y={104} w={120} h={112} />
            <FloorDesk code="B01" x={72}  y={108} />
            <FloorDesk code="B02" x={130} y={108} />
            <FloorDesk code="B03" x={72}  y={162} />
            <FloorDesk code="B04" x={130} y={162} />

            <GroupBorder x={68} y={236} w={120} h={112} />
            <FloorDesk code="B05" x={72}  y={240} />
            <FloorDesk code="B06" x={130} y={240} />
            <FloorDesk code="B07" x={72}  y={294} />
            <FloorDesk code="B08" x={130} y={294} />

            <GroupBorder x={68} y={368} w={120} h={112} />
            <FloorDesk code="B09" x={72}  y={372} />
            <FloorDesk code="B10" x={130} y={372} />
            <FloorDesk code="B11" x={72}  y={426} />
            <FloorDesk code="B12" x={130} y={426} />

            {/* ZONA C */}
            <FloorDesk code="C01" x={248} y={108} />
            <FloorDesk code="C02" x={306} y={108} />
            <FloorDesk code="C03" x={364} y={108} />
            <FloorDesk code="C04" x={248} y={162} />
            <FloorDesk code="C05" x={306} y={162} />
            <FloorDesk code="C06" x={364} y={162} />

            <FloorDesk code="GG01" x={100} y={498} />
            <RoomBox label="Sala de Reunión" x={72} y={560} w={248} h={48} />
          </div>
        </div>
      </div>

      <BottomSheet />
    </div>
  );
}
