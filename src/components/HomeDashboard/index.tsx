"use client";

import type { UserRole } from "@/types";
import HostHome from "./HostHome";
import GuestHome from "./GuestHome";

interface HomeDashboardProps {
  role: UserRole;
  firstName: string;
  isWeekend?: boolean;
  deskCode?: string;
  reservationId?: string;
  deskReservationToday: {
    id: string;
    desk_id: string;
    checked_in: boolean;
    carpooling: boolean;
    status: string;
  } | null;
  parkingResToday: {
    id: string;
    spotNumber?: number;
    level?: string;
  } | null;
  weeklyPlanToday: {
    id: string;
    planned_status: string;
    solidarity_released: boolean;
  } | null;
  totalRiffs: number;
  riffsLevel: string;
  riffsProgress: number;
  riffsNext: number;
  solidarityCount: number;
  availableDesksCount: number;
  weeklyPlansWeek: { day_of_week: number; planned_status: string; solidarity_released: boolean }[];
  guestReservationOnMyDesk?: { id: string } | null;
}

function WeekendBanner({ firstName }: { firstName: string }) {
  return (
    <div className="mx-4 mt-5 bg-gradient-to-br from-dhl-yellow/40 to-dhl-yellow/10 border border-dhl-yellow rounded-3xl px-5 py-6 text-center mb-1">
      <p className="text-4xl mb-3">🌴</p>
      <p className="text-xl font-black text-dhl-dark">¡Disfruta el fin de semana, {firstName}!</p>
      <p className="text-sm text-dhl-gray mt-2 leading-relaxed">
        Recarga energía — el lunes la oficina te espera.
      </p>
    </div>
  );
}

export default function HomeDashboard(props: HomeDashboardProps) {
  const weekend = props.isWeekend ? <WeekendBanner firstName={props.firstName} /> : null;

  if (props.role === "host" || props.role === "executive") {
    return <>{weekend}<HostHome
      firstName={props.firstName}
      isWeekend={props.isWeekend}
      weeklyPlanToday={props.weeklyPlanToday}
      weeklyPlansWeek={props.weeklyPlansWeek}
      totalRiffs={props.totalRiffs}
      riffsLevel={props.riffsLevel}
      riffsProgress={props.riffsProgress}
      riffsNext={props.riffsNext}
      solidarityCount={props.solidarityCount}
      guestReservationOnMyDesk={props.guestReservationOnMyDesk ?? null}
    /></>;
  }

  if (props.role === "guest" || props.role === "client" || props.role === "professional") {
    return <>{weekend}<GuestHome {...props} /></>;
  }

  return <>{weekend}<GuestHome {...props} /></>;
}
