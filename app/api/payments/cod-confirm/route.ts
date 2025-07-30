import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';

export async function POST(req: NextRequest) {
  try {
    const { booking_id } = await req.json();
    console.log('[COD-CONFIRM] booking_id:', booking_id);
    if (!booking_id) {
      return NextResponse.json({ success: false, error: 'Missing booking_id' }, { status: 400 });
    }
    // Fetch booking
    const booking = await databases.getDocument(
      DATABASE_ID,
      'bookings',
      booking_id
    );
    console.log('[COD-CONFIRM] booking:', booking);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }
    // Update booking
    await databases.updateDocument(
      DATABASE_ID,
      'bookings',
      booking_id,
      {
        payment_status: 'pending',
        status: 'pending',
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
        status: 'pending',
        payment_method: 'COD',
        transaction_id: '',
        commission_amount: 0,
        provider_payout: 0,
        is_commission_settled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[COD-CONFIRM] Error:', e.message, e);
    return NextResponse.json({ success: false, error: e.message || 'Server error' }, { status: 500 });
  }
} 