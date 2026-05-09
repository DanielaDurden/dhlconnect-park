import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DayStatus } from "@/types";

// GET /api/planner?week_start=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const week_start = req.nextUrl.searchParams.get("week_start");
  if (!week_start) return NextResponse.json({ error: "week_start required" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("weekly_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", week_start);

  return NextResponse.json({ plans: data ?? [] });
}

// POST /api/planner — upsert a weekly plan entry
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    week_start: string;
    day_of_week: number;
    planned_status: DayStatus;
    solidarity_released?: boolean;
  };

  if (!body.week_start || !body.day_of_week || !body.planned_status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("weekly_plans")
    .upsert({
      user_id: user.id,
      week_start: body.week_start,
      day_of_week: body.day_of_week,
      planned_status: body.planned_status,
      solidarity_released: body.solidarity_released ?? false,
    }, { onConflict: "user_id,week_start,day_of_week" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award riffs if solidarity release
  if (body.solidarity_released) {
    await admin.from("riffs_log").insert({
      user_id: user.id,
      action: "solidarity_release",
      points: 50,
      ref_id: data.id,
    });
  }

  return NextResponse.json({ ok: true, plan: data });
}
