/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getMonthRange(from: string, to: string): string[] {
  const months: string[] = [];
  const current = new Date(from.slice(0, 7) + "-01T12:00:00");
  const end = new Date(to.slice(0, 7) + "-01T12:00:00");
  while (current <= end) {
    months.push(current.toISOString().slice(0, 7));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

function toCsv(rows: Record<string, string | number | boolean | null>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    ),
  ];
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type") ?? "ocupacion";

  if (!from || !to) return new NextResponse("Missing from/to", { status: 400 });

  const toEnd = `${to}T23:59:59`;

  let csv = "";
  let filename = "";

  if (type === "ocupacion") {
    const { data } = await admin
      .from("desk_reservations")
      .select("date, status, carpooling, desks!inner(code, zone), profiles!inner(full_name, role, area)")
      .gte("date", from)
      .lte("date", to)
      .order("date");

    filename = `ocupacion_${from}_${to}.csv`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    csv = toCsv(
      (data ?? []).map((r: any) => ({
        fecha: r.date,
        puesto: r.desks?.code ?? "",
        zona: r.desks?.zone ?? "",
        colaborador: r.profiles?.full_name ?? "",
        perfil: r.profiles?.role ?? "",
        area: r.profiles?.area ?? "",
        estado: r.status,
        carpooling: r.carpooling ? "Sí" : "No",
      }))
    );
  } else if (type === "incidentes") {
    const { data } = await admin
      .from("incidents")
      .select("created_at, category, description, location, status, profiles!inner(full_name)")
      .gte("created_at", from)
      .lte("created_at", toEnd)
      .order("created_at");

    filename = `incidentes_${from}_${to}.csv`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    csv = toCsv(
      (data ?? []).map((r: any) => ({
        fecha: new Date(r.created_at).toLocaleDateString("es-CL"),
        hora: new Date(r.created_at).toLocaleTimeString("es-CL"),
        categoria: r.category,
        descripcion: r.description,
        ubicacion: r.location ?? "",
        estado: r.status,
        reportado_por: r.profiles?.full_name ?? "",
      }))
    );
  } else if (type === "riffs") {
    const { data } = await admin
      .from("riffs_log")
      .select("created_at, action, points, profiles!inner(full_name, role)")
      .gte("created_at", from)
      .lte("created_at", toEnd)
      .order("created_at");

    filename = `riffs_${from}_${to}.csv`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    csv = toCsv(
      (data ?? []).map((r: any) => ({
        fecha: new Date(r.created_at).toLocaleDateString("es-CL"),
        colaborador: r.profiles?.full_name ?? "",
        perfil: r.profiles?.role ?? "",
        accion: r.action,
        puntos: r.points,
      }))
    );
  } else if (type === "demanda") {
    const { data } = await admin
      .from("worst_case_log")
      .select("date, type, created_at, profiles!inner(full_name, role)")
      .gte("date", from)
      .lte("date", to)
      .order("date");

    filename = `demanda_insatisfecha_${from}_${to}.csv`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    csv = toCsv(
      (data ?? []).map((r: any) => ({
        fecha: r.date,
        tipo: r.type,
        hora: new Date(r.created_at).toLocaleTimeString("es-CL"),
        colaborador: r.profiles?.full_name ?? "",
        perfil: r.profiles?.role ?? "",
      }))
    );
  } else if (type === "adopcion_hosts") {
    // Fuente: riffs_log — una acción = voluntary/solidarity release, carpool, o recover_base_penalty
    const [{ data: hostProfiles }, { data: hostActions }] = await Promise.all([
      admin.from("profiles").select("id, full_name").in("role", ["host", "executive"]),
      admin.from("riffs_log")
        .select("user_id, action, created_at")
        .in("action", ["voluntary_release", "solidarity_release", "carpool", "checkin_carpooling", "recover_base_penalty"])
        .gte("created_at", from)
        .lte("created_at", toEnd),
    ]);

    const hosts = (hostProfiles ?? []) as { id: string; full_name: string }[];
    const actionsPerUserMonth: Record<string, Record<string, number>> = {};
    for (const a of (hostActions ?? []) as any[]) {
      const month = (a.created_at as string).slice(0, 7);
      if (!actionsPerUserMonth[a.user_id]) actionsPerUserMonth[a.user_id] = {};
      actionsPerUserMonth[a.user_id][month] = (actionsPerUserMonth[a.user_id][month] ?? 0) + 1;
    }

    const months = getMonthRange(from, to);
    const rows: Record<string, string | number | null>[] = [];
    for (const month of months) {
      for (const host of hosts) {
        const count = actionsPerUserMonth[host.id]?.[month] ?? 0;
        rows.push({ mes: month, colaborador: host.full_name, acciones: count, activo: count > 0 ? "Sí" : "No" });
      }
      const active = hosts.filter((h) => (actionsPerUserMonth[h.id]?.[month] ?? 0) > 0).length;
      const pct = hosts.length > 0 ? Math.round((active / hosts.length) * 100) : 0;
      rows.push({ mes: month, colaborador: "--- RESUMEN MES ---", acciones: active, activo: `${active}/${hosts.length} (${pct}%)` });
    }

    filename = `adopcion_hosts_${from}_${to}.csv`;
    csv = toCsv(rows);
  } else if (type === "adopcion_guests") {
    // Fuente: desk_reservations + parking_reservations para guests
    const [{ data: guestProfiles }, { data: deskRes }, { data: parkingRes }] = await Promise.all([
      admin.from("profiles").select("id, full_name").eq("role", "guest"),
      admin.from("desk_reservations").select("user_id, date").eq("status", "confirmed").gte("date", from).lte("date", to),
      admin.from("parking_reservations").select("user_id, date").eq("status", "confirmed").gte("date", from).lte("date", to),
    ]);

    const guests = (guestProfiles ?? []) as { id: string; full_name: string }[];
    const allRes = [...(deskRes ?? []), ...(parkingRes ?? [])] as { user_id: string; date: string }[];
    const resPerUserMonth: Record<string, Record<string, number>> = {};
    for (const r of allRes) {
      const month = r.date.slice(0, 7);
      if (!resPerUserMonth[r.user_id]) resPerUserMonth[r.user_id] = {};
      resPerUserMonth[r.user_id][month] = (resPerUserMonth[r.user_id][month] ?? 0) + 1;
    }

    const months = getMonthRange(from, to);
    const rows: Record<string, string | number | null>[] = [];
    for (const month of months) {
      for (const guest of guests) {
        const count = resPerUserMonth[guest.id]?.[month] ?? 0;
        rows.push({ mes: month, colaborador: guest.full_name, reservas: count, activo: count > 0 ? "Sí" : "No" });
      }
      const active = guests.filter((g) => (resPerUserMonth[g.id]?.[month] ?? 0) > 0).length;
      const pct = guests.length > 0 ? Math.round((active / guests.length) * 100) : 0;
      rows.push({ mes: month, colaborador: "--- RESUMEN MES ---", reservas: active, activo: `${active}/${guests.length} (${pct}%)` });
    }

    filename = `adopcion_guests_${from}_${to}.csv`;
    csv = toCsv(rows);
  } else {
    return new NextResponse("Invalid type", { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
