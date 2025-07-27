# Appwrite Collections Analysis

## Overview
This document provides a comprehensive analysis of all collections in your Appwrite database and explains how they are used in your device repair service platform.

## Database Statistics
- **Total Collections**: 18
- **Total Attributes**: 103
- **Reference Collections**: 5
- **Customer Collections**: 3
- **Provider Collections**: 1
- **Core Business Collections**: 9

---

## Collection Categories

### 1. Reference Collections (5 collections)
These collections store master data that is referenced by other collections.

#### 📁 Categories (categories)
- **Purpose**: Master list of device categories (Phone, Laptop, etc.)
- **Attributes**: 
  - `name` (string, 100 chars, REQUIRED)
- **Usage**: Used to categorize devices and organize the platform
- **Relationships**: Referenced by brands, models, and issues

#### 📁 Brands (brands)
- **Purpose**: Master list of device brands (Apple, Samsung, Dell, etc.)
- **Attributes**:
  - `name` (string, 100 chars, REQUIRED)
  - `category_id` (string, 255 chars, REQUIRED) - FK to categories
- **Usage**: Used in device selection, provider specializations, and pricing
- **Relationships**: Belongs to a category, has many models

#### 📁 Models (models)
- **Purpose**: Specific device models within brands
- **Attributes**:
  - `name` (string, 100 chars, REQUIRED)
  - `brand_id` (string, 255 chars, REQUIRED) - FK to brands
  - `specifications` (string, 2000 chars, optional)
  - `image_url` (string, 500 chars, optional)
- **Usage**: Core entity for device identification and service matching
- **Relationships**: Belongs to a brand, referenced by customer devices and services

#### 📁 Issues (issues)
- **Purpose**: Common problems that can occur with devices
- **Attributes**:
  - `name` (string, 100 chars, REQUIRED)
  - `description` (string, 1000 chars, optional)
  - `category_id` (string, 255 chars, REQUIRED) - FK to categories
- **Usage**: Used to categorize repair requests and match with provider specializations
- **Relationships**: Belongs to a category, referenced by bookings

#### 📁 ServiceTypes (service_types)
- **Purpose**: Types of services offered (inspection, repair, emergency, etc.)
- **Attributes**:
  - `name` (string, 100 chars, REQUIRED)
- **Usage**: Categorizes different types of services providers can offer
- **Relationships**: Referenced by bookings and provider specializations

### 2. User Management Collections (2 collections)

#### 📁 Users (users)
- **Purpose**: Core user accounts for the platform
- **Attributes**:
  - `name` (string, 255 chars, REQUIRED)
  - `email` (string, REQUIRED)
  - `phone` (string, 20 chars, optional)
  - `role` (string, REQUIRED) - customer/provider/admin
  - `address_street` (string, 255 chars, optional)
  - `address_city` (string, 100 chars, optional)
  - `address_state` (string, 100 chars, optional)
  - `address_zip` (string, 20 chars, optional)
  - `address_lat` (double, optional)
  - `address_lng` (double, optional)
  - `created_at` (datetime, REQUIRED)
- **Usage**: Authentication and user profile management
- **Relationships**: Referenced by customers and providers

#### 📁 Customers (customers)
- **Purpose**: Customer-specific information
- **Attributes**:
  - `user_id` (string, 255 chars, REQUIRED) - FK to users
  - `full_name` (string, 255 chars, REQUIRED)
  - `email` (string, 255 chars, REQUIRED)
  - `phone` (string, 20 chars, optional)
  - `address` (string, 500 chars, optional)
  - `created_at` (datetime, REQUIRED)
- **Usage**: Stores customer-specific data separate from user authentication
- **Relationships**: Belongs to a user, has many customer devices and bookings

### 3. Device Management Collections (4 collections)

#### 📁 Devices (devices)
- **Purpose**: Master list of all device types supported by the platform
- **Attributes**:
  - `category` (string, REQUIRED)
  - `brand` (string, 100 chars, REQUIRED)
  - `model` (string, 255 chars, REQUIRED)
  - `specifications` (string, 2000 chars, optional)
  - `common_issues` (string, 5000 chars, optional)
  - `image_url` (string, 500 chars, optional)
- **Usage**: Reference data for device selection and service matching
- **Relationships**: Referenced by services and customer devices

#### 📁 Phones (phones)
- **Purpose**: Specific phone models with their details
- **Attributes**:
  - `brand` (string, 100 chars, REQUIRED)
  - `model` (string, 255 chars, REQUIRED)
  - `specifications` (string, 2000 chars, optional)
  - `image_url` (string, 500 chars, optional)
- **Usage**: Detailed phone catalog for the platform
- **Relationships**: Referenced by customer devices and services

#### 📁 Laptops (laptops)
- **Purpose**: Specific laptop models with their details
- **Attributes**:
  - `brand` (string, 100 chars, REQUIRED)
  - `model` (string, 255 chars, REQUIRED)
  - `specifications` (string, 2000 chars, optional)
  - `image_url` (string, 500 chars, optional)
- **Usage**: Detailed laptop catalog for the platform
- **Relationships**: Referenced by customer devices and services

#### 📁 CustomerDevices (customer_devices)
- **Purpose**: Customer's registered devices
- **Attributes**:
  - `customer_id` (string, 255 chars, REQUIRED) - FK to customers
  - `model_id` (string, 255 chars, REQUIRED) - FK to models
  - `serial_number` (string, 100 chars, optional)
  - `nickname` (string, 100 chars, optional)
  - `registered_at` (datetime, REQUIRED)
- **Usage**: Tracks which devices each customer owns
- **Relationships**: Belongs to a customer and a model, referenced by bookings

### 4. Service Management Collections (2 collections)

#### 📁 Services (services)
- **Purpose**: Available services for different devices
- **Attributes**:
  - `device_id` (string, 255 chars, REQUIRED) - FK to devices
  - `name` (string, 255 chars, REQUIRED)
  - `description` (string, 1000 chars, optional)
  - `base_price` (double, REQUIRED)
  - `part_qualities` (string, 2000 chars, optional) - JSON stringified
- **Usage**: Defines what services are available for each device type
- **Relationships**: Belongs to a device, referenced by bookings

#### 📁 Services Offered (services_offered)
- **Purpose**: Services that specific providers offer
- **Attributes**:
  - `providerId` (string, 255 chars, REQUIRED) - FK to providers
  - `deviceType` (string, 32 chars, REQUIRED)
  - `brand` (string, 100 chars, REQUIRED)
  - `issue` (string, 100 chars, REQUIRED)
  - `price` (double, REQUIRED)
  - `created_at` (datetime, REQUIRED)
  - `model` (string, 100 chars, optional)
  - `partType` (string, 100 chars, optional)
  - `warranty` (string, 100 chars, optional)
- **Usage**: Links providers to specific services they can perform
- **Relationships**: Belongs to a provider, defines service capabilities

### 5. Provider Management Collections (2 collections)

#### 📁 Providers (providers)
- **Purpose**: Service provider accounts and information
- **Attributes**:
  - `providerId` (string, 255 chars, REQUIRED) - FK to users
  - `email` (string, 255 chars, REQUIRED)
  - `phone` (string, 32 chars, REQUIRED)
  - `role` (string, 32 chars, REQUIRED)
  - `isVerified` (boolean, REQUIRED)
  - `isApproved` (boolean, REQUIRED)
  - `onboardingCompleted` (boolean, REQUIRED)
  - `joinedAt` (datetime, REQUIRED)
- **Usage**: Manages provider accounts and verification status
- **Relationships**: Belongs to a user, has many services offered and bookings

#### 📁 BusinessSetup (business_setup)
- **Purpose**: Stores provider onboarding data
- **Attributes**:
  - `user_id` (string, 255 chars, REQUIRED) - FK to users
  - `onboarding_data` (string, 1GB, optional) - JSON stringified
  - `created_at` (datetime, REQUIRED)
- **Usage**: Stores multi-step onboarding information for providers
- **Relationships**: Belongs to a user (provider)

### 6. Core Business Collections (3 collections)

#### 📁 Bookings (bookings)
- **Purpose**: Core business entity - service appointments
- **Attributes**:
  - `customer_id` (string, 255 chars, REQUIRED) - FK to customers
  - `provider_id` (string, 255 chars, REQUIRED) - FK to providers
  - `device_id` (string, 255 chars, REQUIRED) - FK to devices
  - `service_id` (string, 255 chars, REQUIRED) - FK to services
  - `issue_description` (string, 2000 chars, optional)
  - `part_quality` (string, REQUIRED) - basic/standard/premium
  - `status` (string, REQUIRED) - pending/confirmed/in_progress/completed/cancelled
  - `appointment_time` (datetime, REQUIRED)
  - `total_amount` (double, REQUIRED)
  - `payment_status` (string, REQUIRED) - pending/completed
  - `location_type` (string, REQUIRED) - doorstep/provider_location
  - `customer_address` (string, 1000 chars, optional)
  - `rating` (double, optional)
  - `review` (string, 1000 chars, optional)
  - `created_at` (datetime, REQUIRED)
  - `updated_at` (datetime, REQUIRED)
- **Usage**: Central entity for all service transactions
- **Relationships**: Links customers, providers, devices, and services

#### 📁 Messages (messages)
- **Purpose**: Communication between customers and providers
- **Attributes**:
  - `booking_id` (string, 255 chars, REQUIRED) - FK to bookings
  - `sender_id` (string, 255 chars, REQUIRED) - FK to users
  - `receiver_id` (string, 255 chars, REQUIRED) - FK to users
  - `content` (string, 2000 chars, REQUIRED)
  - `attachment_url` (string, 500 chars, optional)
  - `read` (boolean, REQUIRED)
  - `created_at` (datetime, REQUIRED)
- **Usage**: Enables real-time communication during service process
- **Relationships**: Belongs to a booking, links sender and receiver

#### 📁 Payments (payments)
- **Purpose**: Financial transactions and commission tracking
- **Attributes**:
  - `booking_id` (string, 255 chars, REQUIRED) - FK to bookings
  - `amount` (double, REQUIRED)
  - `status` (string, REQUIRED) - pending/completed/failed/refunded
  - `payment_method` (string, 100 chars, REQUIRED)
  - `transaction_id` (string, 255 chars, optional)
  - `commission_amount` (double, REQUIRED)
  - `provider_payout` (double, REQUIRED)
  - `created_at` (datetime, REQUIRED)
- **Usage**: Tracks payments, platform commissions, and provider payouts
- **Relationships**: Belongs to a booking

---

## Data Flow and Relationships

### Customer Journey
1. **Registration**: User creates account → stored in `users` → customer profile in `customers`
2. **Device Registration**: Customer registers device → stored in `customer_devices` (linked to `models`)
3. **Service Request**: Customer creates booking → stored in `bookings` (links customer, provider, device, service)
4. **Communication**: Messages exchanged → stored in `messages`
5. **Payment**: Payment processed → stored in `payments`
6. **Review**: Customer reviews service → rating/review stored in `bookings`

### Provider Journey
1. **Registration**: User creates account → stored in `users` → provider profile in `providers`
2. **Onboarding**: Provider completes setup → data stored in `business_setup`
3. **Service Setup**: Provider defines services → stored in `services_offered`
4. **Service Delivery**: Provider accepts bookings → updates `bookings` status
5. **Payment**: Provider receives payout → tracked in `payments`

### Reference Data Flow
- **Categories** → **Brands** → **Models** → **CustomerDevices**
- **Categories** → **Issues** → **Bookings**
- **Devices** → **Services** → **Bookings**
- **ServiceTypes** → **Bookings**

---

## Key Features Supported

### 1. Multi-Device Support
- **Phones** and **Laptops** collections provide detailed device catalogs
- **Models** collection links brands to specific device models
- **CustomerDevices** tracks individual customer device ownership

### 2. Provider Specialization
- **Services Offered** allows providers to specify what they can repair
- **Providers** collection manages verification and approval status
- **BusinessSetup** stores comprehensive onboarding data

### 3. Service Matching
- **Bookings** links customers with providers based on device and service needs
- **Services** defines available services for each device type
- **Issues** categorizes problems for better matching

### 4. Communication System
- **Messages** enables real-time communication between customers and providers
- Linked to specific bookings for context

### 5. Payment and Commission
- **Payments** tracks all financial transactions
- Supports platform commission and provider payout calculations
- Multiple payment statuses for comprehensive tracking

### 6. Quality Assurance
- **Bookings** includes rating and review system
- **Providers** has verification and approval workflow
- **Services** supports different part quality tiers

---

## Recommendations

### 1. Data Consistency
- Consider adding foreign key constraints in application logic
- Implement data validation for enum values (status, payment_status, etc.)

### 2. Performance Optimization
- Add indexes on frequently queried fields (customer_id, provider_id, status)
- Consider pagination for large collections (messages, bookings)

### 3. Feature Enhancements
- Add **Notifications** collection for push notifications
- Consider **Reviews** as separate collection for better querying
- Add **ServiceAreas** collection for provider location management

### 4. Security
- Implement proper access control for sensitive collections
- Add audit trails for critical operations
- Consider data encryption for sensitive information

This database schema effectively supports a comprehensive device repair service platform with proper separation of concerns, scalable relationships, and support for all major business processes. 