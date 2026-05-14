"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ParkingSpotWithReservation, Profile } from "@/types";
import { PARKING_MANAGED_COUNT, PARKING_PLAN_B } from "@/lib/config";

interface Props {
  spots: ParkingSpotWithReservation[];
  myProfile: Pick<Profile, "id" | "full_name">;
  today: string;
  myReservationId: string | null;
  totalCapacity: number;
  occupiedCount: number;
}

type SpotState = "mine" | "available" | "occupied" | "disabled";

function getSpotState(spot: ParkingSpotWithReservation, myId: string): SpotState {
  if (!spot.is_active || spot.spot_status === "blocked") return "disabled";
  if (spot.reservation?.user_id === myId && spot.reservation?.status === "confirmed") return "mine";
  if (spot.reservation?.status === "confirmed") return "occupied";
  // Fixed/assigned/director spots are always occupied (unless reservation exists for me above)
  if (
    spot.spot_status === "fixed" ||
    spot.spot_status === "high_frequency" ||
    spot.spot_status === "director_reserved"
  ) return "occupied";
  return "available";
}

const STATE_COLORS: Record<SpotState, string> = {
  mine:     "bg-blue-500 border-blue-700 text-white",
  available:"bg-green-500 border-green-700 text-white",
  occupied: "bg-dhl-red border-red-700 text-white",
  disabled: "bg-gray-200 border-gray-300 text-gray-400",
};

export default function ParkingGrid({
  spots, myProfile, today, myReservationId, totalCapacity, occupiedCount,
}: Props) {
  const [selected, setSelected] = useState<ParkingSpotWithReservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState(false);
  const router = useRouter();

  const spotMap = Object.fromEntries(spots.map((s) => [s.spot_number, s]));
  const hasReservation = !!myReservationId;
  const availableCount = totalCapacity - occupiedCount;
  const isPlanB = availableCount === 0;

  function closeSheet() {
    setSelected(null);
    setPendingCancel(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleReserve(spot: ParkingSpotWithReservation) {
    setLoading(true);
    const res = await fetch("/api/parking/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spot_id: spot.id, date: today }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error?.includes("23505") ? "Este espacio ya fue reservado. Intenta con otro." : "Error al reservar. Intenta de nuevo.");
    } else {
      showToast(`Reservaste el Espacio ${spot.spot_number}`);
      setSelected(null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleCancel() {
    if (!myReservationId) return;
    setLoading(true);
    await fetch("/api/parking/reserve", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: myReservationId }),
    });
    showToast("Reserva cancelada");
    setSelected(null);
    router.refresh();
    setLoading(false);
  }

  // ── Floor plan components ──────────────────────────────────────

  function ParkingSpot({ num, x, y, w = 46, h = 38 }: { num: number; x: number; y: number; w?: number; h?: number }) {
    const spot = spotMap[num];
    if (!spot) {
      return (
        <div
          className="absolute rounded border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center"
          style={{ left: x, top: y, width: w, height: h }}
          title={`${num} — sin datos`}
        >
          <span className="text-[9px] font-bold text-gray-400">{num}</span>
        </div>
      );
    }

    const state = getSpotState(spot, myProfile.id);
    const color = STATE_COLORS[state];
    const isSelected = selected?.id === spot.id;

    if (state === "disabled") {
      return (
        <div
          className={`absolute rounded border-2 flex items-center justify-center ${color}`}
          style={{ left: x, top: y, width: w, height: h }}
          aria-hidden="true"
        >
          <span className="text-[9px] font-bold leading-none opacity-60">{num}</span>
        </div>
      );
    }

    return (
      <button
        onClick={() => setSelected(spot)}
        className={`absolute rounded border-2 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 active:scale-95 shadow-sm ${color} ${isSelected ? "ring-2 ring-dhl-dark ring-offset-1" : ""}`}
        style={{ left: x, top: y, width: w, height: h }}
        aria-label={`Espacio ${num}`}
        title={`${num}`}
      >
        <span className="text-[10px] font-bold leading-none">{num}</span>
      </button>
    );
  }

  function ParkingBox({ label, x, y, w, h, muted = false }: {
    label: string; x: number; y: number; w: number; h: number; muted?: boolean;
  }) {
    return (
      <div
        className={`absolute rounded border-2 flex items-center justify-center ${
          muted ? "bg-gray-100 border-gray-200 text-gray-400" : "bg-white border-dhl-mid-gray text-dhl-gray"
        }`}
        style={{ left: x, top: y, width: w, height: h }}
        aria-hidden="true"
      >
        <span className="text-[8px] font-semibold text-center leading-tight px-1 uppercase tracking-wide">{label}</span>
      </div>
    );
  }

  function DrivingLane({ x, y, h }: { x: number; y: number; h: number }) {
    return (
      <div
        className="absolute pointer-events-none"
        style={{ left: x, top: y, width: 24, height: h }}
        aria-hidden="true"
      >
        {Array.from({ length: Math.floor(h / 20) }).map((_, i) => (
          <div key={i} className="h-3 w-full bg-dhl-yellow/60 mb-1 rounded-sm" />
        ))}
      </div>
    );
  }

  // ── Bottom Sheet ───────────────────────────────────────────────

  function BottomSheet() {
    if (!selected) return null;
    const state = getSpotState(selected, myProfile.id);

    return (
      <div
        className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center"
        onClick={closeSheet}
      >
        <div
          className="bg-white rounded-t-2xl w-full max-w-lg p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-dhl-dark text-lg">Espacio {selected.spot_number}</h3>
              <p className="text-dhl-gray text-sm capitalize">
                {selected.level === "street" ? "Nivel Calle" : "Nivel -2"}
              </p>
            </div>
            <button onClick={closeSheet} aria-label="Cerrar"
              className="w-8 h-8 rounded-full bg-dhl-light-gray flex items-center justify-center text-dhl-gray hover:text-dhl-dark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {state === "occupied" && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm font-semibold text-red-700">Espacio ocupado</p>
              {selected.assigned_user_name && (
                <p className="text-xs text-red-600 mt-0.5">{selected.assigned_user_name}</p>
              )}
              <p className="text-xs text-dhl-gray mt-1">Este espacio no está disponible hoy.</p>
            </div>
          )}

          {state === "mine" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-blue-800">Tu espacio reservado</p>
                <p className="text-xs text-blue-600">Ya tienes este espacio asegurado para hoy.</p>
              </div>
            </div>
          )}

          {state === "available" && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm font-semibold text-green-700">Espacio disponible</p>
            </div>
          )}

          <div className="space-y-3">
            {state === "mine" && !pendingCancel && (
              <button onClick={() => setPendingCancel(true)} disabled={loading}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60">
                Cancelar reserva
              </button>
            )}
            {state === "mine" && pendingCancel && (
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

            {state === "available" && !hasReservation && (
              <button onClick={() => handleReserve(selected)} disabled={loading}
                className="w-full bg-dhl-red text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60">
                {loading ? "Reservando..." : "Reservar este espacio"}
              </button>
            )}

            {state === "available" && hasReservation && (
              <p className="text-center text-sm text-dhl-gray">
                Ya tienes un espacio reservado hoy.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="relative">
      {toast && (
        <div className="fixed top-16 left-0 right-0 mx-4 z-50 pointer-events-none">
          <div className="bg-dhl-dark text-white text-sm rounded-xl px-4 py-3 shadow-xl max-w-lg mx-auto text-center">
            {toast}
          </div>
        </div>
      )}

      {/* Capacity bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-dhl-dark">Ocupación hoy</span>
          <span className={`text-sm font-bold ${isPlanB ? "text-red-600" : "text-green-600"}`}>
            {occupiedCount}/{totalCapacity}
          </span>
        </div>
        <div className="h-2 bg-dhl-mid-gray rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isPlanB ? "bg-red-500" : occupiedCount > totalCapacity * 0.8 ? "bg-amber-400" : "bg-green-500"}`}
            style={{ width: `${Math.min((occupiedCount / totalCapacity) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-dhl-gray">{availableCount} libres</span>
        </div>
      </div>

      {/* Plan B */}
      {isPlanB && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 mb-3">
          <div className="flex items-start gap-3 mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
            <div>
              <p className="text-sm font-bold text-red-700">Estacionamiento completo</p>
              <p className="text-xs text-red-600 mt-0.5">Los {PARKING_MANAGED_COUNT} espacios gestionados están ocupados hoy.</p>
            </div>
          </div>
          <div className="space-y-2">
            {PARKING_PLAN_B.map((option) => (
              <div key={option.name} className="bg-white border border-red-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                {option.icon === "car" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden="true">
                    <path d="M19 17H5v-6l2.5-6H16.5L19 11v6Z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                )}
                <div>
                  <p className="text-xs font-semibold text-dhl-dark">{option.name}</p>
                  <p className="text-xs text-dhl-gray">{option.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floor Plan */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray overflow-hidden">
        <div className="bg-dhl-yellow px-4 py-3 flex items-center justify-between">
          <h2 className="text-dhl-dark font-bold text-sm">Estacionamiento CE</h2>
          <span className="text-dhl-dark/60 text-xs">Toca un espacio</span>
        </div>

        {/* Nivel Calle */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-black text-dhl-gray/60 uppercase tracking-widest mb-2">Nivel Calle</p>
          <div className="flex gap-3">
            {[18, 19].map((num) => {
              const spot = spotMap[num];
              if (!spot) return null;
              const state = getSpotState(spot, myProfile.id);
              const color = STATE_COLORS[state];
              const isSelected = selected?.id === spot.id;
              if (state === "disabled") {
                return (
                  <div key={num}
                    className={`w-14 h-10 rounded border-2 flex items-center justify-center ${color}`}
                    aria-hidden="true">
                    <span className="text-[10px] font-bold opacity-60">{num}</span>
                  </div>
                );
              }
              return (
                <button key={num}
                  onClick={() => setSelected(spot)}
                  className={`w-14 h-10 rounded border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm ${color} ${isSelected ? "ring-2 ring-dhl-dark ring-offset-1" : ""}`}
                  aria-label={`Espacio ${num}`}>
                  <span className="text-[11px] font-bold">{num}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 my-3 border-t-2 border-dashed border-dhl-mid-gray flex items-center gap-2">
          <span className="text-[10px] font-black text-dhl-gray/60 uppercase tracking-widest bg-white pr-2">Nivel -2</span>
        </div>

        {/* Nivel -2 floor plan */}
        <div className="overflow-auto px-3 pb-3">
          <div className="relative rounded-xl bg-gray-50/80" style={{ width: 600, height: 950 }}>

            <span className="absolute text-[8px] font-bold text-dhl-gray/60 uppercase tracking-widest" style={{ left: 8, top: 0 }}>Columna principal</span>
            <span className="absolute text-[8px] font-bold text-dhl-gray/60 uppercase tracking-widest" style={{ left: 120, top: 0 }}>Interior Nivel -2</span>

            {/* LEFT COLUMN — 226 → 207 */}
            <ParkingSpot num={226} x={8}  y={16} />
            <ParkingSpot num={225} x={8}  y={60} />
            <ParkingSpot num={224} x={8}  y={104} />
            <ParkingSpot num={223} x={8}  y={148} />
            <ParkingSpot num={222} x={8}  y={192} />
            <ParkingSpot num={221} x={8}  y={236} />
            <ParkingSpot num={220} x={8}  y={280} />
            <ParkingSpot num={219} x={8}  y={324} />
            <ParkingSpot num={218} x={8}  y={368} />
            <ParkingSpot num={217} x={8}  y={412} />
            <ParkingSpot num={216} x={8}  y={456} />
            <ParkingSpot num={215} x={8}  y={500} />
            <ParkingSpot num={214} x={8}  y={544} />
            <ParkingSpot num={213} x={8}  y={588} />
            <ParkingSpot num={212} x={8}  y={632} />
            <ParkingSpot num={211} x={8}  y={676} />
            <ParkingSpot num={210} x={8}  y={720} />
            <ParkingSpot num={209} x={8}  y={764} />
            <ParkingSpot num={208} x={8}  y={808} />
            <ParkingSpot num={207} x={8}  y={852} />

            {/* INTERIOR — top BODEGA */}
            <ParkingBox label="BODEGA" x={68} y={16} w={474} h={56} />

            {/* Accessible row 174–181 */}
            <ParkingSpot num={174} x={68}  y={78} />
            <ParkingSpot num={175} x={118} y={78} />
            <ParkingSpot num={176} x={168} y={78} />
            <ParkingSpot num={177} x={218} y={78} />
            <ParkingSpot num={178} x={268} y={78} />
            <ParkingSpot num={179} x={318} y={78} />
            <ParkingSpot num={180} x={368} y={78} />
            <ParkingSpot num={181} x={418} y={78} />
            <ParkingBox label="BODEGA" x={470} y={16} w={72} h={100} />

            {/* Interior left block */}
            <ParkingBox label="BODEGA" x={68} y={124} w={62} h={68} />
            <ParkingSpot num={247} x={68}  y={198} />
            <ParkingSpot num={246} x={68}  y={242} />
            <ParkingSpot num={245} x={68}  y={286} />
            <ParkingSpot num={244} x={68}  y={330} />
            <ParkingSpot num={243} x={68}  y={374} />

            {/* ESCALERAS */}
            <ParkingBox label="ESCALERAS" x={120} y={124} w={108} h={430} />

            {/* Interactive spots */}
            <ParkingSpot num={228} x={234} y={286} />
            <ParkingSpot num={229} x={234} y={330} />
            <ParkingSpot num={230} x={234} y={198} />

            {/* Driving lane */}
            <DrivingLane x={286} y={124} h={540} />

            {/* ASCENSORES */}
            <ParkingBox label="ASCENSORES" x={316} y={124} w={108} h={350} />

            {/* Right interior */}
            <ParkingSpot num={231} x={430} y={124} />
            <ParkingSpot num={232} x={430} y={168} />
            <ParkingSpot num={233} x={430} y={212} />
            <ParkingSpot num={234} x={430} y={256} />
            <ParkingSpot num={235} x={430} y={300} />
            <ParkingSpot num={236} x={430} y={344} />

            {/* Bottom interior */}
            <ParkingSpot num={242} x={120} y={560} />
            <ParkingSpot num={241} x={166} y={560} />
            <ParkingSpot num={240} x={234} y={560} />
            <ParkingSpot num={239} x={316} y={478} />
            <ParkingSpot num={238} x={362} y={478} />
            <ParkingSpot num={237} x={408} y={478} />
            <ParkingBox label="BODEGA" x={430} y={388} w={112} h={80} />

            {/* Bottom section */}
            <ParkingSpot num={206} x={68}  y={896} />

            {/* Bottom row */}
            <ParkingSpot num={204} x={120} y={720} />
            <ParkingSpot num={203} x={168} y={720} />
            <ParkingSpot num={202} x={216} y={720} />
            <ParkingSpot num={201} x={264} y={720} />
            <ParkingSpot num={200} x={312} y={720} />
            <ParkingSpot num={199} x={360} y={720} />
            <ParkingSpot num={198} x={408} y={720} />
            <ParkingSpot num={197} x={456} y={720} />
            <ParkingSpot num={205} x={120} y={764} />
            <ParkingSpot num={196} x={456} y={764} />
            <ParkingSpot num={195} x={502} y={764} />

            {/* Bottom BODEGA */}
            <ParkingBox label="BODEGA" x={120} y={808} w={424} h={50} />

            {/* RIGHT COLUMN 182–194 */}
            <ParkingSpot num={182} x={550} y={124} />
            <ParkingSpot num={183} x={550} y={168} />
            <ParkingSpot num={184} x={550} y={212} />
            <ParkingSpot num={185} x={550} y={256} />
            <ParkingSpot num={186} x={550} y={300} />
            <ParkingSpot num={187} x={550} y={344} />
            <ParkingSpot num={188} x={550} y={388} />
            <ParkingSpot num={189} x={550} y={432} />
            <ParkingSpot num={190} x={550} y={476} />
            <ParkingSpot num={191} x={550} y={520} />
            <ParkingSpot num={192} x={550} y={564} />
            <ParkingSpot num={193} x={550} y={608} />
            <ParkingSpot num={194} x={550} y={652} />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { color: "bg-green-500 border-green-700",  label: "Disponible" },
          { color: "bg-dhl-red border-red-700",       label: "Ocupado / Asignado" },
          { color: "bg-blue-500 border-blue-700",     label: "Mi reserva" },
          { color: "bg-gray-200 border-gray-300",     label: "Fuera de servicio" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded border-2 flex-shrink-0 ${item.color}`} />
            <span className="text-xs text-dhl-gray">{item.label}</span>
          </div>
        ))}
      </div>

      <BottomSheet />
    </div>
  );
}
