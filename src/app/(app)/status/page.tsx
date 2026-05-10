import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import StatusForm from "@/components/StatusForm";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, area, role")
    .eq("id", user!.id)
    .single();

  // Get this week's statuses
  const monday = new Date();
  const dayOfWeek = monday.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(monday.getDate() + diff);

  const weekDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const { data: statuses } = await admin
    .from("user_day_status")
    .select("*")
    .eq("user_id", user!.id)
    .in("date", weekDates);
  const today = new Date().toISOString().split("T")[0];
  const { data: teamStatuses } = await admin
    .from("user_day_status")
    .select("*, profiles!inner(full_name, area)")
    .eq("date", today);

  return (
    <div className="px-4 py-5">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-dhl-dark">Mi Estado</h1>
        <p className="text-dhl-gray text-sm mt-0.5">
          Marca dónde estarás trabajando cada día
        </p>
      </div>

      <StatusForm
        profile={profile!}
        role={profile?.role ?? "professional"}
        weekDates={weekDates}
        myStatuses={statuses ?? []}
        teamStatuses={teamStatuses ?? []}
        today={today}
      />
    </div>
  );
}
