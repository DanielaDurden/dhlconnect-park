"use client";

import { useState } from "react";

const REPORT_TYPES = [
  { value: "ocupacion", label: "Ocupación de puestos", desc: "Reservas, check-ins y carpooling por fecha" },
  { value: "incidentes", label: "Incidentes", desc: "Todos los reportes con estado y categoría" },
  { value: "riffs", label: "Riffs & Carpooling", desc: "Historial de puntos por colaborador" },
  { value: "demanda", label: "Demanda Insatisfecha", desc: "Eventos de capacidad agotada" },
];

export default function ReportDownload() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = `${today.slice(0, 7)}-01`;

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [type, setType] = useState("ocupacion");
  const [loading, setLoading] = useState(false);

  async function download() {
    if (!from || !to) return;
    setLoading(true);
    try {
      const url = `/api/admin/report?from=${from}&to=${to}&type=${type}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al generar el reporte");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `dhl_${type}_${from}_${to}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } finally {
      setLoading(false);
    }
  }

  const selectedReport = REPORT_TYPES.find((r) => r.value === type);

  return (
    <div className="space-y-6">
      {/* Report type selector */}
      <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden">
        <div className="bg-dhl-yellow px-5 py-4">
          <h2 className="text-dhl-dark font-black">Tipo de reporte</h2>
        </div>
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {REPORT_TYPES.map((r) => (
            <button
              key={r.value}
              onClick={() => setType(r.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                type === r.value
                  ? "border-dhl-dark bg-dhl-dark/5"
                  : "border-dhl-mid-gray hover:border-dhl-dark/30"
              }`}
            >
              <p className={`text-sm font-bold ${type === r.value ? "text-dhl-dark" : "text-dhl-gray"}`}>
                {r.label}
              </p>
              <p className="text-xs text-dhl-gray/70 mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm p-5">
        <h2 className="font-bold text-dhl-dark mb-4">Rango de fechas</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-dhl-gray mb-1.5">Desde</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to}
              className="w-full border border-dhl-mid-gray rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-dhl-dark"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-dhl-gray mb-1.5">Hasta</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from}
              max={today}
              className="w-full border border-dhl-mid-gray rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-dhl-dark"
            />
          </div>
        </div>
      </div>

      {/* Preview + Download */}
      <div className="bg-dhl-dark rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4">
        <div>
          <p className="text-white font-bold">{selectedReport?.label}</p>
          <p className="text-white/50 text-xs mt-0.5">
            {new Date(from + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
            {" — "}
            {new Date(to + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
            {" · CSV"}
          </p>
        </div>
        <button
          onClick={download}
          disabled={!from || !to || loading}
          className="bg-dhl-yellow text-dhl-dark font-black px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-40 flex-shrink-0 text-sm"
        >
          {loading ? "Generando..." : "⬇ Descargar CSV"}
        </button>
      </div>

      <p className="text-xs text-dhl-gray/60 text-center">
        Los reportes incluyen datos de toda la sede CE · Sólo accesible por el Office Manager
      </p>
    </div>
  );
}
