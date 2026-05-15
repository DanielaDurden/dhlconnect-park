import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH /api/admin/user-parking — toggle has_parking for a host profile
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: caller } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (caller?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user_id, has_parking } = await req.json() as { user_id: string; has_parking: boolean };
  if (!user_id || typeof has_parking !== "boolean") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ has_parking })
    .eq("id", user_id)
    .in("role", ["host", "executive"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
