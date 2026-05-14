import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWeekStart } from "@/lib/dateUtils";

// POST /api/desks/host-recover
// Host recupera su base. Si hay reserva de Guest activa:
//   - cancela esa reserva
//   - resta -50 Riffs al host
//   - envía push notification al guest (si tiene suscripción)
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Verify role
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  if (role !== "host") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekStart = getWeekStart(now);
  const rawDay = now.getDay();
  const dayOfWeek = rawDay === 0 ? 7 : rawDay;

  // Find host's assigned desk
  const { data: myDesk } = await admin
    .from("desks")
    .select("id")
    .eq("assigned_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!myDesk) {
    return NextResponse.json({ error: "No assigned desk found" }, { status: 404 });
  }

  // Check for active guest reservation on this desk today
  const { data: guestReservation } = await admin
    .from("desk_reservations")
    .select("id, user_id")
    .eq("desk_id", myDesk.id)
    .eq("date", today)
    .eq("status", "confirmed")
    .neq("user_id", user.id)
    .maybeSingle();

  // Clear solidarity_released in weekly_plans for today
  await admin
    .from("weekly_plans")
    .update({ solidarity_released: false, planned_status: "office" })
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .eq("day_of_week", dayOfWeek);

  const hadGuestReservation = !!guestReservation;

  if (guestReservation) {
    // Cancel guest reservation
    await admin
      .from("desk_reservations")
      .update({ status: "cancelled" })
      .eq("id", guestReservation.id);

    // Deduct -50 Riffs from host
    await admin.from("riffs_log").insert({
      user_id: user.id,
      action: "recover_base_penalty",
      points: -50,
      note: "Recuperó base con reserva activa de guest",
    });

    // Send push notification to displaced guest
    const { data: guestProfile } = await admin
      .from("profiles")
      .select("push_subscription, full_name")
      .eq("id", guestReservation.user_id)
      .single();

    if (guestProfile?.push_subscription) {
      try {
        const { webpush } = await import("@/lib/push/vapid");
        await webpush.sendNotification(
          guestProfile.push_subscription as Parameters<typeof webpush.sendNotification>[0],
          JSON.stringify({
            title: "Espacio cancelado",
            body: "Tu reserva de puesto fue cancelada. El titular recuperó su base. Revisa disponibilidad.",
          })
        );
      } catch {
        // Push failure is non-blocking
      }
    }
  }

  return NextResponse.json({ ok: true, hadGuestReservation, riffsPenalty: hadGuestReservation ? -50 : 0 });
}
