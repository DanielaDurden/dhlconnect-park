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

  // On weekends show next week's plans in the executive widget (mirrors planner logic)
  const widgetWeekStart = (rawDay === 0 || rawDay === 6)
    ? getWeekStart(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
    : weekStart;

  const [
    { data: profile },
    { data: deskReservationToday },
    { data: parkingResToday },
    { data: weeklyPlanToday },
    { data: weeklyPlansWeek },
    { data: riffsData },
    { count: solidarityCount },
    { count: occupiedDesksCount },
    { count: totalDesksCount },
    { data: myDeskRow },
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
    admin
      .from("weekly_plans")
      .select("day_of_week, planned_status, solidarity_released")
      .eq("user_id", user!.id)
      .eq("week_start", widgetWeekStart),
    admin.from("riffs_log").select("points").eq("user_id", user!.id),
    admin
      .from("riffs_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("action", "solidarity_release")
      .gte("created_at", weekStart),
    admin
      .from("desk_reservations")
      .select("id", { count: "exact", head: true })
      .eq("date", today)
      .eq("status", "confirmed"),
    admin
      .from("desks")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    admin
      .from("desks")
      .select("id")
      .eq("assigned_user_id", user!.id)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  const role = (profile?.role ?? "guest") as UserRole;

  // For host: check if there's a guest reservation on their desk today
  let guestReservationOnMyDesk: { id: string } | null = null;
  if ((role === "host" || role === "executive") && myDeskRow?.id) {
    const { data: guestRes } = await admin
      .from("desk_reservations")
      .select("id")
      .eq("desk_id", myDeskRow.id)
      .eq("date", today)
      .eq("status", "confirmed")
      .neq("user_id", user!.id)
      .maybeSingle();
    guestReservationOnMyDesk = guestRes ?? null;
  }

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

  // Hosts go directly to HostHome — release/keep decision is handled via HostHome buttons
  const dailyActionCompleted = true;

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
    guestReservationOnMyDesk,
    weeklyPlansWeek: (weeklyPlansWeek ?? []).map((p) => ({
      day_of_week: p.day_of_week as number,
      planned_status: p.planned_status as string,
      solidarity_released: p.solidarity_released as boolean,
    })),
  };

  if (!dailyActionCompleted) {
    return <DailyCard {...sharedProps} />;
  }

  return <HomeDashboard {...sharedProps} />;
}
