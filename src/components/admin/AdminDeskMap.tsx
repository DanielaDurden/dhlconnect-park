"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FLOOR_CANVAS, DESK_POSITIONS, ROOM_BOXES, GROUP_BORDERS, ZONE_LABELS } from "@/lib/floorPlan";

export interface AdminDeskData {
  id: string;
  code: string;
  zone: string | null;
  type: string;
  area: string | null;
  is_active: boolean;
  assigned_user_id: string | null;
  assigned_profile: { id: string; full_name: string; email: string } | null;
  reservation: {
    id: string;
    user_id: string;
    checked_in: boolean;
    status: string;
    profiles: { full_name: string; email: string; role: string } | null;
  } | null;
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Props {
  desks: AdminDeskData[];
  users: AdminUser[];
  today: string;
}

type AdminDeskState = "occupied" | "available" | "out_of_service";

const ROLE_LABELS: Record<string, string> = {
  host: "Host",
  executive: "Host",
  guest: "Visita",
  professional: "Visita",
  admin: "Admin",
};

function getDeskState(desk: AdminDeskData): AdminDeskState {
  if (!desk.is_active) return "out_of_service";
  if (desk.reservation) return "occupied";
  return "available";
}

const STATE_STYLE: Record<AdminDeskState, { bg: string; dot: string }> = {
  occupied:      { bg: "bg-red-500 border-red-700 text-white",    dot: "bg-red-500" },
  available:     { bg: "bg-green-500 border-green-700 text-white", dot: "bg-green-500" },
  out_of_service:{ bg: "bg-gray-300 border-gray-400 text-gray-500", dot: "bg-gray-400" },
};

export default function AdminDeskMap({ desks, users, today }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<AdminDeskData | null>(null);
  const [reserveFor, setReserveFor] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const deskMap = Object.fromEntries(desks.map((d) => [d.code, d]));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function forceRelease(reservationId: string) {
    const res = await fetch("/api/admin/force-release", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: reservationId }),
    });
    if (res.ok) {
      showToast("Puesto liberado forzosamente.");
      setSelected(null);
      startTransition(() => router.refresh());
    } else {
      showToast("Error al liberar. Intenta de nuevo.");
    }
  }

  async function reserveForUser() {
    if (!selected || !reserveFor) return;
    const res = await fetch("/api/admin/reserve-for-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desk_id: selected.id, user_id: reserveFor, date: today }),
    });
    if (res.ok) {
      showToast("Reserva creada correctamente.");
      setSelected(null);
      setReserveFor("");
      startTransition(() => router.refresh());
    } else {
      showToast("Error al reservar. Intenta de nuevo.");
    }
  }

  async function toggleService(desk: AdminDeskData) {
    const res = await fetch("/api/admin/desk-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desk_id: desk.id, is_active: !desk.is_active }),
    });
    if (res.ok) {
      showToast(desk.is_active ? "Puesto marcado como Fuera de Servicio." : "Puesto restaurado.");
      setSelected(null);
      startTransition(() => router.refresh());
    } else {
      showToast("Error al actualizar estado.");
    }
  }

  // Stats
  const totalActive = desks.filter((d) => d.is_active).length;
  const occupied = desks.filter((d) => d.reservation?.status === "confirmed").length;
  const outOfService = desks.filter((d) => !d.is_active).length;

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-16 left-0 right-0 mx-6 z-50 pointer-events-none">
          <div className="bg-dhl-dark text-white text-sm rounded-xl px-4 py-3 shadow-xl max-w-2xl mx-auto text-center">
            {toast}
          </div>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Ocupados", value: occupied, color: "text-red-600" },
          { label: "Disponibles", value: totalActive - occupied, color: "text-green-600" },
          { label: "Fuera de servicio", value: outOfService, color: "text-gray-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-dhl-mid-gray p-4 text-center shadow-sm">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-dhl-gray mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl border border-dhl-mid-gray px-5 py-3 flex flex-wrap gap-4">
        {[
          { dot: "bg-red-500",   label: "Ocupado" },
          { dot: "bg-green-500", label: "Disponible" },
          { dot: "bg-gray-400",  label: "Fuera de servicio" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.dot}`} />
            <span className="text-xs text-dhl-gray">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Map + Panel */}
      <div className="flex gap-4 items-start">
        {/* Floor plan */}
        <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden flex-shrink-0">
          <div className="bg-dhl-yellow px-4 py-3">
            <h2 className="text-dhl-dark font-bold text-sm">Planta CE — Toca un puesto</h2>
          </div>
          <div className="overflow-auto p-3">
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
                <div
                  key={room.label}
                  className={`absolute rounded-lg border-2 flex items-center justify-center ${room.muted ? "bg-gray-100 border-gray-200 text-gray-400" : "bg-white border-dhl-mid-gray text-dhl-gray"}`}
                  style={{ left: room.x, top: room.y, width: room.w ?? 62, height: room.h ?? 46 }}
                  aria-hidden="true"
                >
                  <span className="text-[8px] font-semibold text-center leading-tight px-1">{room.label}</span>
                </div>
              ))}

              {GROUP_BORDERS.map((b, i) => (
                <div
                  key={i}
                  className="absolute border border-dashed border-dhl-mid-gray rounded-xl pointer-events-none"
                  style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
                  aria-hidden="true"
                />
              ))}

              {Object.entries(DESK_POSITIONS).map(([code, pos]) => {
                const desk = deskMap[code];
                if (!desk) return null;
                const state = getDeskState(desk);
                const style = STATE_STYLE[state];
                const isSelected = selected?.id === desk.id;
                const occupant = desk.reservation?.profiles;
                const nameAbbr = occupant
                  ? occupant.full_name.split(" ").map((w, i) => i === 0 ? w.slice(0, 4) : w[0]).join(" ")
                  : null;

                return (
                  <button
                    key={code}
                    onClick={() => { setSelected(desk); setReserveFor(""); }}
                    className={`absolute w-[52px] h-[44px] rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm ${style.bg} ${isSelected ? "ring-2 ring-dhl-dark ring-offset-1 scale-105" : ""}`}
                    style={{ left: pos.x, top: pos.y }}
                    aria-label={`Puesto ${code}`}
                  >
                    <span className="text-[10px] font-bold leading-none">{code}</span>
                    {nameAbbr && (
                      <span className="text-[7px] font-semibold leading-none mt-0.5 opacity-90 max-w-[48px] truncate px-0.5">
                        {nameAbbr}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Control panel */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden">
              {/* Header */}
              <div className={`px-5 py-4 flex items-start justify-between ${STATE_STYLE[getDeskState(selected)].bg}`}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70">
                    {selected.type === "cowork" ? "Co-Work" : selected.type === "shared" ? "Compartido" : "Fijo"} · Zona {selected.zone}
                  </p>
                  <h3 className="text-2xl font-black mt-0.5">Puesto {selected.code}</h3>
                  {selected.area && <p className="text-xs opacity-70 mt-0.5">{selected.area}</p>}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0"
                  aria-label="Cerrar"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className="px-5 py-5 space-y-5">
                {/* Current occupant */}
                {selected.reservation?.profiles ? (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide">Ocupante actual</p>
                    <p className="font-bold text-dhl-dark">{selected.reservation.profiles.full_name}</p>
                    <p className="text-xs text-dhl-gray">{selected.reservation.profiles.email}</p>
                    <p className="text-xs text-dhl-gray">
                      {ROLE_LABELS[selected.reservation.profiles.role] ?? selected.reservation.profiles.role}
                    </p>
                  </div>
                ) : selected.assigned_profile ? (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide">Titular asignado</p>
                    <p className="font-bold text-dhl-dark">{selected.assigned_profile.full_name}</p>
                    <p className="text-xs text-dhl-gray">{selected.assigned_profile.email}</p>
                    <p className="text-xs text-green-600 font-semibold">Libre hoy — no reservó</p>
                  </div>
                ) : (
                  <div className="bg-green-50 rounded-xl px-4 py-3">
                    <p className="text-sm font-semibold text-green-700">Puesto disponible</p>
                    <p className="text-xs text-green-600 mt-0.5">Sin reserva activa hoy.</p>
                  </div>
                )}

                {/* Admin actions */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide">Acciones</p>

                  {/* Force release */}
                  {selected.reservation && (
                    <button
                      onClick={() => forceRelease(selected.reservation!.id)}
                      disabled={isPending}
                      className="w-full flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 font-semibold py-3 px-4 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 text-sm"
                    >
                      <span>🔓</span> Liberación Forzada
                      <span className="text-xs font-normal text-red-500 ml-auto">Remueve la reserva</span>
                    </button>
                  )}

                  {/* Reserve for user */}
                  <div className="space-y-2">
                    <p className="text-xs text-dhl-gray">Reservar para alguien:</p>
                    <select
                      value={reserveFor}
                      onChange={(e) => setReserveFor(e.target.value)}
                      className="w-full border border-dhl-mid-gray rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-dhl-dark bg-white"
                    >
                      <option value="">— Seleccionar colaborador —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({ROLE_LABELS[u.role] ?? u.role})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={reserveForUser}
                      disabled={!reserveFor || isPending}
                      className="w-full bg-dhl-dark text-white font-bold py-3 rounded-xl hover:bg-dhl-dark/90 transition-colors disabled:opacity-40 text-sm"
                    >
                      📋 Asignar reserva
                    </button>
                  </div>

                  {/* Toggle service */}
                  <button
                    onClick={() => toggleService(selected)}
                    disabled={isPending}
                    className={`w-full font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 text-sm border ${
                      selected.is_active
                        ? "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {selected.is_active ? "🔧 Marcar Fuera de Servicio" : "✅ Restaurar puesto"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dhl-mid-gray p-8 text-center shadow-sm">
              <p className="text-3xl mb-3">🗺️</p>
              <p className="font-bold text-dhl-dark">Selecciona un puesto</p>
              <p className="text-sm text-dhl-gray mt-1">Toca cualquier puesto del mapa para ver detalles y acciones.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
