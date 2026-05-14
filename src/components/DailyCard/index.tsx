"use client";

import type { UserRole } from "@/types";
import HostCard from "./HostCard";
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

  const greeting = "¡Hola!";

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#FFCD05]/30 via-white to-white flex flex-col items-center justify-center px-5 py-10">
      <div className="mb-8">
        <Image src="/dhl-logo.svg" alt="DHL" width={64} height={9} priority />
      </div>

      <p className="text-xs font-semibold text-dhl-gray/60 uppercase tracking-widest mb-4">{greeting}</p>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
        {props.role === "host" && (
          <HostCard firstName={props.firstName} onComplete={onComplete} />
        )}
        {(props.role === "guest" || props.role === "client") && (
          <GuestCard firstName={props.firstName} availableDesksCount={props.availableDesksCount} />
        )}
      </div>
    </div>
  );
}
