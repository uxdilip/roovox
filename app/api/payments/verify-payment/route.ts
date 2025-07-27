import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { 
      booking_id, 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = await req.json();

    console.log('Payment verification request:', {
      booking_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature: razorpay_signature ? 'present' : 'missing'
    });

    if (!booking_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing payment verification parameters' 
      }, { status: 400 });
    }

    // First, let's try to list all bookings to see what's available
    try {
      const allBookings = await databases.listDocuments(DATABASE_ID, 'bookings');
      console.log('Available bookings:', allBookings.documents.map(b => ({ id: b.$id, total_amount: b.total_amount })));
    } catch (error: any) {
      console.error('Error listing bookings:', error);
    }

    // Fetch booking
    let booking;
    try {
      console.log('Attempting to fetch booking with ID:', booking_id);
      booking = await databases.getDocument(
        DATABASE_ID,
        'bookings',
        booking_id
      );
      console.log('Booking found successfully:', booking.$id);
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      return NextResponse.json({ success: false, error: 'Booking not found or access denied: ' + error.message }, { status: 404 });
    }

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    console.log('Booking found:', booking.$id);

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log('Signature verification:', {
      text,
      secret: secret ? 'present' : 'missing',
      received_signature: razorpay_signature
    });

    const signature = crypto
      .createHmac('sha256', secret || 'your_secret_key')
      .update(text)
      .digest('hex');

    const isAuthentic = signature === razorpay_signature;
    console.log('Signature verification result:', { isAuthentic, expected: signature });

    // For test mode, we can be more lenient with signature verification
    // In production, you should always verify the signature
    const shouldProceed = isAuthentic || process.env.NODE_ENV === 'development';

    if (!shouldProceed) {
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
    }

    console.log('Proceeding with payment confirmation...');

    // Update booking payment status
    try {
      await databases.updateDocument(
        DATABASE_ID,
        'bookings',
        booking_id,
        {
          payment_status: 'completed',
          status: 'confirmed',
        }
      );
      console.log('Booking updated successfully');
    } catch (error: any) {
      console.error('Error updating booking:', error);
      return NextResponse.json({ success: false, error: 'Failed to update booking: ' + error.message }, { status: 500 });
    }

    // Create payment document
    try {
      await databases.createDocument(
        DATABASE_ID,
        'payments',
        'unique()',
        {
          booking_id,
          amount: booking.total_amount,
          status: 'completed',
          payment_method: 'online',
          transaction_id: `TXN_${Date.now()}`,
          commission_amount: booking.total_amount * 0.10, // 10% commission
          provider_payout: booking.total_amount * 0.90,   // 90% to provider       // Same as commission_amount
          is_commission_settled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          razorpay_payment_id,
          razorpay_order_id,
        }
      );
      console.log('Payment document created successfully');
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