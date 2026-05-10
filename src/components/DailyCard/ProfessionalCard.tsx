"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type CardState =
  | "pending_early"
  | "checkin_form"
  | "confirmed"
  | "released_voluntary"
  | "auto_released";

interface Reservation {
  id: string;
  desk_id: string;
  checked_in: boolean;
  carpooling: boolean;
  status: string;
}

interface Props {
  firstName: string;
  deskCode?: string;
  reservation: Reservation | null;
  onComplete: () => void;
}

function getMinutesUntilNine(now: Date): number {
  const cutoff = new Date(now);
  cutoff.setHours(9, 1, 0, 0);
  return Math.floor((cutoff.getTime() - now.getTime()) / 60000);
}

function isAfterCutoff(now: Date): boolean {
  return now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() >= 1);
}

export default function ProfessionalCard({ firstName, deskCode, reservation, onComplete }: Props) {
  const router = useRouter();
  const now = new Date();
  const afterCutoff = isAfterCutoff(now);

  function deriveInitialState(): CardState {
    if (afterCutoff) return "auto_released";
    return "pending_early";
  }

  const [state, setState] = useState<CardState>(deriveInitialState);
  const [minutesLeft, setMinutesLeft] = useState(() => getMinutesUntilNine(new Date()));
  const [cameByAuto, setCameByAuto] = useState<boolean | null>(null);
  const [didCarpooling, setDidCarpooling] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state !== "pending_early") return;
    const mins = getMinutesUntilNine(new Date());
    if (mins > 60) return;

    const id = setInterval(() => {
      const m = getMinutesUntilNine(new Date());
      setMinutesLeft(m);
      if (m <= 0) {
        setState("auto_released");
        clearInterval(id);
      }
    }, 30000);
    return () => clearInterval(id);
  }, [state]);

  async function handleYesComing() {
    setState("checkin_form");
  }

  async function handleNotComing() {
    setLoading(true);
    if (reservation?.id) {
      await fetch("/api/desks/reserve", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservation.id }),
      });
    }
    setLoading(false);
    setState("released_voluntary");
    setTimeout(() => onComplete(), 2500);
  }

  async function handleConfirmCheckin() {
    if (cameByAuto === null || didCarpooling === null) return;
    if (!reservation) return;
    setLoading(true);

    await fetch("/api/desks/reserve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        desk_id: reservation.desk_id,
        date: new Date().toISOString().split("T")[0],
        carpooling: didCarpooling,
      }),
    });

    if (didCarpooling) {
      await fetch("/api/riffs/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin_carpooling" }),
      });
    }

    setLoading(false);
    setState("confirmed");
    setTimeout(() => onComplete(), 2500);
  }

  if (state === "confirmed") {
    return (
      <div className="text-center space-y-3">
        <p className="text-xl font-bold text-dhl-dark">✦  Puesto confirmado.</p>
        <p className="text-base text-dhl-dark">{deskCode} es tuyo hoy.</p>
        <p className="text-base text-dhl-gray">Que sea un buen día en la oficina.</p>
        {didCarpooling && (
          <span className="riffs-pop inline-block bg-dhl-yellow/20 text-dhl-dark font-bold px-3 py-1 rounded-full text-sm">
            + 30 Riffs por carpooling
          </span>
        )}
      </div>
    );
  }

  if (state === "released_voluntary") {
    return (
      <div className="text-center space-y-3">
        <p className="text-base font-semibold text-dhl-dark">
          Entendido. Tu puesto queda libre para quien lo necesite hoy.
        </p>
        <p className="text-base text-dhl-gray">Nos vemos cuando vuelvas.</p>
      </div>
    );
  }

  if (state === "auto_released") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-dhl-dark">Tu puesto fue liberado a las 9:01 AM.</p>
        <p className="text-xs text-dhl-gray">¿Ya estás aquí? Mira qué hay libre.</p>
        <button
          onClick={() => router.push("/desks")}
          className="w-full py-3 rounded-xl font-semibold text-sm border border-dhl-dark text-dhl-dark"
        >
          Ver disponibilidad
        </button>
      </div>
    );
  }

  if (state === "checkin_form") {
    const canSubmit = cameByAuto !== null && didCarpooling !== null;
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xl font-bold text-dhl-dark">Hola, {firstName}. ¿Vienes hoy?</p>
          {deskCode && (
            <p className="text-xs text-dhl-gray mt-1">
              Tu puesto {deskCode} te espera hasta las 9:00 AM.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-dhl-dark font-medium mb-2">¿Viniste en auto?</p>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setCameByAuto(val)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    cameByAuto === val
                      ? "border-dhl-dark bg-dhl-dark text-white"
                      : "border-dhl-mid-gray text-dhl-gray"
                  }`}
                >
                  {val ? "Sí" : "No"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-dhl-dark font-medium mb-2">¿Hiciste carpooling?</p>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setDidCarpooling(val)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                    didCarpooling === val
                      ? "border-dhl-dark bg-dhl-dark text-white"
                      : "border-dhl-mid-gray text-dhl-gray"
                  }`}
                >
                  {val ? "Sí" : "No"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleConfirmCheckin}
          disabled={!canSubmit || loading}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-dhl-dark text-white disabled:opacity-40"
        >
          {loading ? "..." : "Listo, confirmar"}
        </button>
      </div>
    );
  }

  // pending_early
  const showCountdown = minutesLeft <= 60 && minutesLeft > 0;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xl font-bold text-dhl-dark">Hola, {firstName}. ¿Vienes hoy?</p>
        {deskCode && (
          <p className="text-xs text-dhl-gray mt-1">
            Tu puesto {deskCode} te espera hasta las 9:00 AM.
          </p>
        )}
        {showCountdown && (
          <p className="text-xs text-amber-600 font-semibold mt-1">
            ⏱ Quedan {minutesLeft} minutos
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={handleYesComing}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-dhl-dark text-white disabled:opacity-50"
        >
          Sí, ya llegué
        </button>
        <button
          onClick={handleNotComing}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-white text-dhl-gray border border-dhl-mid-gray disabled:opacity-50"
        >
          {loading ? "..." : "Hoy no vengo"}
        </button>
      </div>
    </div>
  );
}
