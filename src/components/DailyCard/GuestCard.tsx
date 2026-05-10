"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GuestState = "available" | "full";

interface Props {
  firstName: string;
  availableDesksCount: number;
}

export default function GuestCard({ firstName, availableDesksCount }: Props) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const state: GuestState = availableDesksCount > 0 ? "available" : "full";

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  if (state === "available") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-5xl mb-3">🗺️</p>
          <p className="text-2xl font-black text-dhl-dark">¡Hay lugar hoy, {firstName}!</p>
          <p className="text-sm text-dhl-gray mt-2">
            {availableDesksCount} {availableDesksCount === 1 ? "espacio" : "espacios"} libre{availableDesksCount === 1 ? "" : "s"} ahora mismo.
          </p>
          <p className="text-xs text-dhl-gray/70 mt-1">Revisa los lugares liberados y elige tu base de hoy.</p>
        </div>
        <button
          onClick={() => router.push("/desks")}
          className="w-full py-4 rounded-2xl font-bold text-base bg-dhl-dark text-white shadow-lg mt-4"
        >
          Ver el mapa →
        </button>
      </div>
    );
  }

  // full
  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-16 left-0 right-0 mx-4 z-50 pointer-events-none">
          <div className="bg-dhl-dark text-white text-sm rounded-xl px-4 py-3 shadow-xl max-w-lg mx-auto text-center">
            {toast}
          </div>
        </div>
      )}
      <div className="text-center">
        <p className="text-5xl mb-3">🚀</p>
        <p className="text-2xl font-black text-dhl-dark">Oficina al límite</p>
        <p className="text-sm text-dhl-gray mt-3 leading-relaxed">
          Hoy la base en Ciudad Empresarial está llena. Aprovecha de conectar con la operación visitando un Site o trabaja desde otro lugar inspirador. ¡A darle con todo!
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={() =>
            showToast("Recibirás una notificación cuando haya disponibilidad")
          }
          className="w-full py-4 rounded-2xl font-bold text-base bg-dhl-dark text-white"
        >
          Activar aviso
        </button>
        <button
          onClick={() => router.push("/parking")}
          className="w-full py-4 rounded-2xl font-bold text-base bg-white border-2 border-dhl-mid-gray text-dhl-gray"
        >
          Ver alternativas
        </button>
      </div>
    </div>
  );
}
