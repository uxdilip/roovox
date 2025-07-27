export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  coordinates: [number, number];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "provider" | "admin";
  address: Address;
  created_at: string;
}

export interface WorkingHours {
  day: string;
  start: string;
  end: string;
}

export interface Provider {
  id: string;
  user_id: string;
  business_name: string;
  specializations: string[];
  service_radius: number;
  working_hours: WorkingHours[];
  ratings: number;
  total_bookings: number;
  verification_status: "pending" | "verified" | "rejected";
  documents: string[];
  commission_rate: number;
  subscription_tier: "basic" | "premium";
}

export interface CommonIssue {
  id: string;
  name: string;
  description: string;
  requires_parts: boolean;
  complexity: number;
  estimated_duration: number;
}

export interface Device {
  id: string;
  category: "phone" | "laptop";
  brand: string;
  model: string;
  specifications: Record<string, any>;
  common_issues: CommonIssue[];
  image_url?: string;
}

export interface PartQuality {
  tier: "oem" | "hq";
  price_multiplier: number;
  warranty_days: number;
}

export interface Service {
  id: string;
  device_id: string;
  name: string;
  description: string;
  base_price: number;
  part_qualities: PartQuality[];
}

export interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  device_id: string;
  service_id: string;
  issue_description: string;
  part_quality: "oem" | "hq";
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  appointment_time: string;
  total_amount: number;
  payment_status: "pending" | "completed" | "refunded";
  location_type: "doorstep" | "provider_location";
  customer_address: Address;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  attachment_url: string;
  read: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  payment_method: string;
  transaction_id: string;
  commission_amount: number;
  provider_payout: number;
  created_at: string;
}