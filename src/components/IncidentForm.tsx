"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { IncidentCategory, Profile } from "@/types";

interface Props {
  profile: Pick<Profile, "id" | "full_name">;
}

const CATEGORIES: { value: IncidentCategory; label: string; emoji: string }[] = [
  { value: "cleaning", label: "Limpieza", emoji: "🧹" },
  { value: "supplies", label: "Insumos / Kitchenette", emoji: "📦" },
  { value: "maintenance", label: "Mantenimiento", emoji: "🔧" },
  { value: "other", label: "Otro", emoji: "📋" },
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
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !description.trim()) return;

    setLoading(true);
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
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-300 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-3">✅</div>
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
              <span className="text-xl">{cat.emoji}</span>
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

      <p className="text-center text-xs text-dhl-gray">
        Centralizar reportes evita duplicidades y agiliza la coordinación con Aramark y Mantenimiento.
      </p>
    </form>
  );
}
