"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getRiffsLevel } from "@/types";

export interface RiffsUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  total_riffs: number;
}

interface Props {
  users: RiffsUser[];
  allUsers: { id: string; full_name: string; role: string }[];
}

const ROLE_LABELS: Record<string, string> = {
  host: "Host",
  executive: "Host",
  guest: "Visita",
  professional: "Visita",
  admin: "Admin",
};

const LEVEL_COLORS: Record<string, string> = {
  "Opening Act": "bg-gray-100 text-gray-600",
  "Rising Star": "bg-blue-100 text-blue-700",
  "Headliner": "bg-purple-100 text-purple-700",
  "Rock Legend": "bg-dhl-yellow text-dhl-dark",
};

export default function RiffsAdmin({ users, allUsers }: Props) {
  const router = useRouter();
  const [targetUser, setTargetUser] = useState("");
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleAdjust() {
    if (!targetUser || !points || Number(points) === 0) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/riffs-adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_user_id: targetUser,
        points: Number(points),
        note: note || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      showToast(`Ajuste de ${Number(points) > 0 ? "+" : ""}${points} Riffs aplicado.`);
      setTargetUser("");
      setPoints("");
      setNote("");
      startTransition(() => router.refresh());
    } else {
      showToast("Error al ajustar. Intenta de nuevo.");
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-16 left-0 right-0 mx-6 z-50 pointer-events-none">
          <div className="bg-dhl-dark text-white text-sm rounded-xl px-4 py-3 shadow-xl max-w-2xl mx-auto text-center">
            {toast}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden">
          <div className="bg-dhl-dark px-5 py-4">
            <h2 className="text-dhl-yellow font-black">🎸 Ranking Rockstar Path</h2>
            <p className="text-white/50 text-xs mt-0.5">Acumulado total · Todos los colaboradores</p>
          </div>
          <div className="divide-y divide-dhl-mid-gray">
            {users.length === 0 ? (
              <div className="px-5 py-10 text-center text-dhl-gray text-sm">Sin datos de Riffs aún.</div>
            ) : (
              users.map((u, i) => {
                const { level } = getRiffsLevel(u.total_riffs);
                return (
                  <div key={u.id} className="px-5 py-3.5 flex items-center gap-4">
                    <span className={`text-sm font-black w-7 text-center flex-shrink-0 ${i === 0 ? "text-dhl-yellow text-xl" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-dhl-gray/40"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-dhl-dark truncate">{u.full_name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${LEVEL_COLORS[level] ?? "bg-gray-100 text-gray-600"}`}>
                          {level}
                        </span>
                      </div>
                      <p className="text-xs text-dhl-gray">{ROLE_LABELS[u.role] ?? u.role} · {u.email}</p>
                    </div>
                    <span className="text-base font-black text-dhl-dark flex-shrink-0">
                      {u.total_riffs.toLocaleString("es-CL")}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Manual adjustment form */}
        <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden">
          <div className="bg-dhl-yellow px-5 py-4">
            <h2 className="text-dhl-dark font-black text-sm">Ajuste Manual de Riffs</h2>
            <p className="text-dhl-dark/60 text-xs mt-0.5">Usa valores negativos para restar.</p>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-dhl-gray mb-1.5">Colaborador</label>
              <select
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                className="w-full border border-dhl-mid-gray rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-dhl-dark bg-white"
              >
                <option value="">— Seleccionar —</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({ROLE_LABELS[u.role] ?? u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-dhl-gray mb-1.5">Puntos</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="Ej: 50 o -30"
                className="w-full border border-dhl-mid-gray rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-dhl-dark"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dhl-gray mb-1.5">Motivo (opcional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej: Corrección técnica"
                className="w-full border border-dhl-mid-gray rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-dhl-dark"
              />
            </div>

            <button
              onClick={handleAdjust}
              disabled={!targetUser || !points || Number(points) === 0 || submitting || isPending}
              className="w-full bg-dhl-dark text-white font-bold py-3 rounded-xl hover:bg-dhl-dark/90 transition-colors disabled:opacity-40 text-sm"
            >
              {submitting ? "Aplicando..." : "Aplicar ajuste"}
            </button>

            <p className="text-[10px] text-dhl-gray/60 text-center leading-relaxed">
              El ajuste queda registrado en el historial como &quot;manual_adjustment&quot;. No es reversible automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
