import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export async function POST(req: NextRequest) {
  try {
    const { booking_id, provider_id, collection_method = 'upi' } = await req.json();
    
      booking_id,
      provider_id,
      collection_method
    });
    
    // Validate required fields
    if (!booking_id || !provider_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing booking_id or provider_id' 
      }, { status: 400 });
    }

    // Find the payment record
    const paymentResponse = await databases.listDocuments(
      DATABASE_ID,
      'payments',
      [Query.equal('booking_id', booking_id), Query.limit(1)]
    );

    if (paymentResponse.documents.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment record not found' 
      }, { status: 404 });
    }

    const payment = paymentResponse.documents[0];
      payment_id: payment.$id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      commission_amount: payment.commission_amount
    });
    
    // Validate it's a COD payment
    if (payment.payment_method !== 'COD') {
      return NextResponse.json({ 
        success: false, 
        error: 'Not a COD payment' 
      }, { status: 400 });
    }

    // Check if commission is already settled
    if (payment.is_commission_settled) {
      return NextResponse.json({ 
        success: false, 
        error: 'Commission already settled' 
      }, { status: 400 });
    }

    // Create commission collection record
    try {
      const commissionCollection = await databases.createDocument(
        DATABASE_ID,
        'commission_collections',
        'unique()',
        {
          booking_id: booking_id,
          provider_id: provider_id,
          commission_amount: payment.commission_amount,
          collection_method: collection_method, // 'upi', 'bank_transfer', 'cash_pickup'
          status: 'pending',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );
      
        collection_id: commissionCollection.$id,
        commission_amount: payment.commission_amount
      });
    } catch (error: any) {
      console.error('❌ [COLLECT-COMMISSION] Error creating commission collection:', error);
      
      // Check if it's a collection not found error
      if (error.message && error.message.includes('collection')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Commission collections collection not found. Please create it in Appwrite Console.' 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create commission collection record: ' + error.message 
      }, { status: 500 });
    }

    // Update payment record
    try {
      await databases.updateDocument(
        DATABASE_ID,
        'payments',
        payment.$id,
        {
          is_commission_settled: false,
          updated_at: new Date().toISOString()
        }
      );
      
    } catch (error: any) {
      console.error('❌ [COLLECT-COMMISSION] Error updating payment record:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update payment record: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      commission_amount: payment.commission_amount,
      message: `Commission collection record created for ₹${payment.commission_amount}`
    });
  } catch (e: any) {
    console.error('❌ [COLLECT-COMMISSION] Unexpected error:', e.message, e);
    return NextResponse.json({ 
      success: false, 
      error: e.message || 'Server error' 
    }, { status: 500 });
  }
} 