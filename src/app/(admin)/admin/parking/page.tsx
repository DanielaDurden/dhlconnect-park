import { createAdminClient } from "@/lib/supabase/admin";
import AdminParkingMap from "@/components/admin/AdminParkingMap";
import type { AdminParkingSpotData } from "@/components/admin/AdminParkingMap";

export const dynamic = "force-dynamic";

export default async function AdminParkingPage() {
  const admin = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  type RawRes = {
    id: string;
    spot_id: string;
    user_id: string;
    status: string;
    profiles: { full_name: string } | null;
  };

  const [
    { data: spots },
    { data: reservations },
    { data: users },
  ] = await Promise.all([
    admin.from("parking_spots").select("id, spot_number, spot_status, assigned_user_name, director_name, is_accessible, is_active").order("spot_number"),
    admin.from("parking_reservations").select("id, spot_id, user_id, status, profiles!inner(full_name)").eq("date", today).eq("status", "confirmed"),
    admin.from("profiles").select("id, full_name, email, role").neq("role", "admin").order("full_name"),
  ]);

  const reservationBySpot = Object.fromEntries(
    (reservations ?? []).map((r) => {
      const raw = r as unknown as RawRes;
      return [raw.spot_id, raw];
    })
  );

  const spotsWithData: AdminParkingSpotData[] = (spots ?? []).map((s) => {
    const res = reservationBySpot[s.id] as RawRes | undefined;
    return {
      id: s.id,
      spot_number: s.spot_number,
      spot_status: s.spot_status,
      assigned_user_name: s.assigned_user_name,
      director_name: s.director_name,
      is_accessible: s.is_accessible,
      is_active: s.is_active,
      reservation: res
        ? {
            id: res.id,
            user_id: res.user_id,
            status: res.status,
            profile_name: res.profiles?.full_name ?? "—",
          }
        : null,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dhl-dark">Smart Parking — Admin</h1>
        <p className="text-sm text-dhl-gray mt-0.5">
          Control total del estacionamiento Nivel -2 — libera, asigna y gestiona espacios.
        </p>
      </div>
      <AdminParkingMap spots={spotsWithData} users={users ?? []} today={today} />
    </div>
  );
}
