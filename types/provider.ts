export interface ProviderProfile {
    id: string;
    user_id: string;
    business_name: string;
    business_description: string;
    business_photos: string[];
    service_area: {
      center: {
        lat: number;
        lng: number;
      };
      radius: number; // in miles
    };
    working_hours: {
      day: string;
      start: string;
      end: string;
      available: boolean;
    }[];
    specializations: string[];
    supported_brands: {
      brand: string;
      models: {
        model: string;
        services: {
          service: string;
          pricing: {
            basic: number;
            standard: number;
            premium: number;
          };
        }[];
      }[];
    }[];
    certifications: {
      name: string;
      issuer: string;
      certificate_url: string;
      expiry_date: string;
      verified: boolean;
    }[];
    pricing: {
      basic_repair: number;
      complex_repair: number;
      emergency_service: number;
      travel_fee: number;
      parts_markup: number;
    };
    inventory: {
      part_name: string;
      compatible_models: string[];
      quantity: number;
      quality: 'basic' | 'standard' | 'premium';
      price: number;
    }[];
    verification_status: 'pending' | 'verified' | 'rejected';
    verification_documents: {
      identity_document: string;
      business_license: string;
      insurance_certificate: string;
      background_check: string;
    };
    performance_metrics: {
      overall_rating: number;
      total_reviews: number;
      completed_orders: number;
      response_time_avg: number; // in minutes
      completion_rate: number;
      on_time_rate: number;
    };
    earnings: {
      total_earned: number;
      current_month: number;
      pending_payout: number;
      commission_rate: number;
    };
    availability_status: 'available' | 'busy' | 'offline';
    created_at: string;
    updated_at: string;
  }
  
  export interface ServiceRequest {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    device_info: {
      brand: string;
      model: string;
      issue_description: string;
      photos: string[];
    };
    service_type: 'inspection' | 'repair' | 'emergency';
    urgency: 'immediate' | 'same_day' | 'scheduled';
    preferred_time: string;
    budget_range: {
      min: number;
      max: number;
    };
    distance_from_provider: number;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    created_at: string;
    expires_at: string;
  }
  
  export interface ActiveBooking {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    service_address: string;
    device_info: {
      brand: string;
      model: string;
      issue: string;
    };
    service_details: {
      type: string;
      estimated_duration: number;
      parts_needed: string[];
    };
    status: 'confirmed' | 'in_progress' | 'awaiting_parts' | 'completed' | 'cancelled';
    appointment_time: string;
    estimated_completion: string;
    total_amount: number;
    payment_status: 'pending' | 'completed';
    progress_photos: string[];
    work_notes: string;
    customer_rating: number;
    customer_review: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface PerformanceMetrics {
    period: 'week' | 'month' | 'quarter' | 'year';
    bookings: {
      total: number;
      completed: number;
      cancelled: number;
      completion_rate: number;
    };
    earnings: {
      total: number;
      average_per_booking: number;
      growth_percentage: number;
    };
    ratings: {
      average: number;
      distribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
      };
    };
    response_times: {
      average: number;
      under_30_min: number;
      improvement_needed: boolean;
    };
  }