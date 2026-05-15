import { createAdminClient } from "@/lib/supabase/admin";
import { getWeekStart } from "@/lib/dateUtils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  cleaning: "Limpieza",
  supplies: "Insumos",
  maintenance: "Mantenimiento",
  other: "Otro",
};

const ROLE_LABELS: Record<string, string> = {
  host: "Host",
  executive: "Host",
  guest: "Visita",
  professional: "Visita",
  admin: "Admin",
  client: "Cliente",
};

type IncidentRow = {
  id: string;
  category: string;
  description: string;
  location: string | null;
  status: string;
  created_at: string;
  profiles: { full_name: string } | null;
};

type ReservationWithRole = {
  profiles: { role: string } | null;
};

type RiffsRow = {
  user_id: string;
  points: number;
  profiles: { full_name: string; role: string } | null;
};

export default async function AdminDashboard() {
  const admin = createAdminClient();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekStart = getWeekStart(now);
  const rawDay = now.getDay();
  const dayOfWeek = rawDay === 0 ? 7 : rawDay;
  const isWeekend = rawDay === 0 || rawDay === 6;

  const [
    { count: totalDesks },
    { data: reservedDesks },
    { count: totalParkingSpots },
    { count: reservedParking },
    { data: worstCaseToday },
    { data: sharingToday },
    { count: totalExecutives },
    { data: carpoolingRiffsWeek },
    { data: recentIncidents },
    { count: openIncidents },
    { data: reservationsByRole },
    { data: topRiffs },
  ] = await Promise.all([
    admin.from("desks").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("desk_reservations")
      .select("user_id, checked_in, profiles!inner(role)")
      .eq("date", today)
      .eq("status", "confirmed"),
    admin.from("parking_spots").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("parking_reservations")
      .select("id", { count: "exact", head: true })
      .eq("date", today)
      .eq("status", "confirmed"),
    admin.from("worst_case_log").select("type").eq("date", today),
    isWeekend
      ? Promise.resolve({ data: [] as { id: string }[] })
      : admin.from("weekly_plans")
          .select("id")
          .eq("week_start", weekStart)
          .eq("day_of_week", dayOfWeek)
          .eq("solidarity_released", true),
    admin.from("profiles").select("id", { count: "exact", head: true }).in("role", ["executive", "host"]),
    admin.from("riffs_log")
      .select("points")
      .eq("action", "checkin_carpooling")
      .gte("created_at", weekStart),
    admin.from("incidents")
      .select("id, category, description, location, status, created_at, profiles!inner(full_name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),
    admin.from("incidents").select("id", { count: "exact", head: true }).eq("status", "open"),
    admin.from("desk_reservations")
      .select("profiles!inner(role)")
      .eq("date", today)
      .eq("status", "confirmed"),
    admin.from("riffs_log")
      .select("user_id, points, profiles!inner(full_name, role)")
      .gte("created_at", weekStart)
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  // Adoption KPIs (month-to-date)
  const monthStart = `${today.slice(0, 7)}-01`;
  const [
    { count: totalHosts },
    { data: hostActionsThisMonth },
    { count: totalGuests },
    { data: guestDeskResThisMonth },
    { data: guestParkingResThisMonth },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).in("role", ["host", "executive"]),
    // Host adoption: any positive action (release, carpool) or base recovery this month
    admin.from("riffs_log")
      .select("user_id")
      .in("action", ["voluntary_release", "solidarity_release", "carpool", "checkin_carpooling", "recover_base_penalty"])
      .gte("created_at", monthStart),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "guest"),
    // Guest adoption: reserved a desk or parking at least once this month
    admin.from("desk_reservations")
      .select("user_id")
      .gte("date", monthStart)
      .eq("status", "confirmed"),
    admin.from("parking_reservations")
      .select("user_id")
      .gte("date", monthStart)
      .eq("status", "confirmed"),
  ]);

  // Ocupación
  const deskResCount = reservedDesks?.length ?? 0;
  const totalDesksCount = totalDesks ?? 0;
  const deskOccupancyPct = totalDesksCount > 0 ? Math.round((deskResCount / totalDesksCount) * 100) : 0;
  const parkingResCount = reservedParking ?? 0;
  const totalParkingCount = totalParkingSpots ?? 0;
  const parkingOccupancyPct = totalParkingCount > 0 ? Math.round((parkingResCount / totalParkingCount) * 100) : 0;

  // Demanda insatisfecha
  const worstList = (worstCaseToday ?? []) as { type: string }[];
  const demandaInsatisfecha = worstList.length;
  const parkingFullCount = worstList.filter((w) => w.type === "parking_full").length;
  const desksFullCount = worstList.filter((w) => w.type === "desks_full").length;

  // Sharing Rate
  const sharingCount = sharingToday?.length ?? 0;
  const totalExec = totalExecutives ?? 0;
  const sharingRatePct = totalExec > 0 ? Math.round((sharingCount / totalExec) * 100) : 0;

  // Green Score
  const greenScore = (carpoolingRiffsWeek ?? []).reduce(
    (sum: number, r: { points: number }) => sum + r.points, 0
  );

  // Uso por rol
  const roleCount: Record<string, number> = {};
  for (const r of (reservationsByRole ?? []) as unknown as ReservationWithRole[]) {
    const role = r.profiles?.role ?? "unknown";
    roleCount[role] = (roleCount[role] ?? 0) + 1;
  }

  // Top Riffs esta semana
  const riffsByUser: Record<string, { name: string; role: string; total: number }> = {};
  for (const r of (topRiffs ?? []) as unknown as RiffsRow[]) {
    if (!riffsByUser[r.user_id]) {
      riffsByUser[r.user_id] = {
        name: r.profiles?.full_name ?? "—",
        role: r.profiles?.role ?? "—",
        total: 0,
      };
    }
    riffsByUser[r.user_id].total += r.points;
  }
  const topUsers = Object.entries(riffsByUser)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const showAlert = demandaInsatisfecha >= 3;

  // Adoption KPIs
  const uniqueHostsActive = new Set((hostActionsThisMonth ?? []).map((r: { user_id: string }) => r.user_id)).size;
  const hostAdoptionPct = (totalHosts ?? 0) > 0 ? Math.round((uniqueHostsActive / (totalHosts ?? 1)) * 100) : 0;
  const allGuestRes = [...(guestDeskResThisMonth ?? []), ...(guestParkingResThisMonth ?? [])];
  const uniqueGuestsReserved = new Set(allGuestRes.map((r: { user_id: string }) => r.user_id)).size;
  const guestAdoptionPct = (totalGuests ?? 0) > 0 ? Math.round((uniqueGuestsReserved / (totalGuests ?? 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dhl-dark">Dashboard</h1>
          <p className="text-sm text-dhl-gray mt-0.5">
            {now.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
            {" · "}
            <span className="text-green-600 font-semibold">● Live</span>
          </p>
        </div>
        <Link
          href="/admin/desks"
          className="bg-dhl-dark text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-dhl-dark/90 transition-colors"
        >
          Optimizar espacios ahora →
        </Link>
      </div>

      {/* Alert banner */}
      {showAlert && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <path d="M12 9v4"/><path d="M12 17h.01"/>
          </svg>
          <div>
            <p className="font-bold text-red-700 text-sm">
              Atención: La demanda insatisfecha ha subido un {Math.round((demandaInsatisfecha / Math.max(deskResCount, 1)) * 100)}% esta semana.
            </p>
            <p className="text-xs text-red-600 mt-0.5">¿Es hora de revisar la política de Co-Work?</p>
          </div>
        </div>
      )}

      {/* KPI Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-dhl-mid-gray p-5 shadow-sm">
          <p className="text-[11px] font-bold text-dhl-gray uppercase tracking-wide mb-1">Puestos hoy</p>
          <p className="text-4xl font-black text-dhl-dark">{deskOccupancyPct}%</p>
          <p className="text-xs text-dhl-gray mt-1">{deskResCount} / {totalDesksCount} desks</p>
          <div className="mt-3 h-1.5 bg-dhl-mid-gray rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${deskOccupancyPct >= 85 ? "bg-red-500" : deskOccupancyPct >= 65 ? "bg-amber-400" : "bg-green-500"}`}
              style={{ width: `${deskOccupancyPct}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-dhl-mid-gray p-5 shadow-sm">
          <p className="text-[11px] font-bold text-dhl-gray uppercase tracking-wide mb-1">Parking hoy</p>
          <p className="text-4xl font-black text-dhl-dark">{parkingOccupancyPct}%</p>
          <p className="text-xs text-dhl-gray mt-1">{parkingResCount} / {totalParkingCount} spots</p>
          <div className="mt-3 h-1.5 bg-dhl-mid-gray rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${parkingOccupancyPct >= 85 ? "bg-red-500" : parkingOccupancyPct >= 65 ? "bg-amber-400" : "bg-green-500"}`}
              style={{ width: `${parkingOccupancyPct}%` }}
            />
          </div>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm ${demandaInsatisfecha > 0 ? "bg-red-50 border-red-200" : "bg-white border-dhl-mid-gray"}`}>
          <p className="text-[11px] font-bold text-dhl-gray uppercase tracking-wide mb-1">Demanda insatisfecha</p>
          <p className={`text-4xl font-black ${demandaInsatisfecha > 0 ? "text-red-600" : "text-dhl-dark"}`}>
            😞 {demandaInsatisfecha}
          </p>
          <p className="text-xs text-dhl-gray mt-1">
            {desksFullCount > 0 && `${desksFullCount} oficina `}
            {parkingFullCount > 0 && `${parkingFullCount} parking`}
            {demandaInsatisfecha === 0 && "Sin capacidad agotada hoy"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-dhl-mid-gray p-5 shadow-sm">
          <p className="text-[11px] font-bold text-dhl-gray uppercase tracking-wide mb-1">Sharing Rate</p>
          <p className="text-4xl font-black text-dhl-dark">{sharingRatePct}%</p>
          <p className="text-xs text-dhl-gray mt-1">{sharingCount} / {totalExec} hosts</p>
          <div className="mt-3 h-1.5 bg-dhl-mid-gray rounded-full overflow-hidden">
            <div className="h-full bg-dhl-yellow rounded-full transition-all" style={{ width: `${sharingRatePct}%` }} />
          </div>
        </div>
      </div>

      {/* Adoption KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-dhl-mid-gray p-5 shadow-sm">
          <p className="text-[11px] font-bold text-dhl-gray uppercase tracking-wide mb-1">% Adopción Hosts (mes)</p>
          <p className="text-4xl font-black text-dhl-dark">{hostAdoptionPct}%</p>
          <p className="text-xs text-dhl-gray mt-1">{uniqueHostsActive} / {totalHosts ?? 0} hosts con al menos una acción</p>
          <div className="mt-3 h-1.5 bg-dhl-mid-gray rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${hostAdoptionPct >= 70 ? "bg-green-500" : hostAdoptionPct >= 40 ? "bg-amber-400" : "bg-red-500"}`}
              style={{ width: `${hostAdoptionPct}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-dhl-mid-gray p-5 shadow-sm">
          <p className="text-[11px] font-bold text-dhl-gray uppercase tracking-wide mb-1">% Adopción Visitas (mes)</p>
          <p className="text-4xl font-black text-dhl-dark">{guestAdoptionPct}%</p>
          <p className="text-xs text-dhl-gray mt-1">{uniqueGuestsReserved} / {totalGuests ?? 0} visitas reservaron al menos una vez</p>
          <div className="mt-3 h-1.5 bg-dhl-mid-gray rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${guestAdoptionPct >= 70 ? "bg-green-500" : guestAdoptionPct >= 40 ? "bg-amber-400" : "bg-red-500"}`}
              style={{ width: `${guestAdoptionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Green Score + Uso por Rol */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-dhl-dark rounded-2xl p-5 shadow-xl">
          <p className="text-dhl-yellow text-[11px] font-black uppercase tracking-widest">🌿 Green Score Semanal</p>
          <p className="text-5xl font-black text-white mt-3">{greenScore.toLocaleString("es-CL")}</p>
          <p className="text-white/50 text-sm mt-1">Riffs generados por carpooling esta semana</p>
          <p className="text-white/30 text-xs mt-2">Métrica de movilidad sostenible · w/c {weekStart}</p>
        </div>

        <div className="bg-white rounded-2xl border border-dhl-mid-gray p-5 shadow-sm">
          <p className="text-[11px] font-bold text-dhl-gray uppercase tracking-wide mb-4">Uso por perfil hoy</p>
          {deskResCount === 0 ? (
            <p className="text-sm text-dhl-gray/60 text-center py-6">Sin reservas aún</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(roleCount)
                .sort((a, b) => b[1] - a[1])
                .map(([role, count]) => {
                  const pct = Math.round((count / deskResCount) * 100);
                  return (
                    <div key={role}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold text-dhl-dark">{ROLE_LABELS[role] ?? role}</span>
                        <span className="text-dhl-gray">{count} personas · {pct}%</span>
                      </div>
                      <div className="h-2 bg-dhl-mid-gray rounded-full overflow-hidden">
                        <div className="h-full bg-dhl-yellow rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: "/admin/desks",     icon: "🗺️",  title: "Mapa Maestro",   desc: "Gestionar puestos" },
          { href: "/admin/incidents", icon: "⚠️",  title: "Incidentes",     desc: `${openIncidents ?? 0} abiertos` },
          { href: "/admin/rockstar",  icon: "🎸",  title: "Rockstar Path",  desc: "Leaderboard · ajustes" },
          { href: "/admin/reportes",  icon: "📊",  title: "Reportes",       desc: "Descarga histórica" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="bg-white rounded-2xl border border-dhl-mid-gray p-4 shadow-sm hover:border-dhl-yellow hover:shadow-md transition-all cursor-pointer">
              <span className="text-2xl block mb-2">{item.icon}</span>
              <p className="font-bold text-dhl-dark text-sm">{item.title}</p>
              <p className="text-xs text-dhl-gray mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent incidents */}
      <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-dhl-mid-gray">
          <h2 className="font-bold text-dhl-dark">Inbox de incidentes</h2>
          <Link href="/admin/incidents" className="text-xs text-dhl-gray hover:text-dhl-dark transition-colors">
            Ver todos →
          </Link>
        </div>
        {recentIncidents && recentIncidents.length > 0 ? (
          <div className="divide-y divide-dhl-mid-gray">
            {(recentIncidents as unknown as IncidentRow[]).map((inc) => (
              <div key={inc.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-dhl-dark">
                    {inc.location
                      ? `Puesto ${inc.location} reportado como "${CATEGORY_LABELS[inc.category] ?? inc.category}". Acción requerida.`
                      : `Reporte de ${CATEGORY_LABELS[inc.category] ?? inc.category}. Acción requerida.`}
                  </p>
                  <p className="text-xs text-dhl-gray mt-0.5">
                    {inc.profiles?.full_name} ·{" "}
                    {new Date(inc.created_at).toLocaleDateString("es-CL", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full flex-shrink-0">
                  Abierto
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-sm text-dhl-gray">Sin incidentes abiertos. Oficina en orden.</p>
          </div>
        )}
      </div>

      {/* Top Riffs */}
      {topUsers.length > 0 && (
        <div className="bg-white rounded-2xl border border-dhl-mid-gray shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-dhl-mid-gray">
            <h2 className="font-bold text-dhl-dark">🎸 Rockstar Path — Top esta semana</h2>
            <Link href="/admin/rockstar" className="text-xs text-dhl-gray hover:text-dhl-dark transition-colors">
              Ver ranking completo →
            </Link>
          </div>
          <div className="divide-y divide-dhl-mid-gray">
            {topUsers.map(([userId, data], i) => (
              <div key={userId} className="px-5 py-3.5 flex items-center gap-4">
                <span className={`text-sm font-black w-6 text-center ${i === 0 ? "text-dhl-yellow" : "text-dhl-gray/50"}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dhl-dark truncate">{data.name}</p>
                  <p className="text-xs text-dhl-gray">{ROLE_LABELS[data.role] ?? data.role}</p>
                </div>
                <span className="text-sm font-bold text-dhl-dark">{data.total.toLocaleString("es-CL")} Riffs</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
