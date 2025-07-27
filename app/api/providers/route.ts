import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialization = searchParams.get('specialization');
    const location = searchParams.get('location');
    const pincode = searchParams.get('pincode') || searchParams.get('zip');
    const device = searchParams.get('device');
    const brand = searchParams.get('brand');
    const issue = searchParams.get('issue');
    const availableSlots = searchParams.get('availableSlots');
    const providerId = searchParams.get('providerId');
    const date = searchParams.get('date');
    const requestedTime = searchParams.get('requestedTime'); // ISO string: '2024-07-15T14:00'

    // If fetching available slots for a provider on a date
    if (availableSlots && providerId && date) {
      try {
        const businessSetupRes = await databases.listDocuments(
        DATABASE_ID,
          'business_setup',
          [Query.equal('user_id', providerId), Query.limit(1)]
        );
        if (!businessSetupRes.documents.length) {
          return NextResponse.json({ success: false, slots: [], error: 'No business setup found for provider.' }, { status: 404 });
        }
        let onboarding = {};
        try {
          onboarding = JSON.parse(businessSetupRes.documents[0].onboarding_data || '{}');
        } catch (e) {
          return NextResponse.json({ success: false, slots: [], error: 'Invalid onboarding_data JSON.' }, { status: 500 });
        }
        const serviceSetup = (onboarding as any).serviceSetup || {};
        let availability = [];
        if (Array.isArray(serviceSetup.availability)) {
          availability = serviceSetup.availability;
        } else if (typeof serviceSetup.availability === 'object' && serviceSetup.availability !== null) {
          const dayMap: Record<string, string> = {
            sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
            thu: 'Thursday', fri: 'Friday', sat: 'Saturday'
          };
          availability = Object.entries(serviceSetup.availability).map(([key, value]) => ({
            day: dayMap[key as keyof typeof dayMap] || key,
            ...(value as object)
          }));
        }
        const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' });
        const dayHours = availability.find((a: any) => a.day === dayOfWeek && a.available);
      let slots: string[] = [];
      if (dayHours) {
        const startHour = parseInt(dayHours.start.split(':')[0], 10);
        const endHour = parseInt(dayHours.end.split(':')[0], 10);
        for (let h = startHour; h < endHour; h++) {
          const slot = `${h.toString().padStart(2, '0')}:00`;
            slots.push(slot);
          }
        }
        return NextResponse.json({ success: true, slots });
      } catch (error: any) {
        return NextResponse.json({ success: false, slots: [], error: error.message }, { status: 500 });
      }
    }

    // Normal provider search
    let queries = [Query.equal('verification_status', 'verified')];
    if (specialization) {
      queries.push(Query.contains('specializations', specialization));
    }
    if (issue) {
      queries.push(Query.contains('specializations', issue));
    }
    if (brand) {
      queries.push(Query.contains('specializations', brand));
    }
    if (device) {
      queries.push(Query.contains('specializations', device));
    }
    if (pincode) {
      queries.push(Query.equal('service_pincodes', pincode));
    }
    // Optionally, add location-based filtering if you have coordinates

    const providersRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROVIDERS,
      queries
    );
    let providers = providersRes.documents;

    // If requestedTime is provided, filter providers by real availability
    if (requestedTime) {
      const reqDate = new Date(requestedTime);
      const reqDay = reqDate.toLocaleDateString('en-US', { weekday: 'long' });
      const reqTime = requestedTime.split('T')[1]?.slice(0,5); // 'HH:MM'
      // For each provider, check working hours and bookings
      const availableProviders = [];
      for (const provider of providers) {
        const workingHours = provider.working_hours ? JSON.parse(provider.working_hours) : [];
        const wh = workingHours.find((w: any) => w.day.toLowerCase() === reqDay.toLowerCase());
        if (!wh) continue; // Not working that day
        if (reqTime < wh.start || reqTime >= wh.end) continue; // Not within working hours
        // Check for existing booking at that time
        const bookingsRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.BOOKINGS,
          [
            Query.equal('provider_id', provider.$id || provider.id),
            Query.startsWith('appointment_time', requestedTime.split('T')[0]), // same date
            Query.equal('appointment_time', `${requestedTime.split('T')[0]} ${reqTime}`)
          ]
        );
        if (bookingsRes.documents.length > 0) continue; // Already booked
        availableProviders.push(provider);
      }
      providers = availableProviders;
    }

    return NextResponse.json({ success: true, providers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}