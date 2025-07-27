import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';

export async function POST(req: NextRequest) {
  try {
    const { booking_id } = await req.json();
    if (!booking_id) {
      return NextResponse.json({ success: false, error: 'Missing booking_id' }, { status: 400 });
    }
    // Fetch booking
    const booking = await databases.getDocument(
      DATABASE_ID,
      'bookings',
      booking_id
    );
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }
    // Update booking
    await databases.updateDocument(
      DATABASE_ID,
      'bookings',
      booking_id,
      {
        payment_method: 'COD',
        payment_status: 'pending',
        status: 'confirmed',
      }
    );
    // Create payment document
    await databases.createDocument(
      DATABASE_ID,
      'payments',
      'unique()',
      {
        booking_id,
        amount: booking.total_amount,
        method: 'COD',
        status: 'pending',
        commission_amount: 0,
        provider_payout: 0,
      }
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Server error' }, { status: 500 });
  }
} 