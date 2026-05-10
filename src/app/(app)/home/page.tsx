import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";
import { getRiffsLevel } from "@/types";
import { getWeekStart } from "@/lib/dateUtils";
import DailyCard from "@/components/DailyCard";
import HomeDashboard from "@/components/HomeDashboard";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekStart = getWeekStart(now);
  const rawDay = now.getDay();
  const dayOfWeek = rawDay === 0 ? 7 : rawDay;

  const firstOfMonth = today.slice(0, 7) + "-01";

  const [
    { data: profile },
    { data: deskReservationToday },
    { data: parkingResToday },
    { data: weeklyPlanToday },
    { data: riffsData },
    { count: solidarityCount },
    { count: occupiedDesksCount },
    { count: totalDesksCount },
  ] = await Promise.all([
    admin.from("profiles").select("full_name, area, role").eq("id", user!.id).single(),
    admin
      .from("desk_reservations")
      .select("id, desk_id, checked_in, carpooling, status, desks(code)")
      .eq("user_id", user!.id)
      .eq("date", today)
      .maybeSingle(),
    admin
      .from("parking_reservations")
      .select("id, spot_id, parking_spots(spot_number, level)")
      .eq("user_id", user!.id)
      .eq("date", today)
      .eq("status", "confirmed")
      .maybeSingle(),
    admin
      .from("weekly_plans")
      .select("id, planned_status, solidarity_released")
      .eq("user_id", user!.id)
      .eq("week_start", weekStart)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle(),
    admin.from("riffs_log").select("points").eq("user_id", user!.id),
    admin
      .from("riffs_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("action", "solidarity_release")
      .gte("created_at", firstOfMonth),
    admin
      .from("desk_reservations")
      .select("id", { count: "exact", head: true })
      .eq("date", today)
      .eq("status", "confirmed"),
    admin
      .from("desks")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const role = (profile?.role ?? "professional") as UserRole;
  const totalRiffs = (riffsData ?? []).reduce((sum: number, r: { points: number }) => sum + r.points, 0);
  const riffsInfo = getRiffsLevel(totalRiffs);
  const solidarityCountVal = solidarityCount ?? 0;

  const occupied = occupiedDesksCount ?? 0;
  const total = totalDesksCount ?? 0;
  const availableDesksCount = Math.max(0, total - occupied);

  type DeskResWithJoin = { id: string; desk_id: string; checked_in: boolean; carpooling: boolean | null; status: string; desks: { code: string } | null };
  type ParkingResWithJoin = { id: string; spot_id: string; parking_spots: { spot_number: number; level: string } | null };

  const deskCode = (deskReservationToday as DeskResWithJoin | null)?.desks?.code;
  const reservationId = deskReservationToday?.id;

  const isWeekend = rawDay === 0 || rawDay === 6;

  let dailyActionCompleted: boolean;
  if (isWeekend) {
    // No action needed on weekends — planner only covers Mon–Fri
    dailyActionCompleted = true;
  } else if (role === "executive") {
    dailyActionCompleted = !!weeklyPlanToday;
  } else if (role === "professional") {
    // Card shows until: checked in OR explicitly released (cancelled) today
    dailyActionCompleted =
      deskReservationToday?.checked_in === true ||
      deskReservationToday?.status === "cancelled";
  } else {
    dailyActionCompleted = true;
  }

  const rawName = profile?.full_name ?? user!.email?.split("@")[0] ?? "";
  const firstName = rawName.split(" ")[0] || "hey";

  const sharedProps = {
    role,
    firstName,
    deskCode,
    reservationId,
    deskReservationToday: deskReservationToday
      ? {
          id: deskReservationToday.id,
          desk_id: deskReservationToday.desk_id,
          checked_in: deskReservationToday.checked_in,
          carpooling: deskReservationToday.carpooling ?? false,
          status: deskReservationToday.status,
        }
      : null,
    parkingResToday: parkingResToday
      ? {
          id: parkingResToday.id,
          spotNumber: (parkingResToday as unknown as ParkingResWithJoin).parking_spots?.spot_number,
          level: (parkingResToday as unknown as ParkingResWithJoin).parking_spots?.level,
        }
      : null,
    weeklyPlanToday: weeklyPlanToday
      ? {
          id: weeklyPlanToday.id,
          planned_status: weeklyPlanToday.planned_status,
          solidarity_released: weeklyPlanToday.solidarity_released,
        }
      : null,
    totalRiffs,
    riffsLevel: riffsInfo.level,
    riffsProgress: riffsInfo.progress,
    riffsNext: riffsInfo.next,
    solidarityCount: solidarityCountVal,
    availableDesksCount,
    isWeekend,
  };

  if (!dailyActionCompleted) {
    return <DailyCard {...sharedProps} />;
  }

  return <HomeDashboard {...sharedProps} />;
}
