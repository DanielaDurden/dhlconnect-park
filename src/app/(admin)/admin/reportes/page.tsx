import ReportDownload from "@/components/admin/ReportDownload";

export const dynamic = "force-dynamic";

export default function AdminReportesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dhl-dark">📊 Reportes Históricos</h1>
        <p className="text-sm text-dhl-gray mt-0.5">
          Descarga data operacional por rango de fechas para análisis y decisiones de infraestructura.
        </p>
      </div>
      <ReportDownload />
    </div>
  );
}
