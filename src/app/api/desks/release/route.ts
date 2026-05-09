import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/desks/release — professional early checkout (+20 Riffs) or solidarity release (+50)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reservation_id, solidarity } = await req.json();
  if (!reservation_id) return NextResponse.json({ error: "Missing reservation_id" }, { status: 400 });

  const admin = createAdminClient();

  // Verify ownership
  const { data: res } = await admin
    .from("desk_reservations")
    .select("id, user_id, desk_id, date")
    .eq("id", reservation_id)
    .single();

  if (!res || res.user_id !== user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }

  // Cancel the reservation
  const { error } = await admin
    .from("desk_reservations")
    .update({ status: "cancelled" })
    .eq("id", reservation_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award Riffs
  const action = solidarity ? "solidarity_release" : "early_checkout";
  const points = solidarity ? 50 : 20;

  await admin.from("riffs_log").insert({
    user_id: user.id,
    action,
    points,
    ref_id: reservation_id,
  });

  return NextResponse.json({ ok: true, action, points });
}
