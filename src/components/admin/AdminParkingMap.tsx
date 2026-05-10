"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export interface AdminParkingSpotData {
  id: string;
  spot_number: number;
  spot_status: string;
  assigned_user_name: string | null;
  director_name: string | null;
  is_accessible: boolean;
  is_active: boolean;
  reservation: {
    id: string;
    user_id: string;
    status: string;
    profile_name: string;
  } | null;
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Props {
  spots: AdminParkingSpotData[];
  users: AdminUser[];
  today: string;
}

type AdminSpotState = "occupied" | "assigned" | "director" | "available" | "out_of_service";

const ROLE_LABELS: Record<string, string> = {
  executive: "Executive",
  professional: "Professional",
  guest: "Visita",
  admin: "Admin",
};

function getSpotState(spot: AdminParkingSpotData): AdminSpotState {
  if (!spot.is_active || spot.spot_status === "blocked") return "out_of_service";
  if (spot.reservation) return "occupied";
  if (spot.spot_status === "fixed" || spot.spot_status === "high_frequency") return "assigned";
  if (spot.spot_status === "director_reserved") return "director";
  return "available";
}

const STATE_STYLE: Record<AdminSpotState, string> = {
  occupied:      "bg-red-500 border-red-700 text-white",
  assigned:      "bg-orange-400 border-orange-600 text-white",
  director:      "bg-amber-400 border-amber-600 text-amber-900",
  available:     "bg-green-500 border-green-700 text-white",
  out_of_service:"bg-gray-300 border-gray-400 text-gray-500",
};

function abbr(name: string | null | undefined): string | null {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  return parts.map((w, i) => (i === 0 ? w.slice(0, 5) : w[0])).join(" ");
}

export default function AdminParkingMap({ spots, users, today }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<AdminParkingSpotData | null>(null);
  const [reserveFor, setReserveFor] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const spotMap = Object.fromEntries(spots.map((s) => [s.spot_number, s]));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function forceRelease(reservationId: string) {
    const res = await fetch("/api/admin/force-release-parking", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: reservationId }),
    });
    if (res.ok) {
      showToast("Espacio liberado forzosamente.");
      setSelected(null);
      startTransition(() => router.refresh());
    } else {
      showToast("Error al liberar. Intenta de nuevo.");
    }
  }

  async function reserveForUser() {
    if (!selected || !reserveFor) return;
    const res = await fetch("/api/admin/reserve-parking-for-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spot_id: selected.id, user_id: reserveFor, date: today }),
    });
    if (res.ok) {
      showToast("Reserva de parking creada correctamente.");
      setSelected(null);
      setReserveFor("");
      startTransition(() => router.refresh());
    } else {
      showToast("Error al reservar. Intenta de nuevo.");
    }
  }

  async function toggleService(spot: AdminParkingSpotData) {
    const res = await fetch("/api/admin/parking-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spot_id: spot.id, is_active: !spot.is_active }),
    });
    if (res.ok) {
      showToast(spot.is_active ? "Espacio marcado como Fuera de Servicio." : "Espacio restaurado.");
      setSelected(null);
      startTransition(() => router.refresh());
    } else {
      showToast("Error al actualizar estado.");
    }
  }

  // Stats
  const occupied = spots.filter((s) => s.reservation?.status === "confirmed").length;
  const available = spots.filter((s) => s.is_active && !s.reservation && s.spot_status === "available").length;
  const outOfService = spots.filter((s) => !s.is_active || s.spot_status === "blocked").length;
  const accessible = spots.filter((s) => s.is_accessible && s.is_active).length;

  // ── Inner components ────────────────────────────────────────────

  function Spot({ num, x, y, w = 46, h = 38 }: { num: number; x: number; y: number; w?: number; h?: number }) {
    const spot = spotMap[num];
    if (!spot) {
      return (
        <div
          className="absolute rounded border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center"
          style={{ left: x, top: y, width: w, height: h }}
        >
          <span className="text-[9px] font-bold text-gray-400">{num}</span>
        </div>
      );
    }
    const state = getSpotState(spot);
    const style = STATE_STYLE[state];
    const isSelected = selected?.id === spot.id;

    let label: string | null = null;
    if (state === "occupied") label = abbr(spot.reservation?.profile_name);
    else if (state === "assigned") label = abbr(spot.assigned_user_name?.split(",")[0]);
    else if (state === "director") label = abbr(spot.director_name);

    return (
      <button
        onClick={() => { setSelected(spot); setReserveFor(""); }}
        className={`absolute rounded border-2 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 active:scale-95 shadow-sm ${style} ${isSelected ? "ring-2 ring-dhl-dark ring-offset-1 scale-105" : ""}`}
        style={{ left: x, top: y, width: w, height: h }}
        aria-label={`Espacio ${num}`}
      >
        <span className="text-[10px] font-bold leading-none">{num}</span>
        {label && (
          <span className="text-[7px] leading-none opacity-90 px-0.5 truncate max-w-full">{label}</span>
        )}
        {spot.is_accessible && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5" aria-hidden="true">
            <circle cx="12" cy="4" r="1"/><path d="m9 9 3 3v6"/><path d="m6 15 3-3 4 4"/><path d="M9 9h6"/>
          </svg>
        )}
      </button>
    );
  }

  function Box({ label, x, y, w, h, muted = false }: {
    label: string; x: number; y: number; w: number; h: number; muted?: boolean;
  }) {
    return (
      <div
        className={`absolute rounded border-2 flex items-center justify-center ${muted ? "bg-gray-100 border-gray-200 text-gray-400" : "bg-white border-dhl-mid-gray text-dhl-gray"}`}
        style={{ left: x, top: y, width: w, height: h }}
        aria-hidden="true"
      >
        <span className="text-[8px] font-semibold text-center leading-tight px-1 uppercase tracking-wide">{label}</span>
      </div>
    );
  }

  function Lane({ x, y, h }: { x: number; y: number; h: number }) {
    return (
      <div className="absolute pointer-events-none" style={{ left: x, top: y, width: 24, height: h }} aria-hidden="true">
        {Array.from({ length: Math.floor(h / 20) }).map((_, i) => (
          <div key={i} className="h-3 w-full bg-dhl-yellow/60 mb-1 rounded-sm" />
        ))}
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────

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
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Ocupados", value: occupied, color: "text-red-600" },
          { label: "Disponibles", value: available, color: "text-green-600" },
          { label: "Fuera de servicio", value: outOfService, color: "text-gray-500" },
          { label: "Accesibles activos", value: accessible, color: "text-blue-600" },
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
          { dot: "bg-red-500",     label: "Ocupado (reserva activa)" },
          { dot: "bg-orange-400",  label: "Asignado (fijo / alta freq.)" },
          { dot: "bg-amber-400",   label: "Director" },
          { dot: "bg-green-500",   label: "Disponible" },
          { dot: "bg-gray-400",    label: "Fuera de servicio" },
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
            <h2 className="text-dhl-dark font-bold text-sm">Nivel -2 — Smart Parking</h2>
          </div>
          <div className="overflow-auto p-3">
            <div className="relative rounded-xl bg-gray-50/80" style={{ width: 600, height: 950 }}>

              <span className="absolute text-[8px] font-bold text-dhl-gray/60 uppercase tracking-widest" style={{ left: 8, top: 0 }}>Columna principal</span>
              <span className="absolute text-[8px] font-bold text-dhl-gray/60 uppercase tracking-widest" style={{ left: 120, top: 0 }}>Interior Nivel -2</span>

              {/* LEFT COLUMN 226→207 */}
              <Spot num={226} x={8}  y={16} />
              <Spot num={225} x={8}  y={60} />
              <Spot num={224} x={8}  y={104} />
              <Spot num={223} x={8}  y={148} />
              <Spot num={222} x={8}  y={192} />
              <Spot num={221} x={8}  y={236} />
              <Spot num={220} x={8}  y={280} />
              <Spot num={219} x={8}  y={324} />
              <Spot num={218} x={8}  y={368} />
              <Spot num={217} x={8}  y={412} />
              <Spot num={216} x={8}  y={456} />
              <Spot num={215} x={8}  y={500} />
              <Spot num={214} x={8}  y={544} />
              <Spot num={213} x={8}  y={588} />
              <Spot num={212} x={8}  y={632} />
              <Spot num={211} x={8}  y={676} />
              <Spot num={210} x={8}  y={720} />
              <Spot num={209} x={8}  y={764} />
              <Spot num={208} x={8}  y={808} />
              <Spot num={207} x={8}  y={852} />

              {/* Top BODEGA */}
              <Box label="BODEGA" x={68} y={16} w={474} h={56} />

              {/* Accessible row 174–181 */}
              <Spot num={174} x={68}  y={78} />
              <Spot num={175} x={118} y={78} />
              <Spot num={176} x={168} y={78} />
              <Spot num={177} x={218} y={78} />
              <Spot num={178} x={268} y={78} />
              <Spot num={179} x={318} y={78} />
              <Spot num={180} x={368} y={78} />
              <Spot num={181} x={418} y={78} />
              <Box label="BODEGA" x={470} y={16} w={72} h={100} />

              {/* Interior left block */}
              <Box label="BODEGA" x={68} y={124} w={62} h={68} />
              <Spot num={247} x={68}  y={198} />
              <Spot num={246} x={68}  y={242} />
              <Spot num={245} x={68}  y={286} />
              <Spot num={244} x={68}  y={330} />
              <Spot num={243} x={68}  y={374} />

              {/* ESCALERAS */}
              <Box label="ESCALERAS" x={120} y={124} w={108} h={430} />

              {/* Interior interactive spots */}
              <Spot num={228} x={234} y={286} />
              <Spot num={229} x={234} y={330} />
              <Spot num={230} x={234} y={198} />

              {/* Driving lane */}
              <Lane x={286} y={124} h={540} />

              {/* ASENSORES */}
              <Box label="ASENSORES" x={316} y={124} w={108} h={350} />

              {/* Right interior spots 231–236 */}
              <Spot num={231} x={430} y={124} />
              <Spot num={232} x={430} y={168} />
              <Spot num={233} x={430} y={212} />
              <Spot num={234} x={430} y={256} />
              <Spot num={235} x={430} y={300} />
              <Spot num={236} x={430} y={344} />

              {/* Bottom interior spots */}
              <Spot num={242} x={120} y={560} />
              <Spot num={241} x={166} y={560} />
              <Spot num={240} x={234} y={560} />
              <Spot num={239} x={316} y={478} />
              <Spot num={238} x={362} y={478} />
              <Spot num={237} x={408} y={478} />
              <Box label="BODEGA" x={430} y={388} w={112} h={80} />

              {/* Bottom section */}
              <Spot num={206} x={68}  y={896} />

              {/* Bottom row 204–195 */}
              <Spot num={204} x={120} y={720} />
              <Spot num={203} x={168} y={720} />
              <Spot num={202} x={216} y={720} />
              <Spot num={201} x={264} y={720} />
              <Spot num={200} x={312} y={720} />
              <Spot num={199} x={360} y={720} />
              <Spot num={198} x={408} y={720} />
              <Spot num={197} x={456} y={720} />
              <Spot num={205} x={120} y={764} />
              <Spot num={196} x={456} y={764} />
              <Spot num={195} x={502} y={764} />

              {/* Bottom BODEGA */}
              <Box label="BODEGA" x={120} y={808} w={424} h={50} />

              {/* RIGHT COLUMN 182–194 */}
              <Spot num={182} x={550} y={124} />
              <Spot num={183} x={550} y={168} />
              <Spot num={184} x={550} y={212} />
              <Spot num={185} x={550} y={256} />
              <Spot num={186} x={550} y={300} />
              <Spot num={187} x={550} y={344} />
              <Spot num={188} x={550} y={388} />
              <Spot num={189} x={550} y={432} />
              <Spot num={190} x={550} y={476} />
              <Spot num={191} x={550} y={520} />
              <Spot num={192} x={550} y={564} />
              <Spot num={193} x={550} y={608} />
              <Spot num={194} x={550} y={652} />
            </div>
          </div>
        </div>

        {/* Control panel */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden">
              {/* Header */}
              <div className={`px-5 py-4 flex items-start justify-between ${STATE_STYLE[getSpotState(selected)]}`}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70">
                    Nivel -2 · {selected.spot_status === "fixed" ? "Asignado" : selected.spot_status === "high_frequency" ? "Alta Freq." : selected.spot_status === "director_reserved" ? "Director" : selected.spot_status === "available" ? "Libre" : "Bloqueado"}
                    {selected.is_accessible ? " · ♿" : ""}
                  </p>
                  <h3 className="text-2xl font-black mt-0.5">Espacio {selected.spot_number}</h3>
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
                {/* Current state info */}
                {selected.reservation ? (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide">Reserva activa</p>
                    <p className="font-bold text-dhl-dark">{selected.reservation.profile_name}</p>
                    <p className="text-xs text-green-600 font-semibold">Reservado para hoy</p>
                  </div>
                ) : selected.spot_status === "fixed" || selected.spot_status === "high_frequency" ? (
                  <div className="bg-orange-50 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide">
                      {selected.spot_status === "fixed" ? "Titular asignado" : "Alta Frecuencia"}
                    </p>
                    <p className="font-bold text-dhl-dark">{selected.assigned_user_name ?? "—"}</p>
                    <p className="text-xs text-orange-600 font-semibold">Libre hoy — no reservó</p>
                  </div>
                ) : selected.spot_status === "director_reserved" ? (
                  <div className="bg-amber-50 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-bold text-dhl-gray uppercase tracking-wide">Espacio de Director</p>
                    <p className="font-bold text-dhl-dark">{selected.director_name ?? "—"}</p>
                    <p className="text-xs text-amber-600 font-semibold">Libre hoy</p>
                  </div>
                ) : !selected.is_active ? (
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-sm font-semibold text-gray-600">Fuera de servicio</p>
                    <p className="text-xs text-gray-500 mt-0.5">Este espacio no está disponible para reservas.</p>
                  </div>
                ) : (
                  <div className="bg-green-50 rounded-xl px-4 py-3">
                    <p className="text-sm font-semibold text-green-700">Espacio disponible</p>
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
                      <span className="text-xs font-normal text-red-500 ml-auto">Cancela la reserva</span>
                    </button>
                  )}

                  {/* Reserve for user */}
                  {selected.is_active && (
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
                        🚗 Asignar espacio
                      </button>
                    </div>
                  )}

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
                    {selected.is_active ? "🔧 Marcar Fuera de Servicio" : "✅ Restaurar espacio"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dhl-mid-gray p-8 text-center shadow-sm">
              <p className="text-3xl mb-3">🚗</p>
              <p className="font-bold text-dhl-dark">Selecciona un espacio</p>
              <p className="text-sm text-dhl-gray mt-1">Toca cualquier espacio del mapa para ver detalles y acciones.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
