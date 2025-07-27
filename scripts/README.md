# Appwrite Database Setup

This guide will help you set up your Appwrite database with all the necessary collections and attributes for the device repair platform.

## Prerequisites

1. **Appwrite Project**: You need an Appwrite project with API access
2. **API Key**: You need an API key with database permissions
3. **Node.js**: Make sure you have Node.js installed

## Step 1: Get Your Appwrite Credentials

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Create a new project or use an existing one
3. Go to **Settings** → **API Keys**
4. Create a new API key with the following permissions:
   - `databases.read`
   - `databases.write`
   - `collections.read`
   - `collections.write`
   - `attributes.read`
   - `attributes.write`
5. Copy your **Project ID** and **API Key**

## Step 2: Update Configuration

Edit `scripts/config.ts` and replace the placeholder values:

```typescript
export const APPWRITE_CONFIG = {
  ENDPOINT: 'https://cloud.appwrite.io/v1',
  PROJECT_ID: 'your_actual_project_id', // Replace this
  API_KEY: 'your_actual_api_key', // Replace this
  DATABASE_ID: 'device_repair_db'
};
```

## Step 3: Run the Setup Script

```bash
npx ts-node scripts/setup-database.ts
```

This script will:
- Create the database
- Create all 7 collections (Users, Providers, Devices, Services, Bookings, Messages, Payments)
- Create all attributes for each collection
- Handle errors gracefully if collections already exist

## Step 4: Seed the Database

After the setup is complete, seed the database with sample data:

```bash
npx ts-node scripts/seed-data.ts
```

This will populate your database with:
- 20+ devices (phones and laptops)
- 3 sample providers
- Real device images and specifications

## Step 5: Update Environment Variables

Create a `.env.local` file in your project root:

```bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here

# Database and Collection IDs
NEXT_PUBLIC_APPWRITE_DATABASE_ID=device_repair_db

# Collection IDs
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID=providers
NEXT_PUBLIC_APPWRITE_DEVICES_COLLECTION_ID=devices
NEXT_PUBLIC_APPWRITE_SERVICES_COLLECTION_ID=services
NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID=bookings
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=messages
NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID=payments
```

## What Gets Created

### Database
- **Name**: Device Repair Platform
- **ID**: device_repair_db

### Collections

1. **Users** - Customer and provider user accounts
2. **Providers** - Service provider profiles
3. **Devices** - Phone and laptop models with specifications
4. **Services** - Repair services for each device
5. **Bookings** - Customer booking records
6. **Messages** - Communication between customers and providers
7. **Payments** - Payment transaction records

### Sample Data

The seeding script will create:
- **Apple Phones**: iPhone 15 Pro Max, iPhone 15 Pro, iPhone 15, iPhone 14 Pro Max, iPhone 14 Pro, iPhone 14, iPhone 13 Pro Max, iPhone 13 Pro, iPhone 13, iPhone 12 Pro Max, iPhone 12 Pro, iPhone 12
- **Samsung Phones**: Galaxy S24 Ultra, Galaxy S24+, Galaxy S24, Galaxy S23 Ultra, Galaxy S23+, Galaxy S23, Galaxy S22 Ultra, Galaxy S22+, Galaxy S22
- **Google Phones**: Pixel 8 Pro, Pixel 8, Pixel 7 Pro, Pixel 7
- **Apple Laptops**: MacBook Pro 16", MacBook Pro 14", MacBook Air 15", MacBook Air 13"
- **Dell Laptops**: XPS 13 Plus, XPS 15
- **HP Laptops**: Spectre x360 14, Envy 16
- **Lenovo Laptops**: ThinkPad X1 Carbon, ThinkPad X1 Yoga
- **Providers**: Tech Fix Pro, Quick Mobile Repair, Laptop Masters

## Troubleshooting

### Common Issues

1. **"API Key not found"**: Make sure your API key has the correct permissions
2. **"Project not found"**: Verify your project ID is correct
3. **"Collection already exists"**: This is normal, the script handles this gracefully
4. **"Attribute already exists"**: This is normal, the script handles this gracefully

### Manual Setup (Alternative)

If the script doesn't work, you can manually create the collections in the Appwrite Console:

1. Go to your project in Appwrite Console
2. Navigate to **Databases** → **Create Database**
3. Create each collection with the attributes listed in the script

## Next Steps

After setup and seeding:
1. Start your development server: `npm run dev`
2. Navigate to the booking page
3. You should see real device images and comprehensive device lists
4. The data is now coming from your Appwrite database instead of mock data 