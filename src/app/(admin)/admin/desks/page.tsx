import { createAdminClient } from "@/lib/supabase/admin";
import AdminDeskMap from "@/components/admin/AdminDeskMap";
import type { AdminDeskData } from "@/components/admin/AdminDeskMap";

export const dynamic = "force-dynamic";

export default async function AdminDesksPage() {
  const admin = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { data: desks },
    { data: reservations },
    { data: users },
    { data: assignedProfiles },
  ] = await Promise.all([
    admin.from("desks").select("id, code, zone, type, area, is_active, assigned_user_id").order("code"),
    admin
      .from("desk_reservations")
      .select("id, desk_id, user_id, checked_in, status, profiles!inner(full_name, email, role)")
      .eq("date", today)
      .eq("status", "confirmed"),
    admin.from("profiles").select("id, full_name, email, role").order("full_name"),
    admin.from("profiles").select("id, full_name, email"),
  ]);

  const profileMap = Object.fromEntries(
    (assignedProfiles ?? []).map((p) => [p.id, p])
  );

  type RawRes = {
    id: string;
    desk_id: string;
    user_id: string;
    checked_in: boolean;
    status: string;
    profiles: { full_name: string; email: string; role: string } | null;
  };

  const desksWithData: AdminDeskData[] = (desks ?? []).map((d) => {
    const res = (reservations ?? []).find((r) => (r as unknown as RawRes).desk_id === d.id) as unknown as RawRes | undefined;
    const assignedProfile = d.assigned_user_id ? (profileMap[d.assigned_user_id] ?? null) : null;
    return {
      id: d.id,
      code: d.code,
      zone: d.zone,
      type: d.type,
      area: d.area,
      is_active: d.is_active,
      assigned_user_id: d.assigned_user_id,
      assigned_profile: assignedProfile,
      reservation: res
        ? {
            id: res.id,
            user_id: res.user_id,
            checked_in: res.checked_in,
            status: res.status,
            profiles: res.profiles,
          }
        : null,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dhl-dark">Mapa Maestro</h1>
        <p className="text-sm text-dhl-gray mt-0.5">
          Control total de puestos — identifica quién está dónde, libera, asigna y bloquea recursos.
        </p>
      </div>
      <AdminDeskMap desks={desksWithData} users={users ?? []} today={today} />
    </div>
  );
}
