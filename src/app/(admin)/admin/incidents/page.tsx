import { createAdminClient } from "@/lib/supabase/admin";
import IncidentInbox from "@/components/admin/IncidentInbox";
import ReportDownload from "@/components/admin/ReportDownload";
import type { IncidentRow } from "@/components/admin/IncidentInbox";

export const dynamic = "force-dynamic";

export default async function AdminIncidentsPage() {
  const admin = createAdminClient();

  const { data: incidents } = await admin
    .from("incidents")
    .select("id, category, description, location, status, created_at, profiles!inner(full_name, role)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dhl-dark">Inbox de Incidentes</h1>
        <p className="text-sm text-dhl-gray mt-0.5">
          Gestiona los reportes del equipo — actualiza estados y coordina con proveedores.
        </p>
      </div>

      <IncidentInbox incidents={(incidents ?? []) as unknown as IncidentRow[]} />

      <div className="border-t border-dhl-mid-gray pt-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-dhl-dark">📊 Descarga Histórica</h2>
          <p className="text-sm text-dhl-gray mt-0.5">
            Genera reportes por rango de fecha para análisis y toma de decisiones.
          </p>
        </div>
        <ReportDownload />
      </div>
    </div>
  );
}
