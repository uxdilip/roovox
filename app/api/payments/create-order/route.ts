import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { serverDatabases, SERVER_DATABASE_ID } from '@/lib/appwrite-services';

export async function POST(req: NextRequest) {
  try {
    const { booking_id, amount } = await req.json();
    console.log('Create order request:', { booking_id, amount });
    
    if (!booking_id || !amount) {
      console.log('Missing parameters:', { booking_id: !!booking_id, amount: !!amount });
      return NextResponse.json({ error: 'Missing booking_id or amount' }, { status: 400 });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      return NextResponse.json({ error: 'Razorpay keys not set in env' }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id, key_secret });
    const amountInPaisa = Math.round(Number(amount) * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaisa,
      currency: 'INR',
      receipt: booking_id,
      payment_capture: true,
    });

    return NextResponse.json({ 
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: key_id
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create Razorpay order' }, { status: 500 });
  }
} 