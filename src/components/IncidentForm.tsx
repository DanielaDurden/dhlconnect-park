"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { IncidentCategory, Profile } from "@/types";

interface Props {
  profile: Pick<Profile, "id" | "full_name">;
}

const CATEGORIES: { value: IncidentCategory; label: string; icon: React.ReactNode }[] = [
  {
    value: "cleaning",
    label: "Limpieza",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
        <path d="M3 22v-4l9-9 4 4-9 9H3Z"/><path d="m15 5 4 4"/><path d="m9.5 11.5 1.5 1.5"/>
      </svg>
    ),
  },
  {
    value: "supplies",
    label: "Insumos / Kitchenette",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
      </svg>
    ),
  },
  {
    value: "maintenance",
    label: "Mantenimiento",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    value: "other",
    label: "Otro",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
      </svg>
    ),
  },
];

const LOCATIONS = [
  "Planta abierta",
  "Kitchenette",
  "Sala de reuniones 1",
  "Sala de reuniones 2",
  "Baños",
  "Recepción",
  "Pasillo",
  "Otro",
];

export default function IncidentForm({ profile }: Props) {
  const [category, setCategory] = useState<IncidentCategory | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !description.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    const supabase = createClient();

    const { error } = await supabase.from("incidents").insert({
      user_id: profile.id,
      category,
      description: description.trim(),
      location: location || null,
      status: "open",
    });

    if (!error) {
      setSuccess(true);
      setCategory(null);
      setDescription("");
      setLocation("");
      setTimeout(() => {
        setSuccess(false);
        router.refresh();
      }, 2500);
    } else {
      setErrorMsg("No se pudo enviar el reporte. Intenta de nuevo o comunícate directamente con el Office Manager.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-300 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 className="font-bold text-green-700 text-lg">Reporte enviado</h3>
        <p className="text-green-600 text-sm mt-1">
          El Office Manager recibirá tu solicitud y coordinará con los proveedores.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
        <p className="text-sm font-semibold text-dhl-dark mb-3">¿Qué tipo de incidente?</p>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                category === cat.value
                  ? "border-dhl-red bg-red-50 text-dhl-red"
                  : "border-dhl-mid-gray bg-white text-dhl-dark hover:border-dhl-gray"
              }`}
            >
              {cat.icon}
              <span className="text-xs">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
        <label className="text-sm font-semibold text-dhl-dark block mb-2">
          Ubicación <span className="text-dhl-gray font-normal">(opcional)</span>
        </label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border border-dhl-mid-gray rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-dhl-red bg-white"
        >
          <option value="">Selecciona una ubicación...</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
        <label className="text-sm font-semibold text-dhl-dark block mb-2">
          Descripción del problema *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          maxLength={500}
          placeholder="Ej: El aire acondicionado de la planta abierta no está funcionando correctamente..."
          className="w-full border border-dhl-mid-gray rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-dhl-red resize-none"
        />
        <p className="text-right text-xs text-dhl-gray mt-1">
          {description.length}/500
        </p>
      </div>

      <button
        type="submit"
        disabled={!category || !description.trim() || loading}
        className="w-full bg-dhl-red text-white font-bold py-4 rounded-2xl hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? "Enviando..." : "Enviar reporte al Office Manager"}
      </button>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-dhl-red flex-shrink-0 mt-0.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
          </svg>
          <p className="text-sm text-dhl-red">{errorMsg}</p>
        </div>
      )}

      <p className="text-center text-xs text-dhl-gray">
        Centralizar reportes evita duplicidades y agiliza la coordinación con Aramark y Mantenimiento.
      </p>
    </form>
  );
}
