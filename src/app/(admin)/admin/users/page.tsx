import { createAdminClient } from "@/lib/supabase/admin";
import UserParkingToggle from "./UserParkingToggle";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = createAdminClient();

  const { data: hosts } = await admin
    .from("profiles")
    .select("id, full_name, email, role, has_parking, area")
    .in("role", ["host", "executive"])
    .order("full_name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-dhl-dark">Gestión de Usuarios</h1>
        <p className="text-sm text-dhl-gray mt-1">
          Configuración de acceso a parking por Host. Los Hosts sin parking asignado acceden al mapa como Visita.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-dhl-mid-gray flex items-center justify-between">
          <p className="text-sm font-bold text-dhl-dark">Hosts registrados</p>
          <span className="text-xs text-dhl-gray bg-dhl-light-gray px-2 py-1 rounded-full">
            {hosts?.length ?? 0} usuarios
          </span>
        </div>

        {!hosts?.length ? (
          <p className="text-center text-dhl-gray text-sm py-10">Sin usuarios Host registrados.</p>
        ) : (
          <div className="divide-y divide-dhl-mid-gray">
            {hosts.map((host) => (
              <div key={host.id} className="flex items-center justify-between px-5 py-4 hover:bg-dhl-light-gray/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dhl-dark text-sm truncate">{host.full_name || "—"}</p>
                  <p className="text-xs text-dhl-gray mt-0.5 truncate">{host.email}</p>
                  {host.area && (
                    <span className="text-[10px] bg-dhl-yellow/20 text-dhl-dark px-1.5 py-0.5 rounded mt-1 inline-block font-medium">
                      {host.area}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`text-xs font-semibold ${host.has_parking ? "text-green-600" : "text-dhl-gray"}`}>
                    {host.has_parking ? "Con parking" : "Sin parking"}
                  </span>
                  <UserParkingToggle userId={host.id} hasParking={host.has_parking ?? true} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
