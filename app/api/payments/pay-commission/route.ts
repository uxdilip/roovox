import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export async function POST(req: NextRequest) {
  try {
    const { commission_id, provider_id, amount } = await req.json();
    
    if (!commission_id || !provider_id || !amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing commission_id, provider_id, or amount' 
      }, { status: 400 });
    }

    console.log('🔍 [PAY-COMMISSION] Starting commission payment:', {
      commission_id,
      provider_id,
      amount
    });

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
    
    // Validate the commission
    if (commission.status !== 'pending') {
      return NextResponse.json({ 
        success: false, 
        error: 'Commission is not pending' 
      }, { status: 400 });
    }

    if (commission.commission_amount !== amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Amount mismatch' 
      }, { status: 400 });
    }

    // Create Razorpay order
    try {
      const orderRequestData = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `comm_${commission_id.slice(-8)}_${Date.now().toString().slice(-8)}`,
        notes: {
          commission_id: commission_id,
          provider_id: provider_id,
          type: 'commission_payment'
        }
      };

      console.log('🔍 [PAY-COMMISSION] Creating Razorpay order:', orderRequestData);
      console.log('🔍 [PAY-COMMISSION] Environment check:', {
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not set',
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not set'
      });

      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error('❌ [PAY-COMMISSION] Razorpay environment variables not configured');
        return NextResponse.json({ 
          success: false, 
          error: 'Payment gateway not configured. Please contact support.' 
        }, { status: 500 });
      }

      const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`
        },
        body: JSON.stringify(orderRequestData)
      });

      const orderResponseData = await orderResponse.json();

      if (!orderResponse.ok) {
        console.error('❌ [PAY-COMMISSION] Razorpay order creation failed:', orderResponseData);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create payment order: ' + (orderResponseData.error?.description || 'Unknown error') 
        }, { status: 500 });
      }

      console.log('✅ [PAY-COMMISSION] Razorpay order created:', orderResponseData);

      // Update commission record with order details
      await databases.updateDocument(
        DATABASE_ID,
        'commission_collections',
        commission_id,
        {
          razorpay_order_id: orderResponseData.id,
          payment_status: 'pending',
          updated_at: new Date().toISOString()
        }
      );

      return NextResponse.json({
        success: true,
        order_id: orderResponseData.id,
        amount: orderResponseData.amount,
        currency: orderResponseData.currency,
        key: process.env.RAZORPAY_KEY_ID
      });

    } catch (error: any) {
      console.error('❌ [PAY-COMMISSION] Error creating Razorpay order:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create payment order: ' + error.message 
      }, { status: 500 });
    }

  } catch (e: any) {
    console.error('❌ [PAY-COMMISSION] Unexpected error:', e.message, e);
    return NextResponse.json({ 
      success: false, 
      error: e.message || 'Server error' 
    }, { status: 500 });
  }
} 