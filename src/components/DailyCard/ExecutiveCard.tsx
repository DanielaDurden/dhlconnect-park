"use client";

import { useState } from "react";

type CardState = "pending" | "released" | "using";

interface Props {
  firstName: string;
  onComplete: () => void;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default function ExecutiveCard({ firstName, onComplete }: Props) {
  const [state, setState] = useState<CardState>("pending");
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekStart = getWeekStart(now);
  const rawDay = now.getDay();
  const dayOfWeek = rawDay === 0 ? 7 : rawDay;

  async function handleUse() {
    setLoading(true);
    await fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_start: weekStart,
        day_of_week: dayOfWeek,
        planned_status: "office",
        solidarity_released: false,
        date: today,
      }),
    });
    setLoading(false);
    onComplete();
  }

  async function handleRelease() {
    setLoading(true);
    const res = await fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_start: weekStart,
        day_of_week: dayOfWeek,
        planned_status: "home_office",
        solidarity_released: true,
        date: today,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setState("released");
      setTimeout(() => onComplete(), 2500);
    }
  }

  if (state === "released") {
    return (
      <div className="text-center space-y-3">
        <p className="text-5xl mb-3">🎸</p>
        <p className="text-2xl font-black text-dhl-dark">Gracias, {firstName}.</p>
        <p className="text-sm text-dhl-gray mt-2">
          Tu oficina ahora aparece como CoWork Premium en el mapa. El equipo lo agradece.
        </p>
        <span className="riffs-pop inline-block mt-4 bg-dhl-yellow text-dhl-dark font-black px-4 py-2 rounded-full text-sm">
          + 50 Riffs 🤘
        </span>
        <div className="mt-3">
          <a href="/profile" className="text-xs text-dhl-gray/70 underline">
            Ver mi impacto →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-5xl mb-4">🏢</p>
        <p className="text-2xl font-black text-dhl-dark">Buenos días, {firstName}.</p>
        <p className="text-base text-dhl-gray mt-2 leading-snug">¿Usas tu oficina hoy?</p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={handleUse}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-base bg-dhl-dark text-white shadow-lg disabled:opacity-50"
        >
          {loading ? "..." : "Sí, la uso"}
        </button>
        <button
          onClick={handleRelease}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-base bg-dhl-yellow text-dhl-dark disabled:opacity-50"
        >
          {loading ? "..." : "Comparte tu escenario 🎸"}
        </button>
      </div>
    </div>
  );
}
