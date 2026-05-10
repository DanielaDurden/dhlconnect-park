import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import DeskMap from "@/components/DeskMap";
import type { DeskWithStatus } from "@/types";

export const dynamic = "force-dynamic";

export default async function DesksPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().split("T")[0];

  // Get user profile
  const { data: profile } = await admin
    .from("profiles")
    .select("id, area, full_name, role")
    .eq("id", user!.id)
    .single();

  // Use admin client for public read-only data to avoid RLS edge cases
  const [
    { data: desks, error: desksError },
    { data: reservations },
    { data: dayStatuses },
    { data: todaySchedule },
  ] = await Promise.all([
    admin.from("desks").select("*").eq("is_active", true).order("grid_row").order("grid_col"),
    admin.from("desk_reservations").select("*, profiles!inner(full_name, area)").eq("date", today).eq("status", "confirmed"),
    admin.from("user_day_status").select("user_id, status").eq("date", today),
    admin.from("area_desk_schedule").select("area, desk_count").eq("day_of_week", new Date().getDay()),
  ]);


  // Get assigned user profiles for fixed desks
  const assignedUserIds = (desks ?? [])
    .map((d) => d.assigned_user_id)
    .filter(Boolean) as string[];

  const { data: assignedProfiles } = assignedUserIds.length
    ? await admin
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

  // dayOfWeek and schedule already fetched above

  return (
    <div className="px-4 py-5">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-dhl-dark">Mi Espacio</h1>
        <p className="text-dhl-gray text-sm mt-0.5">
          {(() => {
            const s = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
            return s.charAt(0).toUpperCase() + s.slice(1);
          })()}
        </p>
      </div>

      {/* Area schedule info */}
      {todaySchedule && todaySchedule.length > 0 && (
        <div className="bg-dhl-yellow/15 border border-dhl-yellow rounded-xl px-4 py-3 mb-4">
          <p className="text-xs font-semibold text-dhl-dark mb-1.5">
            Puestos compartidos disponibles hoy:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {todaySchedule.map((s) => (
              <span
                key={s.area}
                className="bg-dhl-yellow/30 text-dhl-dark text-xs px-2 py-0.5 rounded-full font-medium"
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
          <span className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-green-700">
              Tienes reservado el Puesto{" "}
              {desks?.find((d) => d.id === myReservation.desk_id)?.code}
            </p>
            <p className="text-xs text-green-600">
              Check-in antes de las 9:01 AM para mantener tu reserva
            </p>
          </div>
        </div>
      )}

      {desksError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
          <p className="font-semibold">Error al cargar los puestos</p>
          <p className="text-xs mt-1 font-mono">{desksError.message}</p>
        </div>
      )}

      {!desksError && enrichedDesks.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-700">
          <p className="font-semibold">No se encontraron puestos activos</p>
          <p className="text-xs mt-1">Verifica la configuración en la consola del servidor.</p>
        </div>
      )}

      <DeskMap
        desks={enrichedDesks}
        myProfile={profile!}
        today={today}
        myReservationId={myReservation?.id ?? null}
        myRole={profile?.role as import("@/types").UserRole}
      />
    </div>
  );
}
