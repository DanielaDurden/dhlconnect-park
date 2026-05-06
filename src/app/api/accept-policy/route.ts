import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try DB update — non-blocking, may fail if column not yet in prod
  await supabase
    .from("profiles")
    .update({ policy_accepted_at: new Date().toISOString() })
    .eq("id", user.id)
    .then(() => {})
    .catch(() => {});

  // Cookie is the authoritative source — always succeeds
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
