import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';

export async function POST(req: NextRequest) {
  try {
    const { session_key, booking_data } = await req.json();
    console.log('[COD-CONFIRM] session_key:', session_key);
    if (!session_key || !booking_data) {
      return NextResponse.json({ success: false, error: 'Missing session_key or booking_data' }, { status: 400 });
    }

    console.log('[COD-CONFIRM] Creating booking for COD...');
    
    // Create booking document for COD
    let booking;
    try {
      booking = await databases.createDocument(
        DATABASE_ID,
        'bookings',
        'unique()',
        {
          ...booking_data,
          payment_status: 'pending',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );
      console.log('[COD-CONFIRM] Booking created successfully:', booking.$id);
    } catch (error: any) {
      console.error('[COD-CONFIRM] Error creating booking:', error);
      return NextResponse.json({ success: false, error: 'Failed to create booking: ' + error.message }, { status: 500 });
    }

    // Create payment document
    try {
      await databases.createDocument(
        DATABASE_ID,
        'payments',
        'unique()',
        {
          booking_id: booking.$id,
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
      console.log('[COD-CONFIRM] Payment document created successfully');
    } catch (error: any) {
      console.error('[COD-CONFIRM] Error creating payment document:', error);
      return NextResponse.json({ success: false, error: 'Failed to create payment record: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[COD-CONFIRM] Error:', e.message, e);
    return NextResponse.json({ success: false, error: e.message || 'Server error' }, { status: 500 });
  }
} 