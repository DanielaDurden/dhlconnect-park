"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type GuestState = "pre_cutoff" | "available" | "full";

interface Props {
  firstName: string;
  availableDesksCount: number;
}

function deriveState(availableDesksCount: number): GuestState {
  const now = new Date();
  const afterCutoff = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() >= 1);
  if (!afterCutoff) return "pre_cutoff";
  return availableDesksCount > 0 ? "available" : "full";
}

export default function GuestCard({ firstName, availableDesksCount }: Props) {
  const router = useRouter();
  const [state, setState] = useState<GuestState>(() => deriveState(availableDesksCount));
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (state !== "pre_cutoff") return;
    const id = setTimeout(() => {
      setState(availableDesksCount > 0 ? "available" : "full");
    }, 3000);
    return () => clearTimeout(id);
  }, [state, availableDesksCount]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  if (state === "pre_cutoff") {
    return (
      <div className="text-center space-y-3">
        <p className="text-xl font-bold text-dhl-dark">Buenos días, {firstName}.</p>
        <p className="text-base text-dhl-gray">Los espacios se actualizan a las 9:01 AM.</p>
        <p className="text-base text-dhl-gray">Vuelve en un momento.</p>
      </div>
    );
  }

  if (state === "available") {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xl font-bold text-dhl-dark">Hay lugar hoy.</p>
          <p className="text-sm text-dhl-gray mt-1">
            {availableDesksCount} espacios disponibles ahora mismo.
          </p>
        </div>
        <button
          onClick={() => router.push("/desks")}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-dhl-dark text-white"
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
      <div>
        <p className="text-base font-semibold text-dhl-dark">Oficina completa por ahora.</p>
        <p className="text-xs text-dhl-gray mt-1">
          Puede abrirse un espacio en cualquier momento. La app te avisa.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={() =>
            showToast("Recibirás una notificación cuando haya disponibilidad")
          }
          className="w-full py-3 rounded-xl font-semibold text-sm bg-dhl-dark text-white"
        >
          Activar aviso
        </button>
        <button
          onClick={() => router.push("/parking")}
          className="w-full py-3 rounded-xl font-semibold text-sm border border-dhl-mid-gray text-dhl-gray"
        >
          Ver alternativas
        </button>
      </div>
    </div>
  );
}
