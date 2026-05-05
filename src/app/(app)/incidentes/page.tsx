import { createClient } from "@/lib/supabase/server";
import IncidentForm from "@/components/IncidentForm";

export const dynamic = "force-dynamic";

export default async function IncidentesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", user!.id)
    .single();

  const { data: myIncidents } = await supabase
    .from("incidents")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="px-4 py-5">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-dhl-dark">Directo a Office Manager 🔧</h1>
        <p className="text-dhl-gray text-sm mt-0.5">
          Reporta incidentes para que lleguen directo al Office Manager y se gestionen con los proveedores
        </p>
      </div>

      <IncidentForm profile={profile!} />

      {/* My recent incidents */}
      {myIncidents && myIncidents.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-dhl-dark mb-3">Mis reportes recientes</h2>
          <div className="space-y-3">
            {myIncidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-white rounded-xl border border-dhl-mid-gray p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-dhl-gray uppercase">
                        {inc.category === "cleaning"
                          ? "🧹 Limpieza"
                          : inc.category === "supplies"
                          ? "📦 Insumos"
                          : inc.category === "maintenance"
                          ? "🔧 Mantenimiento"
                          : "📋 Otro"}
                      </span>
                    </div>
                    <p className="text-sm text-dhl-dark line-clamp-2">{inc.description}</p>
                    {inc.location && (
                      <p className="text-xs text-dhl-gray mt-0.5">📍 {inc.location}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-medium ${
                      inc.status === "open"
                        ? "bg-yellow-100 text-yellow-700"
                        : inc.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {inc.status === "open"
                      ? "Abierto"
                      : inc.status === "in_progress"
                      ? "En curso"
                      : "Resuelto"}
                  </span>
                </div>
                <p className="text-xs text-dhl-gray mt-2">
                  {new Date(inc.created_at).toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
