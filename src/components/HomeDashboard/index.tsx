"use client";

import type { UserRole } from "@/types";
import ExecutiveHome from "./ExecutiveHome";
import ProfessionalHome from "./ProfessionalHome";
import GuestHome from "./GuestHome";

interface HomeDashboardProps {
  role: UserRole;
  firstName: string;
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

export default function HomeDashboard(props: HomeDashboardProps) {
  if (props.role === "executive") {
    return <ExecutiveHome {...props} />;
  }
  if (props.role === "professional" || props.role === "client") {
    return <ProfessionalHome {...props} />;
  }
  if (props.role === "guest") {
    return <GuestHome {...props} />;
  }

  // admin fallback — generic links
  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="text-xl font-bold text-dhl-dark">Panel Admin</h1>
      <p className="text-sm text-dhl-gray">Bienvenido, {props.firstName}.</p>
    </div>
  );
}
