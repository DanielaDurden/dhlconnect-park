import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import PlannerForm from "@/components/PlannerForm";

export const dynamic = "force-dynamic";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export default async function PlannerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  // Redirect non-executives to home
  if (profile?.role !== "executive" && profile?.role !== "admin") {
    redirect("/home");
  }

  const now = new Date();
  const todayDay = now.getDay();
  const isWeekend = todayDay === 0 || todayDay === 6;

  const monday = getMondayOfWeek(now);
  // On weekends show next week so executives can plan ahead
  if (isWeekend) monday.setDate(monday.getDate() + 7);
  const weekStart = monday.toISOString().split("T")[0];

  const weekDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const { data: plans } = await admin
    .from("weekly_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", weekStart);

  return (
    <div className="px-4 py-5">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-dhl-dark">📅 Diseña tu semana</h1>
        <p className="text-dhl-gray text-sm mt-0.5">
          {isWeekend
            ? "Proyecta tus días en la oficina para asegurar tu base y parking."
            : "Proyecta tus días en la oficina para asegurar tu base y parking."}
        </p>
        {isWeekend && (
          <span className="inline-block mt-1.5 text-[10px] font-bold bg-dhl-yellow/30 text-dhl-dark px-2 py-0.5 rounded-full uppercase tracking-wide">
            Próxima semana
          </span>
        )}
      </div>

      <div className="bg-dhl-yellow/10 border border-dhl-yellow rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-dhl-dark flex-shrink-0 mt-0.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
        </svg>
        <p className="text-xs text-dhl-dark">
          ¿No vienes? <strong>Comparte tu escenario 🎸</strong> — al liberar tu oficina, el equipo vive una experiencia <strong>CoWork Premium</strong>. Ganas <strong>+50 Riffs</strong> por tu generosidad.
        </p>
      </div>

      <PlannerForm
        weekStart={weekStart}
        weekDates={weekDates}
        initialPlans={plans ?? []}
      />
    </div>
  );
}
