/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      .select("date, status, checked_in, carpooling, desks!inner(code, zone), profiles!inner(full_name, role, area)")
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
        check_in: r.checked_in ? "Sí" : "No",
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
    const { data } = await admin
      .from("weekly_plans")
      .select("week_start, user_id, solidarity_released, profiles!inner(full_name, role)")
      .in("profiles.role", ["host", "executive"])
      .gte("week_start", from)
      .lte("week_start", to)
      .order("week_start");

    filename = `adopcion_hosts_${from}_${to}.csv`;
    csv = toCsv(
      (data ?? []).map((r: any) => ({
        semana: r.week_start,
        colaborador: r.profiles?.full_name ?? "",
        perfil: r.profiles?.role ?? "",
        libero_espacio: r.solidarity_released ? "Sí" : "No",
      }))
    );
  } else if (type === "adopcion_guests") {
    const { data } = await admin
      .from("desk_reservations")
      .select("date, status, profiles!inner(full_name, role)")
      .eq("profiles.role", "guest")
      .gte("date", from)
      .lte("date", to)
      .order("date");

    filename = `adopcion_guests_${from}_${to}.csv`;
    csv = toCsv(
      (data ?? []).map((r: any) => ({
        fecha: r.date,
        colaborador: r.profiles?.full_name ?? "",
        estado_reserva: r.status,
      }))
    );
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
