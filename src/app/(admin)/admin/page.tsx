import { createAdminClient } from "@/lib/supabase/admin";
import React from "react";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  cleaning: "Limpieza",
  supplies: "Insumos",
  maintenance: "Mantenimiento",
  other: "Otro",
};

const WORST_CASE_LABELS: Record<string, string> = {
  parking_full: "Parking lleno",
  desks_full:   "Oficina llena",
};

export default async function AdminDashboard() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: usersCount },
    { data: deskRes },
    { data: parkingRes },
    { count: openIncidentsCount },
    { data: recentIncidents },
    { data: worstCaseToday },
    { data: topRiffs },
    { data: checkinsToday },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("desk_reservations").select("checked_in").eq("date", today).eq("status", "confirmed"),
    supabase.from("parking_reservations").select("id").eq("date", today).eq("status", "confirmed"),
    supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("incidents").select("*, profiles!inner(full_name)").eq("status", "open").order("created_at", { ascending: false }).limit(5),
    supabase.from("worst_case_log").select("type").eq("date", today),
    supabase.from("riffs_log").select("user_id, points, profiles!inner(full_name)").order("created_at", { ascending: false }).limit(50),
    supabase.from("desk_reservations").select("checked_in").eq("date", today).eq("status", "confirmed"),
  ]);

  const deskResCount = deskRes?.length ?? 0;
  const parkingResCount = parkingRes?.length ?? 0;

  // Green Score: % of desk reservations with check-in
  const checkins = checkinsToday ?? [];
  const greenScore = checkins.length > 0
    ? Math.round((checkins.filter((c: { checked_in: boolean }) => c.checked_in).length / checkins.length) * 100)
    : 0;

  // Worst Case KPI
  const parkingFullCount = (worstCaseToday ?? []).filter((w: { type: string }) => w.type === "parking_full").length;
  const desksFullCount   = (worstCaseToday ?? []).filter((w: { type: string }) => w.type === "desks_full").length;

  // Top Riffs per user (simplified aggregation)
  const riffsByUser: Record<string, { name: string; total: number }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (topRiffs ?? []) as any[]) {
    if (!riffsByUser[r.user_id]) {
      riffsByUser[r.user_id] = { name: r.profiles?.full_name ?? "—", total: 0 };
    }
    riffsByUser[r.user_id].total += r.points;
  }
  const topUsers = Object.entries(riffsByUser)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const stats = [
    {
      label: "Usuarios registrados",
      value: usersCount ?? 0,
      color: "bg-blue-50 border-blue-200",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      label: "Puestos reservados hoy",
      value: deskResCount,
      color: "bg-green-50 border-green-200",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>,
    },
    {
      label: "Parking reservado hoy",
      value: parkingResCount,
      color: "bg-purple-50 border-purple-200",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M19 17H5v-6l2.5-6H16.5L19 11v6Z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>,
    },
    {
      label: "Incidentes abiertos",
      value: openIncidentsCount ?? 0,
      color: "bg-red-50 border-red-200",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-dhl-dark mb-6">Panel de Administración</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-white rounded-2xl border p-4 shadow-sm ${stat.color}`}>
            <div className="mb-2 text-dhl-gray">{stat.icon}</div>
            <div className="text-3xl font-bold text-dhl-dark">{stat.value}</div>
            <div className="text-xs text-dhl-gray mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Blueprint KPIs */}
      <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden mb-6">
        <div className="bg-dhl-yellow px-4 py-3">
          <h2 className="text-dhl-dark font-bold text-sm">KPIs Blueprint</h2>
        </div>
        <div className="divide-y divide-dhl-mid-gray">
          {/* Green Score */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-semibold text-dhl-dark">Green Score</p>
              <span className={`text-sm font-bold ${greenScore >= 70 ? "text-green-600" : greenScore >= 40 ? "text-amber-600" : "text-red-600"}`}>
                {greenScore}%
              </span>
            </div>
            <div className="h-2 bg-dhl-mid-gray rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${greenScore >= 70 ? "bg-green-500" : greenScore >= 40 ? "bg-amber-400" : "bg-red-500"}`}
                style={{ width: `${greenScore}%` }}
              />
            </div>
            <p className="text-xs text-dhl-gray mt-1">% de reservas con check-in registrado hoy</p>
          </div>

          {/* Demanda Insatisfecha */}
          <div className="px-4 py-4">
            <p className="text-sm font-semibold text-dhl-dark mb-2">Demanda Insatisfecha (hoy)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl border px-3 py-2 text-center ${desksFullCount > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                <p className={`text-xl font-bold ${desksFullCount > 0 ? "text-red-600" : "text-dhl-gray"}`}>{desksFullCount}</p>
                <p className="text-[10px] text-dhl-gray">{WORST_CASE_LABELS.desks_full}</p>
              </div>
              <div className={`rounded-xl border px-3 py-2 text-center ${parkingFullCount > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                <p className={`text-xl font-bold ${parkingFullCount > 0 ? "text-red-600" : "text-dhl-gray"}`}>{parkingFullCount}</p>
                <p className="text-[10px] text-dhl-gray">{WORST_CASE_LABELS.parking_full}</p>
              </div>
            </div>
            <p className="text-xs text-dhl-gray mt-2">Usuarios que encontraron capacidad completa</p>
          </div>
        </div>
      </div>

      {/* Top Riffs */}
      {topUsers.length > 0 && (
        <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden mb-6">
          <div className="bg-dhl-yellow px-4 py-3">
            <h2 className="text-dhl-dark font-bold text-sm">Rockstar Path — Top Riffs</h2>
          </div>
          <div className="divide-y divide-dhl-mid-gray">
            {topUsers.map(([, data], i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-dhl-gray w-5">{i + 1}</span>
                  <p className="text-sm font-medium text-dhl-dark">{data.name}</p>
                </div>
                <span className="text-sm font-bold text-dhl-dark">{data.total.toLocaleString("es-CL")} Riffs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Incidents */}
      <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden">
        <div className="bg-dhl-yellow px-4 py-3">
          <h2 className="text-dhl-dark font-bold text-sm">Incidentes abiertos para Office Manager</h2>
        </div>
        {recentIncidents && recentIncidents.length > 0 ? (
          <div className="divide-y divide-dhl-mid-gray">
            {recentIncidents.map((inc) => (
              <div key={inc.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-dhl-gray uppercase">
                        {CATEGORY_LABELS[inc.category] ?? inc.category}
                      </span>
                      {inc.location && (
                        <span className="text-xs text-dhl-gray">— {inc.location}</span>
                      )}
                    </div>
                    <p className="text-sm text-dhl-dark mt-0.5">{inc.description}</p>
                    <p className="text-xs text-dhl-gray mt-1">
                      Reportado por{" "}
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(inc as any).profiles?.full_name} •{" "}
                      {new Date(inc.created_at).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-dhl-gray text-sm flex flex-col items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-400" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            No hay incidentes abiertos
          </div>
        )}
      </div>
    </div>
  );
}
