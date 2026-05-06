"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DeskWithStatus, Profile } from "@/types";

interface Props {
  desks: DeskWithStatus[];
  myProfile: Pick<Profile, "id" | "area" | "full_name">;
  today: string;
  myReservationId: string | null;
}

const DISABLED_CODES = new Set(["GG01"]);
const CUTOFF_HOUR = 9;
const CUTOFF_MIN = 30;

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

// Visual config per state
const STATE_STYLE: Record<DeskState, { bg: string; label: string; icon: string }> = {
  cowork:   { bg: "bg-dhl-yellow border-yellow-400 text-dhl-dark", label: "Co-Work", icon: "★" },
  available:{ bg: "bg-green-500 border-green-700 text-white",      label: "Libre",   icon: "✓" },
  pending:  { bg: "bg-amber-400 border-amber-600 text-amber-900",  label: "Esperar", icon: "⏱" },
  mine:     { bg: "bg-blue-500 border-blue-700 text-white",        label: "Mi puesto",icon: "↓" },
  checkedin:{ bg: "bg-blue-700 border-blue-900 text-white",        label: "Llegué",  icon: "✓" },
  occupied: { bg: "bg-gray-400 border-gray-500 text-white",        label: "Ocupado", icon: "✕" },
  disabled: { bg: "bg-gray-200 border-gray-300 text-gray-400",     label: "",        icon: "" },
};

export default function DeskMap({ desks, myProfile, today, myReservationId }: Props) {
  const [selected, setSelected] = useState<DeskWithStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  const deskMap = Object.fromEntries(desks.map((d) => [d.code, d]));
  const hasReservation = !!myReservationId;
  const past930 = isPastCutoff();

  // Counts for summary banner
  const coworkAvail  = desks.filter((d) => getDeskState(d, myProfile.id) === "cowork").length;
  const released     = desks.filter((d) => getDeskState(d, myProfile.id) === "available" && d.assigned_user_id).length;
  const pendingCount = desks.filter((d) => getDeskState(d, myProfile.id) === "pending").length;
  const totalFree    = desks.filter((d) => ["cowork","available"].includes(getDeskState(d, myProfile.id))).length;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleReserve(desk: DeskWithStatus) {
    setLoading(true);
    const res = await fetch("/api/desks/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desk_id: desk.id, date: today }),
    });
    if (!res.ok) showToast("Error al reservar. Intenta de nuevo.");
    else { showToast(`Reservaste el puesto ${desk.code}`); setSelected(null); router.refresh(); }
    setLoading(false);
  }

  async function handleCheckin(desk: DeskWithStatus) {
    setLoading(true);
    const res = await fetch("/api/desks/reserve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desk_id: desk.id, date: today }),
    });
    if (!res.ok) showToast("Error al marcar llegada.");
    else { showToast("Llegada marcada. Tu puesto está asegurado."); setSelected(null); router.refresh(); }
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

  // ── Floor plan sub-components ──────────────────────────────────

  function FloorDesk({ code, x, y }: { code: string; x: number; y: number }) {
    const desk = deskMap[code];
    if (!desk) {
      return (
        <div
          className="absolute w-[52px] h-[44px] rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center"
          style={{ left: x, top: y }}
          title={`${code} — sin datos`}
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
    const canBook = (state === "cowork" || state === "available") && !hasReservation;

    return (
      <div
        className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center"
        onClick={() => setSelected(null)}
      >
        <div
          className="bg-white rounded-t-2xl w-full max-w-lg shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Color strip header */}
          <div className={`px-5 py-4 flex items-center justify-between ${style.bg}`}>
            <div>
              <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">
                {selected.type === "cowork" ? "Co-Work" : selected.type === "shared" ? "Compartido" : "Fijo"}
                {" · "}{selected.area}
              </p>
              <h3 className="text-xl font-bold mt-0.5">Puesto {selected.code}</h3>
              <p className="text-sm font-semibold mt-0.5">{style.label}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              aria-label="Cerrar"
              className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="px-5 py-4 space-y-3">
            {/* Context info */}
            {state === "mine" && (
              <p className="text-sm text-dhl-gray">
                Este puesto está asignado a ti. Marca tu llegada antes de las 9:30 AM para asegurarlo. Si no llegas, quedará disponible para otros.
              </p>
            )}
            {state === "checkedin" && (
              <p className="text-sm text-green-700 font-medium">Tu puesto está asegurado para hoy.</p>
            )}
            {state === "cowork" && (
              <p className="text-sm text-dhl-gray">Puesto sin dueño asignado. Disponible para cualquier colaborador, todos los días.</p>
            )}
            {state === "available" && selected.assigned_user_id && (
              <p className="text-sm text-dhl-gray">
                Asignado a <span className="font-semibold">{selected.assigned_profile?.full_name ?? "un colaborador"}</span>, quien no llegó antes de las 9:30 AM. Disponible para reservar.
              </p>
            )}
            {state === "available" && !selected.assigned_user_id && (
              <p className="text-sm text-dhl-gray">Puesto compartido disponible para reservar hoy.</p>
            )}
            {state === "pending" && (
              <p className="text-sm text-dhl-gray">
                Asignado a <span className="font-semibold">{selected.assigned_profile?.full_name ?? "un colaborador"}</span>. Si no hace check-in antes de las <span className="font-semibold">9:30 AM</span>, el puesto quedará libre automáticamente.
              </p>
            )}
            {state === "occupied" && selected.reservation?.user_id !== myProfile.id && (
              <p className="text-sm text-dhl-gray">Este puesto ya está ocupado hoy.</p>
            )}

            {/* Actions */}
            {state === "mine" && (
              <button
                onClick={() => handleCheckin(selected)}
                disabled={loading}
                className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-60"
              >
                {loading ? "Marcando llegada..." : "Marcar mi llegada"}
              </button>
            )}

            {(state === "checkedin" || selected.reservation?.user_id === myProfile.id) && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                {loading ? "Cancelando..." : "Liberar este puesto"}
              </button>
            )}

            {canBook && (
              <button
                onClick={() => handleReserve(selected)}
                disabled={loading}
                className="w-full bg-dhl-red text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
              >
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
                <p className="text-sm font-semibold text-amber-700">Vuelve después de las 9:30 AM</p>
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
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-0 right-0 mx-4 z-50 pointer-events-none">
          <div className="bg-dhl-dark text-white text-sm rounded-xl px-4 py-3 shadow-xl max-w-lg mx-auto text-center">
            {toast}
          </div>
        </div>
      )}

      {/* Summary banner — what can I do today */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
        <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide mb-3">Disponibilidad ahora</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-dhl-yellow/20 border border-yellow-300 px-2 py-2.5">
            <p className="text-lg font-bold text-dhl-dark">{coworkAvail}</p>
            <p className="text-[10px] font-semibold text-dhl-dark/70 leading-tight">Co-Work<br/>siempre libres</p>
          </div>
          <div className="rounded-xl bg-green-50 border border-green-200 px-2 py-2.5">
            <p className="text-lg font-bold text-green-700">{released}</p>
            <p className="text-[10px] font-semibold text-green-600 leading-tight">Liberados<br/>{past930 ? "desde 9:30" : "a las 9:30"}</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-2 py-2.5">
            <p className="text-lg font-bold text-amber-700">{pendingCount}</p>
            <p className="text-[10px] font-semibold text-amber-600 leading-tight">Pendientes<br/>check-in</p>
          </div>
        </div>
        {!hasReservation && totalFree > 0 && (
          <p className="text-xs text-green-700 font-semibold text-center mt-3 bg-green-50 rounded-lg py-2">
            {totalFree} puesto{totalFree > 1 ? "s" : ""} disponible{totalFree > 1 ? "s" : ""} para ti ahora — toca uno en el plano para reservar
          </p>
        )}
        {hasReservation && (
          <p className="text-xs text-blue-700 font-semibold text-center mt-3 bg-blue-50 rounded-lg py-2">
            Ya tienes una reserva para hoy
          </p>
        )}
      </div>

      {/* Legend — BEFORE the map */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray px-4 py-3">
        <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide mb-2">Referencias</p>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          {[
            { bg: "bg-dhl-yellow border-yellow-400", icon: "★", label: "Co-Work — siempre libre" },
            { bg: "bg-green-500 border-green-700",   icon: "✓", label: "Libre / disponible ahora" },
            { bg: "bg-amber-400 border-amber-600",   icon: "⏱", label: "Pendiente (antes 9:30)" },
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

      {/* Cutoff banner if before 9:30 */}
      {!past930 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <p className="text-xs text-amber-700">
            Los puestos <span className="font-semibold">⏱ Pendiente</span> se liberan automáticamente a las <span className="font-semibold">9:30 AM</span> si el dueño no hace check-in.
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

            {/* Zone labels */}
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

            {/* Left column */}
            <RoomBox label="HR"   x={4} y={108} />
            <RoomBox label="FIN"  x={4} y={162} />
            <RoomBox label="BD"   x={4} y={240} />
            <RoomBox label="SD"   x={4} y={294} />
            <RoomBox label="OE"   x={4} y={372} />
            <RoomBox label="Sala" x={4} y={426} />
            <RoomBox label="Ops"  x={4} y={498} muted />
            <RoomBox label="GG"   x={4} y={554} />

            {/* ZONA B — Group 1 */}
            <GroupBorder x={68} y={104} w={120} h={112} />
            <FloorDesk code="B01" x={72}  y={108} />
            <FloorDesk code="B02" x={130} y={108} />
            <FloorDesk code="B03" x={72}  y={162} />
            <FloorDesk code="B04" x={130} y={162} />

            {/* ZONA B — Group 2 */}
            <GroupBorder x={68} y={236} w={120} h={112} />
            <FloorDesk code="B05" x={72}  y={240} />
            <FloorDesk code="B06" x={130} y={240} />
            <FloorDesk code="B07" x={72}  y={294} />
            <FloorDesk code="B08" x={130} y={294} />

            {/* ZONA B — Group 3 */}
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

            {/* GG01 disabled */}
            <FloorDesk code="GG01" x={100} y={498} />

            {/* Meeting room */}
            <RoomBox label="Sala de Reunión" x={72} y={560} w={248} h={48} />
          </div>
        </div>
      </div>

      <BottomSheet />
    </div>
  );
}
