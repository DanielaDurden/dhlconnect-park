"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export interface IncidentRow {
  id: string;
  category: string;
  description: string;
  location: string | null;
  status: string;
  created_at: string;
  profiles: { full_name: string; role: string } | null;
}

interface Props {
  incidents: IncidentRow[];
}

const CATEGORY_LABELS: Record<string, string> = {
  cleaning: "Limpieza",
  supplies: "Insumos",
  maintenance: "Mantenimiento",
  other: "Otro",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  in_progress: "En curso",
  resolved: "Resuelto",
};

const ROLE_LABELS: Record<string, string> = {
  host: "Host",
  executive: "Host",
  guest: "Visita",
  professional: "Visita",
};

export default function IncidentInbox({ incidents }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function updateStatus(id: string, status: string, comment?: string) {
    setLoadingId(id);
    const res = await fetch(`/api/admin/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, resolution_comment: comment }),
    });
    setLoadingId(null);
    if (res.ok) {
      showToast(`Estado actualizado a "${STATUS_LABELS[status]}".`);
      setResolvingId(null);
      setResolutionComment("");
      startTransition(() => router.refresh());
    } else {
      showToast("Error al actualizar. Intenta de nuevo.");
    }
  }

  function startResolve(id: string) {
    setResolvingId(id);
    setResolutionComment("");
  }

  function cancelResolve() {
    setResolvingId(null);
    setResolutionComment("");
  }

  const filtered = filter === "all" ? incidents : incidents.filter((i) => i.status === filter);

  const counts = {
    all: incidents.length,
    open: incidents.filter((i) => i.status === "open").length,
    in_progress: incidents.filter((i) => i.status === "in_progress").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-16 left-0 right-0 mx-6 z-50 pointer-events-none">
          <div className="bg-dhl-dark text-white text-sm rounded-xl px-4 py-3 shadow-xl max-w-2xl mx-auto text-center">
            {toast}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "open", "in_progress", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-4 py-2 rounded-xl font-semibold border transition-colors ${
              filter === f
                ? "bg-dhl-dark text-white border-dhl-dark"
                : "bg-white text-dhl-gray border-dhl-mid-gray hover:border-dhl-dark"
            }`}
          >
            {f === "all" ? "Todos" : STATUS_LABELS[f]}{" "}
            <span className="opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dhl-mid-gray p-10 text-center shadow-sm">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-sm text-dhl-gray">Sin incidentes en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inc) => (
            <div key={inc.id} className="bg-white rounded-2xl border border-dhl-mid-gray p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dhl-dark text-sm">
                    {inc.location
                      ? `Puesto ${inc.location} reportado como "${CATEGORY_LABELS[inc.category] ?? inc.category}". Acción requerida.`
                      : `Reporte de ${CATEGORY_LABELS[inc.category] ?? inc.category}. Acción requerida.`}
                  </p>
                  <p className="text-sm text-dhl-gray mt-1 leading-relaxed">{inc.description}</p>
                  <p className="text-xs text-dhl-gray/70 mt-2">
                    {inc.profiles?.full_name}{" "}
                    {inc.profiles?.role && `· ${ROLE_LABELS[inc.profiles.role] ?? inc.profiles.role}`}
                    {" · "}
                    {new Date(inc.created_at).toLocaleDateString("es-CL", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[inc.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABELS[inc.status] ?? inc.status}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {inc.status !== "open" && (
                  <button
                    onClick={() => updateStatus(inc.id, "open")}
                    disabled={isPending || loadingId === inc.id}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Reabrir
                  </button>
                )}
                {inc.status !== "in_progress" && inc.status !== "resolved" && (
                  <button
                    onClick={() => updateStatus(inc.id, "in_progress")}
                    disabled={isPending || loadingId === inc.id}
                    className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {loadingId === inc.id ? "..." : "Marcar en curso"}
                  </button>
                )}
                {inc.status !== "resolved" && resolvingId !== inc.id && (
                  <button
                    onClick={() => startResolve(inc.id)}
                    disabled={isPending || loadingId === inc.id}
                    className="text-xs px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    Marcar resuelto
                  </button>
                )}
              </div>

              {/* Resolution comment form */}
              {resolvingId === inc.id && (
                <div className="mt-3 space-y-2">
                  <label className="text-xs font-bold text-dhl-gray">Comentario de resolución (obligatorio)</label>
                  <textarea
                    value={resolutionComment}
                    onChange={(e) => setResolutionComment(e.target.value)}
                    placeholder="Describe cómo se resolvió el incidente..."
                    rows={2}
                    className="w-full border border-dhl-mid-gray rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-dhl-dark resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(inc.id, "resolved", resolutionComment)}
                      disabled={!resolutionComment.trim() || loadingId === inc.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-40"
                    >
                      {loadingId === inc.id ? "..." : "Confirmar resolución"}
                    </button>
                    <button
                      onClick={cancelResolve}
                      className="text-xs px-3 py-1.5 rounded-lg border border-dhl-mid-gray text-dhl-gray hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
