"use client";

import type { UserRole } from "@/types";
import ExecutiveHome from "./ExecutiveHome";
import ProfessionalHome from "./ProfessionalHome";
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

  if (props.role === "executive") {
    return <>{weekend}<ExecutiveHome {...props} /></>;
  }
  if (props.role === "professional" || props.role === "client") {
    return <>{weekend}<ProfessionalHome {...props} /></>;
  }
  if (props.role === "guest") {
    return <>{weekend}<GuestHome {...props} /></>;
  }

  return (
    <div className="px-4 py-5 space-y-4">
      {weekend}
      <h1 className="text-xl font-bold text-dhl-dark">Panel Admin</h1>
      <p className="text-sm text-dhl-gray">Bienvenido, {props.firstName}.</p>
    </div>
  );
}
