import { createAdminClient } from "@/lib/supabase/admin";
import RiffsAdmin from "@/components/admin/RiffsAdmin";
import type { RiffsUser } from "@/components/admin/RiffsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminRockstarPage() {
  const admin = createAdminClient();

  const [{ data: riffsTotals }, { data: allUsers }] = await Promise.all([
    admin
      .from("riffs_log")
      .select("user_id, points, profiles!inner(full_name, email, role)")
      .order("created_at", { ascending: false }),
    admin.from("profiles").select("id, full_name, role").neq("role", "admin").order("full_name"),
  ]);

  // Aggregate totals per user
  const byUser: Record<string, { full_name: string; email: string; role: string; total: number }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (riffsTotals ?? []) as unknown as { user_id: string; points: number; profiles: { full_name: string; email: string; role: string } | null }[]) {
    if (!byUser[r.user_id]) {
      byUser[r.user_id] = {
        full_name: r.profiles?.full_name ?? "—",
        email: r.profiles?.email ?? "—",
        role: r.profiles?.role ?? "—",
        total: 0,
      };
    }
    byUser[r.user_id].total += r.points;
  }

  const leaderboard: RiffsUser[] = Object.entries(byUser)
    .map(([id, data]) => ({ id, ...data, total_riffs: data.total }))
    .sort((a, b) => b.total_riffs - a.total_riffs);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dhl-dark">🎸 Rockstar Path</h1>
        <p className="text-sm text-dhl-gray mt-0.5">
          Ranking completo de colaboradores y ajuste manual de puntos.
        </p>
      </div>

      <RiffsAdmin users={leaderboard} allUsers={allUsers ?? []} />
    </div>
  );
}
