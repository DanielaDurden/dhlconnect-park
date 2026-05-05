import { createClient } from "@/lib/supabase/server";
import ParkingGrid from "@/components/ParkingGrid";
import type { ParkingSpotWithReservation } from "@/types";

export const dynamic = "force-dynamic";

export default async function ParkingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().getDay(); // 0=Sun,1=Mon
  const isMonday = dayOfWeek === 1;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, status_type")
    .eq("id", user!.id)
    .single();

  // Get all parking spots
  const { data: spots } = await supabase
    .from("parking_spots")
    .select("*")
    .eq("is_active", true)
    .order("spot_number");

  // Get today's reservations
  const { data: reservations } = await supabase
    .from("parking_reservations")
    .select("*, profiles!inner(full_name)")
    .eq("date", today)
    .eq("status", "confirmed");

  const reservationBySpot = Object.fromEntries(
    (reservations ?? []).map((r) => [r.spot_id, r])
  );

  const enrichedSpots: ParkingSpotWithReservation[] = (spots ?? []).map((spot) => ({
    ...spot,
    reservation: reservationBySpot[spot.id] ?? null,
  }));

  const myReservation = (reservations ?? []).find((r) => r.user_id === user!.id);

  // Count occupied (available spots that have reservations)
  const bookableSpots = enrichedSpots.filter(
    (s) =>
      s.spot_status === "available" ||
      (s.spot_status === "director_reserved" && !isMonday)
  );
  const occupiedCount = bookableSpots.filter(
    (s) => s.reservation?.status === "confirmed"
  ).length;

  return (
    <div className="px-4 py-5">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-dhl-dark">Smart Parking 🚗</h1>
        <p className="text-dhl-gray text-sm mt-0.5">
          {new Date().toLocaleDateString("es-CL", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* My reservation banner */}
      {myReservation && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm font-semibold text-blue-700">⏰ Reserva anticipada</p>
          <p className="text-blue-600 text-xs mt-0.5">
            Como visita de otro site, recuerda reservar con al menos 24 horas de anticipación.
          </p>
        </div>
      )}

      <ParkingGrid
        spots={enrichedSpots}
        myProfile={profile!}
        today={today}
        isMonday={isMonday}
        myReservationId={myReservation?.id ?? null}
        totalCapacity={bookableSpots.length}
        occupiedCount={occupiedCount}
      />
    </div>
  );
}
