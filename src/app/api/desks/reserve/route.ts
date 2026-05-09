import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { desk_id, date } = await req.json();
  if (!desk_id || !date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("desk_reservations").insert({
    desk_id,
    user_id: user.id,
    date,
    status: "confirmed",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reservation_id } = await req.json();
  if (!reservation_id) return NextResponse.json({ error: "Missing reservation_id" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("desk_reservations")
    .update({ status: "cancelled" })
    .eq("id", reservation_id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { desk_id, date, carpooling } = await req.json();
  if (!desk_id || !date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = createAdminClient();

  // Try to update existing reservation first (check-in)
  const { data: existing } = await admin
    .from("desk_reservations")
    .select("id")
    .eq("desk_id", desk_id)
    .eq("user_id", user.id)
    .eq("date", date)
    .eq("status", "confirmed")
    .maybeSingle();

  if (existing) {
    const { error } = await admin.from("desk_reservations").update({
      checked_in: true,
      check_in_time: new Date().toISOString(),
      carpooling: carpooling ?? false,
    }).eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Create new confirmed+checked_in reservation
    const { error } = await admin.from("desk_reservations").insert({
      desk_id,
      user_id: user.id,
      date,
      status: "confirmed",
      checked_in: true,
      check_in_time: new Date().toISOString(),
      carpooling: carpooling ?? false,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
