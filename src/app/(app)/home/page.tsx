import React from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

const MODULES = [
  {
    href: "/desks",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <rect width="18" height="18" x="3" y="3" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M9 21V9"/>
      </svg>
    ),
    title: "Mi Espacio",
    description: "Reserva y gestiona tu puesto de trabajo",
  },
  {
    href: "/parking",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10"/>
        <path d="M9 12h4a2 2 0 1 0 0-4H9v8"/>
      </svg>
    ),
    title: "Smart Parking",
    description: "Reserva tu estacionamiento disponible",
  },
  {
    href: "/status",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
        <line x1="16" x2="16" y1="2" y2="6"/>
        <line x1="8" x2="8" y1="2" y2="6"/>
        <line x1="3" x2="21" y1="10" y2="10"/>
      </svg>
    ),
    title: "Mi Estado",
    description: "Marca si vas a la oficina, site o home office",
  },
  {
    href: "/incidentes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <path d="M12 9v4"/>
        <path d="M12 17h.01"/>
      </svg>
    ),
    title: "Directo a Office Manager",
    description: "Reporta incidentes de limpieza o mantenimiento",
  },
];

type StatusKey = "office" | "site" | "home_office" | "vacation";

const STATUS_DISPLAY: Record<StatusKey, { label: string; icon: React.ReactNode; color: string }> = {
  office: {
    label: "En oficina",
    color: "text-green-600",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
        <path d="M9 22v-4h6v4"/>
        <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/>
        <path d="M12 10h.01"/><path d="M12 14h.01"/>
        <path d="M16 10h.01"/><path d="M16 14h.01"/>
        <path d="M8 10h.01"/><path d="M8 14h.01"/>
      </svg>
    ),
  },
  site: {
    label: "En site",
    color: "text-purple-600",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
      </svg>
    ),
  },
  home_office: {
    label: "Home Office",
    color: "text-blue-600",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  vacation: {
    label: "Vacaciones",
    color: "text-orange-500",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2"/><path d="M12 20v2"/>
        <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
        <path d="M2 12h2"/><path d="M20 12h2"/>
        <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
      </svg>
    ),
  },
};

function getDayName(date: Date): string {
  const str = date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().split("T")[0];

  const [
    { data: profile },
    { data: deskReservation },
    { data: parkingReservation },
    { data: myStatus },
  ] = await Promise.all([
    admin.from("profiles").select("full_name, area").eq("id", user!.id).single(),
    admin.from("desk_reservations").select("*, desks(code, area)").eq("user_id", user!.id).eq("date", today).eq("status", "confirmed").maybeSingle(),
    admin.from("parking_reservations").select("*, parking_spots(spot_number, level)").eq("user_id", user!.id).eq("date", today).eq("status", "confirmed").maybeSingle(),
    admin.from("user_day_status").select("status").eq("user_id", user!.id).eq("date", today).maybeSingle(),
  ]);

  const statusKey = myStatus?.status as StatusKey | undefined;
  const statusDisplay = statusKey ? STATUS_DISPLAY[statusKey] : null;

  return (
    <div className="px-4 py-5">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-[1.2rem] font-bold text-dhl-dark">
          ¡Hola{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}! ¿Listo para hoy?
        </h1>
        <p className="text-dhl-gray text-sm mt-0.5">
          {getDayName(new Date())}
        </p>
      </div>

      {/* Today's Summary Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4 mb-6">
        <h2 className="font-bold text-dhl-dark text-sm mb-3 uppercase tracking-wide">
          Hoy en la Oficina
        </h2>

        <div className="space-y-1">
          {/* Desk row */}
          <Link href="/desks" className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-dhl-light-gray transition-colors">
            {deskReservation ? (
              <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-dhl-mid-gray flex-shrink-0" aria-hidden="true" />
            )}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-dhl-gray flex-shrink-0" aria-hidden="true">
                <rect width="20" height="14" x="2" y="3" rx="2"/>
                <line x1="8" x2="16" y1="21" y2="21"/>
                <line x1="12" x2="12" y1="17" y2="21"/>
              </svg>
              <span className="text-sm text-dhl-gray">Puesto</span>
            </div>
            {deskReservation ? (
              <span className="text-sm font-semibold text-green-600">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(deskReservation as any).desks?.code}
              </span>
            ) : (
              <span className="text-sm text-dhl-gray/50">Sin reserva</span>
            )}
          </Link>

          {/* Parking row */}
          <Link href="/parking" className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-dhl-light-gray transition-colors">
            {parkingReservation ? (
              <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-dhl-mid-gray flex-shrink-0" aria-hidden="true" />
            )}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-dhl-gray flex-shrink-0" aria-hidden="true">
                <path d="M19 17H5v-6l2.5-6H16.5L19 11v6Z"/>
                <circle cx="7.5" cy="17.5" r="1.5"/>
                <circle cx="16.5" cy="17.5" r="1.5"/>
              </svg>
              <span className="text-sm text-dhl-gray">Parking</span>
            </div>
            {parkingReservation ? (
              <span className="text-sm font-semibold text-green-600">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                Esp. {(parkingReservation as any).parking_spots?.spot_number}
              </span>
            ) : (
              <span className="text-sm text-dhl-gray/50">Sin reserva</span>
            )}
          </Link>

          {/* Status row */}
          <Link href="/status" className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-dhl-light-gray transition-colors">
            {statusDisplay ? (
              <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-dhl-mid-gray flex-shrink-0" aria-hidden="true" />
            )}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-dhl-gray flex-shrink-0" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="text-sm text-dhl-gray">Mi estado</span>
            </div>
            {statusDisplay ? (
              <span className={`text-sm font-semibold flex items-center gap-1 ${statusDisplay.color}`}>
                {statusDisplay.icon}
                {statusDisplay.label}
              </span>
            ) : (
              <span className="text-sm text-dhl-gray/50">Sin marcar</span>
            )}
          </Link>
        </div>
      </div>

      {/* Module Cards */}
      <div className="space-y-3">
        {MODULES.map((mod) => (
          <Link key={mod.href} href={mod.href}>
            <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.99]">
              <div className="w-11 h-11 rounded-xl bg-dhl-yellow/20 flex items-center justify-center text-dhl-red flex-shrink-0">
                {mod.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-dhl-dark text-sm">{mod.title}</p>
                <p className="text-dhl-gray text-xs mt-0.5 leading-tight">
                  {mod.description}
                </p>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-dhl-mid-gray flex-shrink-0"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
