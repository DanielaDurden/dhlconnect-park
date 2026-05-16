import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import IncidentForm from "@/components/IncidentForm";

export const dynamic = "force-dynamic";

export default async function IncidentesPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: myIncidents }] = await Promise.all([
    admin.from("profiles").select("id, full_name, role").eq("id", user!.id).single(),
    admin.from("incidents").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10),
  ]);

  const isHost = profile?.role === "host" || profile?.role === "executive";

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-dhl-dark">Directo a Office Manager</h1>
        <p className="text-dhl-gray text-sm mt-0.5">
          Reporta incidentes para que lleguen directo al Office Manager y se gestionen con los proveedores
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:items-start">
        <IncidentForm profile={profile!} />

        {!isHost && myIncidents && myIncidents.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-dhl-dark mb-3">Mis reportes recientes</h2>
          <div className="space-y-3">
            {myIncidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-white rounded-xl border border-dhl-mid-gray p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {inc.category === "cleaning" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-dhl-gray flex-shrink-0" aria-hidden="true"><path d="M3 22v-4l9-9 4 4-9 9H3Z"/><path d="m15 5 4 4"/><path d="m9.5 11.5 1.5 1.5"/></svg>
                      )}
                      {inc.category === "supplies" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-dhl-gray flex-shrink-0" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                      )}
                      {inc.category === "maintenance" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-dhl-gray flex-shrink-0" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                      )}
                      {inc.category === "other" && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-dhl-gray flex-shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      )}
                      <span className="text-xs font-semibold text-dhl-gray uppercase">
                        {inc.category === "cleaning" ? "Limpieza"
                          : inc.category === "supplies" ? "Insumos"
                          : inc.category === "maintenance" ? "Mantenimiento"
                          : "Otro"}
                      </span>
                    </div>
                    <p className="text-sm text-dhl-dark line-clamp-2">{inc.description}</p>
                    {inc.location && (
                      <p className="text-xs text-dhl-gray mt-0.5 flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        {inc.location}
                      </p>
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
    </div>
  );
}
