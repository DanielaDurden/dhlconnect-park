import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();
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
    { label: "Usuarios registrados", value: usersCount ?? 0, emoji: "👥", color: "bg-blue-50 border-blue-200" },
    { label: "Puestos reservados hoy", value: deskResCount ?? 0, emoji: "🖥️", color: "bg-green-50 border-green-200" },
    { label: "Parking reservado hoy", value: parkingResCount ?? 0, emoji: "🚗", color: "bg-purple-50 border-purple-200" },
    { label: "Incidentes abiertos", value: openIncidentsCount ?? 0, emoji: "🔧", color: "bg-red-50 border-red-200" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-dhl-dark mb-6">Panel de Administración</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`bg-white rounded-2xl border p-4 shadow-sm ${stat.color}`}>
            <div className="text-3xl mb-2">{stat.emoji}</div>
            <div className="text-3xl font-bold text-dhl-dark">{stat.value}</div>
            <div className="text-xs text-dhl-gray mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Incidents */}
      <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden">
        <div className="bg-dhl-red px-4 py-3">
          <h2 className="text-white font-bold text-sm">Incidentes abiertos para Andrea</h2>
        </div>
        {recentIncidents && recentIncidents.length > 0 ? (
          <div className="divide-y divide-dhl-mid-gray">
            {recentIncidents.map((inc) => (
              <div key={inc.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-dhl-gray uppercase">
                        {inc.category === "cleaning" ? "🧹 Limpieza"
                          : inc.category === "supplies" ? "📦 Insumos"
                          : inc.category === "maintenance" ? "🔧 Mantenimiento"
                          : "📋 Otro"}
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
          <div className="px-4 py-8 text-center text-dhl-gray text-sm">
            ✅ No hay incidentes abiertos
          </div>
        )}
      </div>
    </div>
  );
}
