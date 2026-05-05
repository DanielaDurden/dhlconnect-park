import { createClient } from "@/lib/supabase/server";
import DeskMap from "@/components/DeskMap";
import type { DeskWithStatus } from "@/types";

export const dynamic = "force-dynamic";

export default async function DesksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().split("T")[0];

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, area, full_name")
    .eq("id", user!.id)
    .single();

  // Get all active desks
  const { data: desks } = await supabase
    .from("desks")
    .select("*")
    .eq("is_active", true)
    .order("grid_row")
    .order("grid_col");

  // Get today's confirmed reservations
  const { data: reservations } = await supabase
    .from("desk_reservations")
    .select("*, profiles!inner(full_name, area)")
    .eq("date", today)
    .eq("status", "confirmed");

  // Get today's user statuses (for owner availability)
  const { data: dayStatuses } = await supabase
    .from("user_day_status")
    .select("user_id, status")
    .eq("date", today);

  // Get assigned user profiles for fixed desks
  const assignedUserIds = (desks ?? [])
    .map((d) => d.assigned_user_id)
    .filter(Boolean) as string[];

  const { data: assignedProfiles } = assignedUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, area")
        .in("id", assignedUserIds)
    : { data: [] };

  // Build maps
  const reservationByDesk = Object.fromEntries(
    (reservations ?? []).map((r) => [r.desk_id, r])
  );
  const statusByUser = Object.fromEntries(
    (dayStatuses ?? []).map((s) => [s.user_id, s.status])
  );
  const profileById = Object.fromEntries(
    (assignedProfiles ?? []).map((p) => [p.id, p])
  );

  // Enrich desks with status info
  const enrichedDesks: DeskWithStatus[] = (desks ?? []).map((desk) => ({
    ...desk,
    reservation: reservationByDesk[desk.id] ?? null,
    assigned_profile: desk.assigned_user_id
      ? profileById[desk.assigned_user_id] ?? null
      : null,
    owner_day_status: desk.assigned_user_id
      ? (statusByUser[desk.assigned_user_id] ?? null)
      : null,
  }));

  // My reservation today
  const myReservation = (reservations ?? []).find(
    (r) => r.user_id === user!.id
  );

  // Today's area schedule
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon...
  const { data: todaySchedule } = await supabase
    .from("area_desk_schedule")
    .select("area, desk_count")
    .eq("day_of_week", dayOfWeek);

  return (
    <div className="px-4 py-5">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-dhl-dark">Mi Espacio 🖥️</h1>
        <p className="text-dhl-gray text-sm mt-0.5">
          {new Date().toLocaleDateString("es-CL", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Area schedule info */}
      {todaySchedule && todaySchedule.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs font-semibold text-blue-700 mb-1">
            Puestos compartidos disponibles hoy:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {todaySchedule.map((s) => (
              <span
                key={s.area}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium"
              >
                {s.area} ({s.desk_count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* My current reservation banner */}
      {myReservation && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-semibold text-green-700">
              Tienes reservado el Puesto{" "}
              {desks?.find((d) => d.id === myReservation.desk_id)?.code}
            </p>
            <p className="text-xs text-green-600">
              Check-in antes de las 10:00 AM para mantener tu reserva
            </p>
          </div>
        </div>
      )}

      <DeskMap
        desks={enrichedDesks}
        myProfile={profile!}
        today={today}
        myReservationId={myReservation?.id ?? null}
      />
    </div>
  );
}
