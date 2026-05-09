import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RIFFS_POINTS, type RiffsAction } from "@/types";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const action = body.action as RiffsAction;
  const ref_id = body.ref_id as string | undefined;

  if (!action || !(action in RIFFS_POINTS)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const points = RIFFS_POINTS[action];
  const admin = createAdminClient();

  const { error } = await admin.from("riffs_log").insert({
    user_id: user.id,
    action,
    points,
    ref_id: ref_id ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, points });
}
