"use client";

import type { UserRole } from "@/types";
import ExecutiveCard from "./ExecutiveCard";
import ProfessionalCard from "./ProfessionalCard";
import GuestCard from "./GuestCard";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface DailyCardProps {
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
  weeklyPlanToday: {
    id: string;
    planned_status: string;
    solidarity_released: boolean;
  } | null;
  availableDesksCount: number;
  totalRiffs: number;
  riffsLevel: string;
  riffsProgress: number;
  riffsNext: number;
  solidarityCount: number;
  parkingResToday: {
    id: string;
    spotNumber?: number;
    level?: string;
  } | null;
}

export default function DailyCard(props: DailyCardProps) {
  const router = useRouter();

  function onComplete() {
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-dhl-light-gray flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-6">
        <Image src="/dhl-logo.svg" alt="DHL" width={64} height={9} priority />
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-8">
        {props.role === "executive" && (
          <ExecutiveCard
            firstName={props.firstName}
            onComplete={onComplete}
          />
        )}
        {props.role === "professional" && (
          <ProfessionalCard
            firstName={props.firstName}
            deskCode={props.deskCode}
            reservation={props.deskReservationToday}
            onComplete={onComplete}
          />
        )}
        {(props.role === "guest" || props.role === "client") && (
          <GuestCard
            firstName={props.firstName}
            availableDesksCount={props.availableDesksCount}
          />
        )}
        {props.role === "admin" && null}
      </div>
    </div>
  );
}
