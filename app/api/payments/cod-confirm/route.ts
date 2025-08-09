import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';

export async function POST(req: NextRequest) {
  try {
    const { session_key, booking_data } = await req.json();
    if (!session_key || !booking_data) {
      return NextResponse.json({ success: false, error: 'Missing session_key or booking_data' }, { status: 400 });
    }

    console.log('🔍 [COD-CONFIRM] Creating COD booking with data:', {
      total_amount: booking_data.total_amount,
      customer_id: booking_data.customer_id,
      provider_id: booking_data.provider_id
    });

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
      
      console.log('✅ [COD-CONFIRM] Booking created:', booking.$id);
    } catch (error: any) {
      console.error('[COD-CONFIRM] Error creating booking:', error);
      return NextResponse.json({ success: false, error: 'Failed to create booking: ' + error.message }, { status: 500 });
    }

    // ✅ FIXED: Calculate commission for COD
    const commissionAmount = booking.total_amount * 0.10; // 10% commission
    const providerPayout = booking.total_amount * 0.90;   // 90% to provider

    console.log('💰 [COD-CONFIRM] Commission calculation:', {
      total_amount: booking.total_amount,
      commission_amount: commissionAmount,
      provider_payout: providerPayout
    });

    // Create payment document with commission
    try {
      const payment = await databases.createDocument(
        DATABASE_ID,
        'payments',
        'unique()',
        {
          booking_id: booking.$id,
          amount: booking.total_amount,
          status: 'pending',
          payment_method: 'COD',
          transaction_id: '',
          commission_amount: commissionAmount,    // ✅ FIXED: Commission calculated
          provider_payout: providerPayout,        // ✅ FIXED: Payout calculated
          is_commission_settled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );
      
      console.log('✅ [COD-CONFIRM] Payment record created:', {
        payment_id: payment.$id,
        commission_amount: commissionAmount,
        provider_payout: providerPayout
      });
    } catch (error: any) {
      console.error('[COD-CONFIRM] Error creating payment document:', error);
      return NextResponse.json({ success: false, error: 'Failed to create payment record: ' + error.message }, { status: 500 });
    }

    console.log('🎉 [COD-CONFIRM] COD booking and payment created successfully');
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[COD-CONFIRM] Error:', e.message, e);
    return NextResponse.json({ success: false, error: e.message || 'Server error' }, { status: 500 });
  }
} 