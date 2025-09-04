import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { serverDatabases, SERVER_DATABASE_ID } from '@/lib/appwrite-services';

export async function POST(req: NextRequest) {
  try {
    const { amount, session_key } = await req.json();
    
    if (!amount || !session_key) {
      return NextResponse.json({ success: false, error: 'Missing amount or session_key' }, { status: 400 });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret) {
      console.error('Razorpay configuration error: Keys not found in environment variables');
      return NextResponse.json({ 
        success: false,
        error: 'Payment configuration error - authentication keys missing' 
      }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id, key_secret });
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: session_key,
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json({ 
      success: true, 
      order: {
        ...order,
        key_id: key_id // Include the key_id in the response
      }
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create order' }, { status: 500 });
  }
} 