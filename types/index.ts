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

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export type PaymentMethod = "online" | "cod";

export interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  device_id: string;
  service_id: string;
  status: BookingStatus;
  payment_method: PaymentMethod;
  payment_status: "pending" | "completed" | "refunded" | "cancelled";
  appointment_time: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  // ...other fields as needed (these were already there or added previously)
  issue_description: string;
  selected_issues: string; // Now explicitly a string to be parsed
  part_quality: string | null; // Can be null
  location_type: string;
  customer_address: string; // Now explicitly a string to be parsed
  rating: number | null; // Can be null
  review: string | null; // Can be null
  warranty: string;
  serviceMode: string;
  cancellation_reason?: string; // Added for decline reasons
  provider?: {
    name: string;
    rating: number;
    totalReviews: number; // Added for provider average rating
    avatar?: string;
  };
  device?: {
    brand: string;
    model: string;
    image_url?: string;
  };
  payment?: {
    payment_method: string;
    status: string;
  };
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