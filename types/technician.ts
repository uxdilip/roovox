export interface Technician {
  id: string;
  user_id: string;
  profile_photo: string;
  business_name: string;
  first_name: string;
  last_name: string;
  specializations: string[];
  certifications: string[];
  overall_rating: number;
  total_reviews: number;
  completed_orders: number;
  response_time_avg: number; // in minutes
  experience_years: number;
  service_radius: number;
  current_location: {
    lat: number;
    lng: number;
  };
  availability_status: 'available' | 'busy' | 'offline';
  working_hours: {
    day: string;
    start: string;
    end: string;
    available: boolean;
  }[];
  pricing: {
    base_rate: number;
    emergency_rate: number;
    travel_fee: number;
  };
  verification_status: 'verified' | 'pending' | 'rejected';
  badges: string[];
  reviews_summary: {
    recent_reviews: TechnicianReview[];
    rating_breakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  distance_from_customer?: number;
  estimated_arrival?: number;
}

export interface TechnicianReview {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  service_type: string;
  created_at: string;
}

export interface PartInspectionRequest {
  id: string;
  device_info: {
    brand: string;
    model: string;
    issue_description: string;
  };
  part_details: {
    part_type: string;
    quality_preference: 'basic' | 'standard' | 'premium';
    specific_requirements: string;
  };
  inspection_requirements: {
    on_site_inspection: boolean;
    photo_documentation: boolean;
    warranty_verification: boolean;
    compatibility_check: boolean;
  };
  uploaded_documents: string[];
  customer_location: {
    lat: number;
    lng: number;
    address: string;
  };
  urgency: 'immediate' | 'same_day' | 'scheduled';
  budget_range: {
    min: number;
    max: number;
  };
}

export interface TechnicianFilters {
  distance_radius: number;
  min_rating: number;
  max_price: number;
  experience_level: 'beginner' | 'intermediate' | 'expert' | 'any';
  availability: 'immediate' | 'today' | 'this_week' | 'any';
  specializations: string[];
  certifications: string[];
}

export interface BookingConfirmation {
  id: string;
  technician: Technician;
  appointment_time: string;
  service_type: 'immediate' | 'scheduled';
  estimated_arrival: string;
  total_cost: number;
  tracking_code: string;
  chat_room_id: string;
}