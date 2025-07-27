# Booking System Implementation

## Overview

This document describes the comprehensive booking system implemented for the Roovox project. The system provides a complete workflow for creating, managing, and tracking service appointments between customers and providers.

## 🏗 Architecture

### Database Schema

The booking system uses the existing `bookings` collection in Appwrite with the following schema:

```typescript
interface Booking {
  id: string;
  customer_id: string;           // FK to customers collection
  provider_id: string;           // FK to providers collection
  device_id: string;             // FK to devices collection
  service_id: string;            // FK to services collection
  issue_description?: string;     // Optional issue description
  part_quality: string;          // "OEM", "HQ", "Standard", etc.
  status: string;                // pending/confirmed/in_progress/completed/cancelled
  appointment_time: string;       // ISO datetime
  total_amount: number;          // Total price including parts & service
  payment_status: string;        // pending/completed/refunded
  location_type: string;         // doorstep/provider_location
  customer_address?: string;      // Address for doorstep service
  rating?: number;               // Customer rating (1-5)
  review?: string;               // Customer review text
  created_at: string;            // ISO datetime
  updated_at: string;            // ISO datetime
}
```

### API Endpoints

#### `/api/bookings` (GET, POST, PUT)

- **GET**: Fetch bookings with optional filters (userId, providerId, status, customerId)
- **POST**: Create new booking with validation
- **PUT**: Update booking status, payment, rating, etc.

## 🚀 Features Implemented

### 1. Customer Booking Flow

#### Booking Creation
- **Location**: `components/booking/BookingForm.tsx`
- **Features**:
  - Device and service selection
  - Part quality selection (OEM, HQ, Standard)
  - Date and time slot selection
  - Address management (saved addresses, location picker)
  - Service type selection (doorstep vs provider location)
  - Real-time price calculation
  - Form validation and error handling

#### Booking Management
- **Location**: `app/bookings/page.tsx`
- **Features**:
  - View all customer bookings
  - Status tracking with visual progress indicators
  - Booking cancellation
  - Rating and review submission
  - Detailed booking information display

#### Booking Confirmation
- **Location**: `app/bookings/confirmation/page.tsx`
- **Features**:
  - Success confirmation page
  - Booking details summary
  - Next steps explanation
  - Payment information
  - Quick action buttons

### 2. Provider Booking Management

#### Booking Dashboard
- **Location**: `components/provider/BookingDashboard.tsx`
- **Features**:
  - Comprehensive booking overview
  - Real-time statistics (total, pending, completed, revenue)
  - Advanced filtering and search
  - Status-based tabs
  - Booking list with detailed information

#### Booking Management Interface
- **Location**: `components/provider/BookingManagement.tsx`
- **Features**:
  - Status updates (pending → confirmed → in_progress → completed)
  - Work notes and progress tracking
  - Photo upload for progress documentation
  - Service completion workflow
  - Customer communication tools
  - Rating submission for completed services

### 3. Enhanced Provider Dashboard

#### Updated Dashboard
- **Location**: `app/provider/dashboard/page.tsx`
- **Features**:
  - Tabbed interface (Overview, Bookings, Services)
  - Integrated booking dashboard
  - Quick stats and performance metrics
  - Profile management

## 🔧 Core Services

### Appwrite Services (`lib/appwrite-services.ts`)

#### Booking Management
```typescript
// Create new booking
createBooking(bookingData: BookingData): Promise<Booking>

// Fetch bookings by user
getBookingsByCustomerId(customerId: string): Promise<Booking[]>
getBookingsByProviderId(providerId: string): Promise<Booking[]>

// Get single booking
getBookingById(bookingId: string): Promise<Booking | null>

// Update booking status
updateBookingStatus(bookingId: string, status: string, notes?: string): Promise<void>

// Update payment status
updateBookingPayment(bookingId: string, paymentMethod: string): Promise<void>

// Rating and review
updateBookingRating(bookingId: string, rating: number, review?: string): Promise<void>

// Cancel or reschedule
updateBookingCancelReschedule(bookingId: string, action: 'cancel' | 'reschedule', data: any): Promise<void>

// Get booking statistics
getBookingStats(userId: string, userType: 'customer' | 'provider'): Promise<BookingStats>
```

## 📊 Status Workflow

### Booking Status Flow

1. **pending** → Customer creates booking
2. **confirmed** → Provider confirms appointment
3. **in_progress** → Provider starts service
4. **completed** → Service finished
5. **cancelled** → Booking cancelled (by customer or provider)

### Payment Status Flow

1. **pending** → Initial state
2. **completed** → Payment received
3. **refunded** → Payment refunded

## 🎨 UI Components

### Customer Components
- `BookingForm`: Complete booking creation form
- `BookingList`: Customer booking overview
- `BookingConfirmation`: Success page after booking

### Provider Components
- `BookingDashboard`: Provider booking management interface
- `BookingManagement`: Individual booking management modal
- `ProviderDashboard`: Enhanced provider dashboard

## 🔐 Security & Validation

### API Validation
- Required field validation
- Status value validation
- Payment status validation
- Rating range validation (1-5)
- Location type validation

### Error Handling
- Comprehensive error messages
- Toast notifications for user feedback
- Loading states and spinners
- Graceful fallbacks

## 📱 User Experience Features

### Customer Experience
- **Visual Status Tracking**: Progress indicators for booking status
- **Rating System**: Star-based rating with optional reviews
- **Address Management**: Save and reuse addresses
- **Real-time Updates**: Live status updates
- **Mobile Responsive**: Works on all device sizes

### Provider Experience
- **Dashboard Overview**: Quick stats and metrics
- **Advanced Filtering**: Search and filter bookings
- **Status Management**: Easy status updates
- **Progress Documentation**: Photo uploads and notes
- **Communication Tools**: Built-in messaging

## 🚀 Getting Started

### Prerequisites
- Appwrite backend with bookings collection
- Required environment variables
- User authentication system

### Installation
1. Ensure all dependencies are installed
2. Configure Appwrite collections and permissions
3. Set up environment variables
4. Import and use the booking components

### Usage Examples

#### Creating a Booking
```typescript
import { createBooking } from '@/lib/appwrite-services';

const bookingData = {
  customer_id: 'user123',
  provider_id: 'provider456',
  device_id: 'device789',
  service_id: 'service101',
  appointment_time: '2024-01-15T10:00:00Z',
  total_amount: 150.00,
  part_quality: 'OEM',
  location_type: 'doorstep',
  customer_address: '123 Main St, City, State 12345'
};

const booking = await createBooking(bookingData);
```

#### Updating Booking Status
```typescript
import { updateBookingStatus } from '@/lib/appwrite-services';

await updateBookingStatus('booking123', 'confirmed', 'Provider confirmed appointment');
```

## 🔄 Integration Points

### Payment Integration
- Payment status tracking
- Payment method recording
- Refund handling

### Notification System
- Booking confirmations
- Status change notifications
- Payment reminders

### Analytics
- Booking statistics
- Revenue tracking
- Performance metrics

## 🧪 Testing

### Manual Testing Checklist
- [ ] Customer booking creation
- [ ] Provider booking confirmation
- [ ] Status updates
- [ ] Rating submission
- [ ] Booking cancellation
- [ ] Address management
- [ ] Payment status updates

### API Testing
- [ ] POST /api/bookings (create)
- [ ] GET /api/bookings (fetch with filters)
- [ ] PUT /api/bookings (update)

## 📈 Performance Considerations

### Optimization Strategies
- Pagination for large booking lists
- Caching for frequently accessed data
- Lazy loading for booking details
- Optimistic updates for better UX

### Database Indexes
- customer_id index
- provider_id index
- status index
- created_at index

## 🔮 Future Enhancements

### Planned Features
- Real-time notifications
- Advanced analytics dashboard
- Automated status updates
- Integration with payment gateways
- Mobile app support
- Multi-language support

### Technical Improvements
- WebSocket integration for real-time updates
- Advanced caching strategies
- Performance monitoring
- Automated testing suite

## 📚 Additional Resources

### Related Files
- `types/index.ts`: TypeScript interfaces
- `contexts/AuthContext.tsx`: User authentication
- `hooks/use-toast.ts`: Toast notifications
- `lib/utils.ts`: Utility functions

### External Dependencies
- Appwrite SDK
- React Hook Form
- Lucide React Icons
- Tailwind CSS
- Next.js

## 🤝 Contributing

When contributing to the booking system:

1. Follow the existing code structure
2. Add proper TypeScript types
3. Include error handling
4. Add loading states
5. Test thoroughly
6. Update documentation

## 📞 Support

For questions or issues with the booking system:

1. Check the existing documentation
2. Review the code examples
3. Test with the provided checklist
4. Contact the development team

---

This implementation provides a robust, scalable booking system that handles the complete lifecycle of service appointments from creation to completion, with comprehensive management tools for both customers and providers. 