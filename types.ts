
export enum ClubStatus {
  UNCLAIMED = 'unclaimed',
  CLAIMED = 'claimed'
}

export enum PricingPlan {
  FREE = 'free',
  FEATURED = 'featured',
  PARTNER = 'partner'
}

export interface Club {
  id: string;
  name: string;
  categories: string[];
  street_address: string;
  full_address: string;
  city: string;
  region: string | null;
  postcode: string | null;
  country: string;
  country_code: string;
  phone: string | null;
  website: string | null;
  maps_url: string | null;
  booking_url: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  rating_count: number | null;
  opening_hours_raw: string | null;
  image_url: string | null;
  slug: string;
  status: ClubStatus;
  owner_user_id: string | null;
  is_featured: boolean;
  plan: PricingPlan;
}

export interface Lead {
  id: string;
  club_id: string;
  name: string;
  email: string;
  message: string;
  created_at: number;
}

export type AnalyticsEventType = 'view' | 'booking_click' | 'lead_submitted';

export interface AnalyticsEvent {
  id: string;
  club_id: string;
  type: AnalyticsEventType;
  created_at: number;
}

export interface CitySummary {
  name: string;
  slug: string;
  count: number;
}
