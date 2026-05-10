import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidDateString } from "@/lib/dateUtils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { desk_id, date } = await req.json();
  if (!desk_id || !date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (!isValidDateString(date)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

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

  // Explicit ownership check before mutating
  const { data: existing } = await admin
    .from("desk_reservations")
    .select("id, user_id")
    .eq("id", reservation_id)
    .maybeSingle();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }

  const { error } = await admin
    .from("desk_reservations")
    .update({ status: "cancelled" })
    .eq("id", reservation_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { desk_id, date, carpooling } = await req.json();
  if (!desk_id || !date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (!isValidDateString(date)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Atomic UPDATE — avoids race condition from SELECT→UPDATE/INSERT pattern.
  // If user owns a confirmed reservation for this desk+date, update it in one step.
  const { data: updated } = await admin
    .from("desk_reservations")
    .update({ checked_in: true, check_in_time: now, carpooling: carpooling ?? false })
    .eq("desk_id", desk_id)
    .eq("user_id", user.id)
    .eq("date", date)
    .eq("status", "confirmed")
    .select("id")
    .maybeSingle();

  if (!updated) {
    // No confirmed reservation found — walk-in check-in
    const { error } = await admin.from("desk_reservations").insert({
      desk_id,
      user_id: user.id,
      date,
      status: "confirmed",
      checked_in: true,
      check_in_time: now,
      carpooling: carpooling ?? false,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
