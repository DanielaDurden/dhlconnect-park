"use client";

import { useState } from "react";

export default function PolicyModal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleAccept() {
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/accept-policy", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      window.location.href = "/home";
    } catch {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-dhl-yellow px-6 py-5">
          <div className="flex items-center gap-3">
            {/* Hand/Wave SVG */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7 text-dhl-dark flex-shrink-0"
              aria-hidden="true"
            >
              <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
              <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/>
              <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/>
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
            </svg>
            <div>
              <h2 className="text-dhl-dark font-bold text-xl">¡Bienvenido!</h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-dhl-dark text-sm font-semibold mb-4">
            Antes de continuar, acepta nuestras 3 reglas de oro:
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-dhl-yellow">
              {/* Sparkles/Orden SVG */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-dhl-red flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
              </svg>
              <div>
                <p className="font-bold text-dhl-dark text-sm">Orden</p>
                <p className="text-dhl-gray text-xs mt-0.5">
                  Mantén tu puesto limpio y ordenado al terminar tu jornada.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-dhl-yellow">
              {/* Flame/Limpieza SVG */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-dhl-red flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
              </svg>
              <div>
                <p className="font-bold text-dhl-dark text-sm">Limpieza</p>
                <p className="text-dhl-gray text-xs mt-0.5">
                  Deja los espacios comunes (cocina, salas) como los encontraste.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-dhl-yellow">
              {/* Users/Respeto SVG */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-dhl-red flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <div>
                <p className="font-bold text-dhl-dark text-sm">Respeto de espacios</p>
                <p className="text-dhl-gray text-xs mt-0.5">
                  Respeta los puestos asignados. Si necesitas uno, solicítalo a través de la app.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full bg-dhl-red text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Acepto las reglas de oro"}
          </button>
          {error && (
            <p className="text-dhl-red text-xs text-center mt-2">
              Error al guardar. Intenta de nuevo.
            </p>
          )}
          <p className="text-dhl-gray text-xs text-center mt-3">
            Al aceptar, confirmas que leíste y cumplirás estas normas.
          </p>
        </div>
      </div>
    </div>
  );
}
