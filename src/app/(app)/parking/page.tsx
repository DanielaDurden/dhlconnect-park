import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ParkingGrid from "@/components/ParkingGrid";
import type { ParkingSpotWithReservation } from "@/types";

export const dynamic = "force-dynamic";

export default async function ParkingPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().split("T")[0];

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, status_type")
    .eq("id", user!.id)
    .single();

  // Use admin client for public read-only data
  const [{ data: spots }, { data: reservations }] = await Promise.all([
    admin.from("parking_spots").select("*").eq("is_active", true).order("spot_number"),
    admin.from("parking_reservations").select("*, profiles!inner(full_name)").eq("date", today).eq("status", "confirmed"),
  ]);

  const reservationBySpot = Object.fromEntries(
    (reservations ?? []).map((r) => [r.spot_id, r])
  );

  const enrichedSpots: ParkingSpotWithReservation[] = (spots ?? []).map((spot) => ({
    ...spot,
    reservation: reservationBySpot[spot.id] ?? null,
  }));

  const myReservation = (reservations ?? []).find((r) => r.user_id === user!.id);

  const bookableSpots = enrichedSpots.filter((s) => s.spot_status === "available");
  const occupiedCount = bookableSpots.filter((s) => s.reservation?.status === "confirmed").length;

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-dhl-dark">Smart Parking</h1>
        <p className="text-dhl-gray text-sm mt-0.5">
          {(() => {
            const s = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
            return s.charAt(0).toUpperCase() + s.slice(1);
          })()}
        </p>
      </div>

      {/* My reservation banner */}
      {myReservation && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-green-700">
              Tienes reservado el Espacio{" "}
              {spots?.find((s) => s.id === myReservation.spot_id)?.spot_number}
            </p>
            <p className="text-xs text-green-600">Nivel -2</p>
          </div>
        </div>
      )}

      {/* 24h notice for visitors */}
      {profile?.status_type === "visiting" && !myReservation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-700">Reserva anticipada</p>
            <p className="text-blue-600 text-xs mt-0.5">
              Como visita de otro site, recuerda reservar con al menos 24 horas de anticipación.
            </p>
          </div>
        </div>
      )}

      <ParkingGrid
        spots={enrichedSpots}
        myProfile={profile!}
        today={today}
        myReservationId={myReservation?.id ?? null}
        totalCapacity={bookableSpots.length}
        occupiedCount={occupiedCount}
      />
    </div>
  );
}
