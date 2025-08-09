import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { 
      commission_id, 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = await req.json();

    if (!commission_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing payment verification parameters' 
      }, { status: 400 });
    }

    console.log('🔍 [VERIFY-COMMISSION] Verifying commission payment:', {
      commission_id,
      razorpay_payment_id,
      razorpay_order_id
    });

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    
    const signature = crypto
      .createHmac('sha256', secret || 'your_secret_key')
      .update(text)
      .digest('hex');

    const isAuthentic = signature === razorpay_signature;

    // For test mode, we can be more lenient with signature verification
    const shouldProceed = isAuthentic || process.env.NODE_ENV === 'development';

    if (!shouldProceed) {
      console.error('❌ [VERIFY-COMMISSION] Payment signature verification failed');
      return NextResponse.json({ 
        success: false, 
        error: 'Payment verification failed' 
      }, { status: 400 });
    }

    // Find the commission collection record
    const commissionResponse = await databases.listDocuments(
      DATABASE_ID,
      'commission_collections',
      [Query.equal('$id', commission_id), Query.limit(1)]
    );

    if (commissionResponse.documents.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Commission record not found' 
      }, { status: 404 });
    }

    const commission = commissionResponse.documents[0];

    // Update commission record as completed
    try {
      await databases.updateDocument(
        DATABASE_ID,
        'commission_collections',
        commission_id,
        {
          status: 'completed',
          razorpay_payment_id: razorpay_payment_id,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      // Update the corresponding payment record
      const paymentResponse = await databases.listDocuments(
        DATABASE_ID,
        'payments',
        [Query.equal('booking_id', commission.booking_id), Query.limit(1)]
      );

      if (paymentResponse.documents.length > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          'payments',
          paymentResponse.documents[0].$id,
          {
            is_commission_settled: true,
            updated_at: new Date().toISOString()
          }
        );
      }

      console.log('✅ [VERIFY-COMMISSION] Commission payment verified and completed');

      return NextResponse.json({ 
        success: true,
        message: 'Commission payment verified successfully'
      });

    } catch (error: any) {
      console.error('❌ [VERIFY-COMMISSION] Error updating commission record:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update commission record: ' + error.message 
      }, { status: 500 });
    }

  } catch (e: any) {
    console.error('❌ [VERIFY-COMMISSION] Unexpected error:', e.message, e);
    return NextResponse.json({ 
      success: false, 
      error: e.message || 'Payment verification failed' 
    }, { status: 500 });
  }
} 