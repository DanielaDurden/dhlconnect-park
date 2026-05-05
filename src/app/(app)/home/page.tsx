import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const MODULES = [
  {
    href: "/desks",
    emoji: "🖥️",
    title: "Mi Espacio",
    description: "Reserva y gestiona tu puesto de trabajo",
    color: "border-l-blue-500",
    bg: "bg-blue-50",
  },
  {
    href: "/parking",
    emoji: "🚗",
    title: "Smart Parking",
    description: "Reserva tu estacionamiento disponible",
    color: "border-l-green-500",
    bg: "bg-green-50",
  },
  {
    href: "/status",
    emoji: "📅",
    title: "Mi Estado",
    description: "Marca si vas a la oficina, site o home office",
    color: "border-l-dhl-yellow",
    bg: "bg-yellow-50",
  },
  {
    href: "/incidentes",
    emoji: "🔧",
    title: "Directo a Office Manager",
    description: "Reporta incidentes de limpieza o mantenimiento",
    color: "border-l-orange-500",
    bg: "bg-orange-50",
  },
];

function getDayName(date: Date): string {
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, area")
    .eq("id", user!.id)
    .single();

  const today = new Date().toISOString().split("T")[0];

  // User's reservation today
  const { data: deskReservation } = await supabase
    .from("desk_reservations")
    .select("*, desks(code, area)")
    .eq("user_id", user!.id)
    .eq("date", today)
    .eq("status", "confirmed")
    .maybeSingle();

  const { data: parkingReservation } = await supabase
    .from("parking_reservations")
    .select("*, parking_spots(spot_number, level)")
    .eq("user_id", user!.id)
    .eq("date", today)
    .eq("status", "confirmed")
    .maybeSingle();

  const { data: myStatus } = await supabase
    .from("user_day_status")
    .select("status")
    .eq("user_id", user!.id)
    .eq("date", today)
    .maybeSingle();

  const firstName = profile?.full_name?.split(" ")[0] ?? "Colaborador";

  return (
    <div className="px-4 py-5">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dhl-dark">
          Hola, {firstName} 👋
        </h1>
        <p className="text-dhl-gray text-sm capitalize mt-0.5">
          {getDayName(new Date())}
        </p>
      </div>

      {/* Today's Summary Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4 mb-6">
        <h2 className="font-bold text-dhl-dark text-sm mb-3 uppercase tracking-wide">
          Hoy en CE
        </h2>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-dhl-gray">
              <span>🖥️</span>
              <span>Puesto</span>
            </div>
            {deskReservation ? (
              <span className="text-sm font-semibold text-green-600">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                Desk {(deskReservation as any).desks?.code}
              </span>
            ) : (
              <Link href="/desks" className="text-sm text-dhl-red font-semibold">
                Reservar →
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-dhl-gray">
              <span>🚗</span>
              <span>Parking</span>
            </div>
            {parkingReservation ? (
              <span className="text-sm font-semibold text-green-600">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                Esp. {(parkingReservation as any).parking_spots?.spot_number}
              </span>
            ) : (
              <Link href="/parking" className="text-sm text-dhl-red font-semibold">
                Reservar →
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-dhl-gray">
              <span>📍</span>
              <span>Mi estado</span>
            </div>
            {myStatus ? (
              <span className="text-sm font-semibold text-dhl-dark capitalize">
                {myStatus.status === "office"
                  ? "🏢 En oficina"
                  : myStatus.status === "site"
                  ? "🏭 En site"
                  : myStatus.status === "home_office"
                  ? "🏠 Home Office"
                  : "🏖️ Vacaciones"}
              </span>
            ) : (
              <Link href="/status" className="text-sm text-dhl-red font-semibold">
                Marcar →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="space-y-3">
        {MODULES.map((mod) => (
          <Link key={mod.href} href={mod.href}>
            <div
              className={`bg-white rounded-2xl shadow-sm border-l-4 ${mod.color} p-4 flex items-center gap-4 hover:shadow-md transition-shadow`}
            >
              <div className={`w-12 h-12 rounded-xl ${mod.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
                {mod.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-dhl-dark text-sm">{mod.title}</p>
                <p className="text-dhl-gray text-xs mt-0.5 leading-tight">
                  {mod.description}
                </p>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-dhl-mid-gray flex-shrink-0"
              >
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
