export type UserRole = "admin" | "client";
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
  | "director_reserved";
export type ReservationStatus = "confirmed" | "cancelled";
export type IncidentCategory =
  | "cleaning"
  | "supplies"
  | "maintenance"
  | "other";
export type IncidentStatus = "open" | "in_progress" | "resolved";

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
