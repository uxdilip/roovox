import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';

export async function GET() {
  try {
    // Test database connection
    const bookings = await databases.listDocuments(DATABASE_ID, 'bookings');
    const payments = await databases.listDocuments(DATABASE_ID, 'payments');
    
    return NextResponse.json({
      success: true,
      message: "Database connection working",
      bookingCount: bookings.documents.length,
      paymentCount: payments.documents.length,
      payments: payments.documents.map(p => ({
        id: p.$id,
        booking_id: p.booking_id,
        amount: p.amount,
        status: p.status,
        payment_method: p.payment_method
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 