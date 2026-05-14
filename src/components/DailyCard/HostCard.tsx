"use client";

import { useState } from "react";
import { getWeekStart } from "@/lib/dateUtils";

type CardState = "pending" | "confirm_carpool" | "released" | "done";

interface Props {
  firstName: string;
  onComplete: () => void;
}

export default function HostCard({ firstName, onComplete }: Props) {
  const [state, setState] = useState<CardState>("pending");
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const weekStart = getWeekStart(now);
  const rawDay = now.getDay();
  const dayOfWeek = rawDay === 0 ? 7 : rawDay;

  async function postPlan(solidarityReleased: boolean) {
    return fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_start: weekStart,
        day_of_week: dayOfWeek,
        planned_status: solidarityReleased ? "home_office" : "office",
        solidarity_released: solidarityReleased,
      }),
    });
  }

  async function awardRiffs(action: string) {
    await fetch("/api/riffs/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  async function handleRelease() {
    setLoading(true);
    await postPlan(true);
    await awardRiffs("voluntary_release");
    setLoading(false);
    setState("released");
    setTimeout(() => onComplete(), 2500);
  }

  async function handleKeep() {
    setLoading(true);
    await postPlan(false);
    setLoading(false);
    setState("confirm_carpool");
  }

  async function handleCarpool(yes: boolean) {
    setLoading(true);
    if (yes) await awardRiffs("carpool");
    setLoading(false);
    setState("done");
    setTimeout(() => onComplete(), 1500);
  }

  if (state === "released") {
    return (
      <div className="text-center space-y-3">
        <p className="text-5xl mb-3">🎸</p>
        <p className="text-2xl font-black text-dhl-dark">Gracias, {firstName}.</p>
        <p className="text-sm text-dhl-gray mt-2 leading-relaxed">
          Tu espacio está disponible para el equipo hoy.
        </p>
        <span className="inline-block mt-4 bg-dhl-yellow text-dhl-dark font-black px-4 py-2 rounded-full text-sm">
          +50 Riffs 🤘
        </span>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="text-center space-y-3">
        <p className="text-5xl mb-3">✅</p>
        <p className="text-2xl font-black text-dhl-dark">¡Listo, {firstName}!</p>
        <p className="text-sm text-dhl-gray mt-2">Tu espacio está reservado para hoy.</p>
      </div>
    );
  }

  if (state === "confirm_carpool") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-5xl mb-4">🚗</p>
          <p className="text-2xl font-black text-dhl-dark">¿Vienes en carpool?</p>
          <p className="text-sm text-dhl-gray mt-2 leading-snug">
            Compartir el viaje suma <span className="font-bold text-dhl-dark">+30 Riffs</span>
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleCarpool(true)}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base bg-dhl-yellow text-dhl-dark shadow-lg disabled:opacity-50"
          >
            {loading ? "..." : "Sí, en carpool +30 Riffs"}
          </button>
          <button
            onClick={() => handleCarpool(false)}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base bg-dhl-light-gray text-dhl-dark disabled:opacity-50"
          >
            {loading ? "..." : "No, vengo solo"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-5xl mb-4">🏢</p>
        <p className="text-2xl font-black text-dhl-dark">Hola, {firstName}.</p>
        <p className="text-base text-dhl-gray mt-2 leading-snug">¿Liberas tu espacio hoy?</p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={handleRelease}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-base bg-dhl-yellow text-dhl-dark disabled:opacity-50"
        >
          {loading ? "..." : "Sí, lo libero 🎸 (+50 Riffs)"}
        </button>
        <button
          onClick={handleKeep}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-base bg-dhl-dark text-white shadow-lg disabled:opacity-50"
        >
          {loading ? "..." : "No, lo uso hoy"}
        </button>
      </div>
    </div>
  );
}
