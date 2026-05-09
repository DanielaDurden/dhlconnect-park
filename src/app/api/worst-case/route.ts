import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/worst-case — log a worst-case scenario for KPI tracking
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await req.json() as { type: "parking_full" | "desks_full" };
  if (!type || !["parking_full", "desks_full"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  await admin.from("worst_case_log").insert({ user_id: user.id, type, date: today });

  return NextResponse.json({ ok: true });
}
