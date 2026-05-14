export type UserRole = "admin" | "executive" | "professional" | "guest" | "client" | "host";
export type UserArea =
  | "FIN"
  | "OE"
  | "SD"
  | "BD"
  | "Legal"
  | "MKT"
  | "IT"
  | "HR"
  | "Ops"
  | "KAM"
  | "GG"
  | "Co-Work";

export type DayStatus = "office" | "site" | "home_office" | "vacation";
export type DeskType = "fixed" | "shared" | "cowork" | "office" | "meeting";
export type DeskZone = "A" | "B" | "C" | "GG" | "Office";
export type ParkingLevel = "street" | "minus2";
export type ParkingSpotStatus =
  | "available"
  | "fixed"
  | "blocked"
  | "director_reserved"
  | "high_frequency";
export type ReservationStatus = "confirmed" | "cancelled";
export type IncidentCategory =
  | "cleaning"
  | "supplies"
  | "maintenance"
  | "other";
export type IncidentStatus = "open" | "in_progress" | "resolved";

// Riffs gamification — v3 simplified actions
export type RiffsAction =
  | "solidarity_release"    // +50 — legacy alias (kept for existing data)
  | "voluntary_release"     // +50 — host libera su espacio voluntariamente
  | "checkin_carpooling"    // +30 — legacy alias
  | "carpool"               // +30 — host confirma que viene en carpool
  | "early_checkout"        // +20 — legacy
  | "checkin_ontime"        // +10 — legacy
  | "recover_base_penalty"  // -50 — host recupera base con reserva activa de guest
  | "manual_adjustment";    // variable — ajuste manual del admin

export type RiffsLevel = "Opening Act" | "Rising Star" | "Headliner" | "Rock Legend";

export interface RiffsLog {
  id: string;
  user_id: string;
  action: RiffsAction;
  points: number;
  ref_id?: string | null;
  note?: string | null;
  created_at: string;
}

export function getRiffsLevel(total: number): { level: RiffsLevel; next: number; progress: number } {
  if (total >= 8000) return { level: "Rock Legend", next: 8000, progress: 100 };
  if (total >= 3000) return { level: "Headliner",  next: 8000, progress: Math.round((total / 8000) * 100) };
  if (total >= 1000) return { level: "Rising Star", next: 3000, progress: Math.round((total / 3000) * 100) };
  return { level: "Opening Act", next: 1000, progress: Math.round((total / 1000) * 100) };
}

export const RIFFS_POINTS: Record<RiffsAction, number> = {
  solidarity_release:    50,
  voluntary_release:     50,
  checkin_carpooling:    30,
  carpool:               30,
  early_checkout:        20,
  checkin_ontime:        10,
  recover_base_penalty: -50,
  manual_adjustment:      0, // override per request
};

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  area: UserArea | null;
  status_type: "base" | "visiting";
  avatar_url?: string;
  policy_accepted_at: string | null;
  push_subscription?: object | null;
  riffs_total?: number;
  created_at: string;
}

export interface Site {
  id: string;
  name: string;
  address?: string;
  created_at: string;
}

export interface Desk {
  id: string;
  site_id: string;
  code: string;
  zone: DeskZone;
  type: DeskType;
  area: string | null;
  assigned_user_id: string | null;
  grid_row: number;
  grid_col: number;
  is_active: boolean;
}

export interface DeskWithStatus extends Desk {
  reservation?: DeskReservation | null;
  assigned_profile?: Pick<Profile, "id" | "full_name" | "area"> | null;
  owner_day_status?: DayStatus | null;
}

export interface DeskReservation {
  id: string;
  desk_id: string;
  user_id: string;
  date: string;
  checked_in: boolean;
  check_in_time?: string | null;
  carpooling?: boolean;
  status: ReservationStatus;
  created_at: string;
  profile?: Pick<Profile, "full_name" | "area">;
}

export interface UserDayStatus {
  id: string;
  user_id: string;
  date: string;
  status: DayStatus;
  created_at: string;
}

export interface AreaDeskSchedule {
  id: string;
  area: UserArea;
  day_of_week: number; // 1=Mon, 5=Fri
  desk_count: number;
}

export interface ParkingSpot {
  id: string;
  spot_number: number;
  level: ParkingLevel;
  spot_status: ParkingSpotStatus;
  assigned_user_name: string | null;
  director_name: string | null;
  is_accessible: boolean;
  is_active: boolean;
}

export interface ParkingSpotWithReservation extends ParkingSpot {
  reservation?: ParkingReservation | null;
}

export interface ParkingReservation {
  id: string;
  spot_id: string;
  user_id: string;
  date: string;
  carpooling?: boolean;
  status: ReservationStatus;
  created_at: string;
  profile?: Pick<Profile, "full_name">;
}

export interface Incident {
  id: string;
  user_id: string;
  category: IncidentCategory;
  description: string;
  location: string | null;
  status: IncidentStatus;
  resolution_comment?: string | null;
  resolved_at?: string | null;
  created_at: string;
  profile?: Pick<Profile, "full_name">;
}

export interface OwnerRequest {
  id: string;
  requester_id: string;
  owner_id: string;
  desk_id: string;
  date: string;
  status: "pending" | "approved" | "denied";
  created_at: string;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  week_start: string; // YYYY-MM-DD Monday
  day_of_week: number; // 1–5
  planned_status: DayStatus;
  solidarity_released: boolean;
  created_at: string;
}
