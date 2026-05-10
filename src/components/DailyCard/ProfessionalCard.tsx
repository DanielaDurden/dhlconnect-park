"use client";

import { useState, useEffect, useRef } from "react";
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

  // Start with safe SSR default — useEffect corrects after hydration
  const [state, setState] = useState<CardState>("pending_early");
  const [minutesLeft, setMinutesLeft] = useState(60);
  const [cameByAuto, setCameByAuto] = useState<boolean | null>(null);
  const [didCarpooling, setDidCarpooling] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const autoReleaseRef = useRef(false);

  function releaseReservation() {
    if (!reservation?.id || autoReleaseRef.current) return;
    autoReleaseRef.current = true;
    fetch("/api/desks/reserve", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: reservation.id }),
    });
  }

  // Derive time-based state client-side only (avoids SSR hydration mismatch)
  useEffect(() => {
    const now = new Date();
    if (isAfterCutoff(now)) {
      releaseReservation();
      setState("auto_released");
      return;
    }
    const mins = getMinutesUntilNine(now);
    setMinutesLeft(mins);
    if (mins > 60) return;

    const id = setInterval(() => {
      const m = getMinutesUntilNine(new Date());
      setMinutesLeft(m);
      if (m <= 0) {
        releaseReservation();
        setState("auto_released");
        clearInterval(id);
      }
    }, 30000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <p className="text-5xl mb-3">✅</p>
        <p className="text-2xl font-black text-dhl-dark">¡Puesto confirmado!</p>
        <p className="text-base text-dhl-gray mt-2">{deskCode} es tuyo hoy.</p>
        <p className="text-sm text-dhl-gray">Que sea un buen día. 🙌</p>
        {didCarpooling && (
          <span className="riffs-pop inline-block mt-4 bg-dhl-yellow text-dhl-dark font-black px-4 py-2 rounded-full text-sm">
            + 30 Riffs · Rockstar Path 🚗
          </span>
        )}
      </div>
    );
  }

  if (state === "released_voluntary") {
    return (
      <div className="text-center space-y-3">
        <p className="text-5xl mb-3">🙏</p>
        <p className="text-xl font-black text-dhl-dark">Entendido, {firstName}.</p>
        <p className="text-sm text-dhl-gray mt-2">Tu puesto queda libre para quien lo necesite hoy.</p>
        <p className="text-sm text-dhl-gray">Nos vemos cuando vuelvas. 👋</p>
      </div>
    );
  }

  if (state === "auto_released") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-5xl mb-3">⏰</p>
        <p className="text-base font-bold text-dhl-dark">Tu puesto fue liberado a las 9:01 AM.</p>
        <p className="text-sm text-dhl-gray mt-2">¿Ya estás aquí? Mira qué hay libre.</p>
        <button
          onClick={() => router.push("/desks")}
          className="w-full py-4 rounded-2xl font-bold text-base border-2 border-dhl-dark text-dhl-dark"
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
          <p className="text-xl font-black text-dhl-dark mb-4">¡Bienvenido! 👋</p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-bold text-dhl-dark mb-2">¿Viniste en auto?</p>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setCameByAuto(val)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    cameByAuto === val
                      ? "border-dhl-dark bg-dhl-dark text-white"
                      : "border-dhl-mid-gray text-dhl-gray bg-white"
                  }`}
                >
                  {val ? "Sí" : "No"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-dhl-dark mb-2">¿Vienes acompañado? 🚗</p>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setDidCarpooling(val)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    didCarpooling === val
                      ? "border-dhl-dark bg-dhl-dark text-white"
                      : "border-dhl-mid-gray text-dhl-gray bg-white"
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
          className="w-full py-4 rounded-2xl font-bold text-base bg-dhl-yellow text-dhl-dark disabled:opacity-40"
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
      <div className="text-center">
        <p className="text-5xl mb-4">⚡</p>
        <p className="text-2xl font-black text-dhl-dark">Hola, {firstName}.</p>
        {deskCode && (
          <p className="text-sm text-dhl-gray mt-2">
            Tu puesto {deskCode} te espera hasta las 9:00 AM.
          </p>
        )}
        {showCountdown && (
          <span className="inline-block mt-2 text-sm font-bold text-amber-500 bg-amber-50 px-3 py-1.5 rounded-full">
            ⏱ Quedan {minutesLeft} minutos
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={handleYesComing}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-base bg-dhl-dark text-white shadow-lg disabled:opacity-50"
        >
          Sí, ya llegué
        </button>
        <button
          onClick={handleNotComing}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-base bg-white text-dhl-gray border-2 border-dhl-mid-gray disabled:opacity-50"
        >
          {loading ? "..." : "Hoy no vengo"}
        </button>
      </div>
    </div>
  );
}
