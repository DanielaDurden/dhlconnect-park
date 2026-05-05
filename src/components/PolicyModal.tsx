"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PolicyModal() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAccept() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ policy_accepted_at: new Date().toISOString() })
      .eq("id", user.id);

    router.refresh();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-dhl-red px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👋</span>
            <div>
              <h2 className="text-white font-bold text-xl">¡Bienvenido!</h2>
              <p className="text-white/80 text-sm">Centro de Energía DHL</p>
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
              <span className="text-2xl">🧹</span>
              <div>
                <p className="font-bold text-dhl-dark text-sm">Orden</p>
                <p className="text-dhl-gray text-xs mt-0.5">
                  Mantén tu puesto limpio y ordenado al terminar tu jornada.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-dhl-yellow">
              <span className="text-2xl">✨</span>
              <div>
                <p className="font-bold text-dhl-dark text-sm">Limpieza</p>
                <p className="text-dhl-gray text-xs mt-0.5">
                  Deja los espacios comunes (cocina, salas) como los encontraste.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-dhl-yellow">
              <span className="text-2xl">🤝</span>
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
            {loading ? "Guardando..." : "Acepto las reglas de oro ✓"}
          </button>
          <p className="text-dhl-gray text-xs text-center mt-3">
            Al aceptar, confirmas que leíste y cumplirás estas normas.
          </p>
        </div>
      </div>
    </div>
  );
}
