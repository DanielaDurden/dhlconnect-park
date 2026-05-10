import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { desk_id, user_id, date } = await req.json() as {
    desk_id: string;
    user_id: string;
    date: string;
  };

  if (!desk_id || !user_id || !date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Cancel any existing reservation for this user on this date
  await admin
    .from("desk_reservations")
    .update({ status: "cancelled" })
    .eq("user_id", user_id)
    .eq("date", date)
    .eq("status", "confirmed");

  const { error } = await admin.from("desk_reservations").insert({
    desk_id,
    user_id,
    date,
    checked_in: false,
    carpooling: false,
    status: "confirmed",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
