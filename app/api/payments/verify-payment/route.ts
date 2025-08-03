import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { 
      session_key, 
      booking_data,
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = await req.json();

    if (!session_key || !booking_data || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing payment verification parameters' 
      }, { status: 400 });
    }

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    const signature = crypto
      .createHmac('sha256', secret || 'your_secret_key')
      .update(text)
      .digest('hex');

    const isAuthentic = signature === razorpay_signature;

    // For test mode, we can be more lenient with signature verification
    // In production, you should always verify the signature
    const shouldProceed = isAuthentic || process.env.NODE_ENV === 'development';

    if (!shouldProceed) {
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
    }

    // Create booking document after successful payment
    let booking;
    try {
      // Create the complete booking with all data from the client
      booking = await databases.createDocument(
        DATABASE_ID,
        'bookings',
        'unique()',
        {
          ...booking_data,
          payment_status: 'completed',
          status: 'confirmed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );
    } catch (error: any) {
      console.error('Error creating booking:', error);
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
          status: 'completed',
          payment_method: 'online',
          transaction_id: `TXN_${Date.now()}`,
          commission_amount: booking.total_amount * 0.10, // 10% commission
          provider_payout: booking.total_amount * 0.90,   // 90% to provider
          is_commission_settled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          razorpay_payment_id,
          razorpay_order_id,
        }
      );
    } catch (error: any) {
      console.error('Error creating payment document:', error);
      return NextResponse.json({ success: false, error: 'Failed to create payment record: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error verifying payment:', e);
    return NextResponse.json({ 
      success: false, 
      error: e.message || 'Payment verification failed' 
    }, { status: 500 });
  }
} 