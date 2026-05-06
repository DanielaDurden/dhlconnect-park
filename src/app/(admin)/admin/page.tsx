import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  cleaning: "Limpieza",
  supplies: "Insumos",
  maintenance: "Mantenimiento",
  other: "Otro",
};

const STAT_ICONS: React.ReactNode[] = [
  <svg key="users" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  <svg key="desk" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>,
  <svg key="car" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true"><path d="M19 17H5v-6l2.5-6H16.5L19 11v6Z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>,
  <svg key="wrench" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
];

import React from "react";

export default async function AdminDashboard() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: usersCount },
    { count: deskResCount },
    { count: parkingResCount },
    { count: openIncidentsCount },
    { data: recentIncidents },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("desk_reservations").select("*", { count: "exact", head: true }).eq("date", today).eq("status", "confirmed"),
    supabase.from("parking_reservations").select("*", { count: "exact", head: true }).eq("date", today).eq("status", "confirmed"),
    supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("incidents").select("*, profiles!inner(full_name)").eq("status", "open").order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { label: "Usuarios registrados", value: usersCount ?? 0, color: "bg-blue-50 border-blue-200" },
    { label: "Puestos reservados hoy", value: deskResCount ?? 0, color: "bg-green-50 border-green-200" },
    { label: "Parking reservado hoy", value: parkingResCount ?? 0, color: "bg-purple-50 border-purple-200" },
    { label: "Incidentes abiertos", value: openIncidentsCount ?? 0, color: "bg-red-50 border-red-200" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-dhl-dark mb-6">Panel de Administración</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`bg-white rounded-2xl border p-4 shadow-sm ${stat.color}`}>
            <div className="mb-2 text-dhl-gray">{STAT_ICONS[i]}</div>
            <div className="text-3xl font-bold text-dhl-dark">{stat.value}</div>
            <div className="text-xs text-dhl-gray mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

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
