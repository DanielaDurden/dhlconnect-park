import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Best-effort DB update — result intentionally ignored
  await supabase
    .from("profiles")
    .update({ policy_accepted_at: new Date().toISOString() })
    .eq("id", user.id);

  // Cookie is authoritative — always set, always returns 200
  const response = NextResponse.json({ ok: true });
  response.cookies.set(`policy_accepted_${user.id}`, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return response;
}
