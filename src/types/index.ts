export type UserRole = "admin" | "client";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  site_id: string;
  avatar_url?: string;
  push_subscription?: PushSubscription | null;
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
  floor?: string;
  zone?: string;
  is_active: boolean;
}

export interface ParkingSpot {
  id: string;
  site_id: string;
  code: string;
  type: "regular" | "accessible" | "motorcycle";
  is_active: boolean;
}

export interface Reservation {
  id: string;
  user_id: string;
  site_id: string;
  date: string;
  desk_id?: string | null;
  parking_spot_id?: string | null;
  status: "confirmed" | "cancelled";
  created_at: string;
}
