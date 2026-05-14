import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status, resolution_comment } = await req.json() as { status: string; resolution_comment?: string };

  if (!["open", "in_progress", "resolved"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (status === "resolved" && !resolution_comment?.trim()) {
    return NextResponse.json({ error: "Resolution comment required" }, { status: 400 });
  }

  const update: Record<string, unknown> = { status };
  if (status === "resolved") {
    update.resolution_comment = resolution_comment!.trim();
    update.resolved_at = new Date().toISOString();
  }

  const { error } = await admin.from("incidents").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
