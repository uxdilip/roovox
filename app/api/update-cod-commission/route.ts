import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';

export async function POST(req: NextRequest) {
  try {
    const { payment_id, total_amount } = await req.json();
    
    if (!payment_id || !total_amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing payment_id or total_amount' 
      }, { status: 400 });
    }

    console.log('🔍 [UPDATE-COD-COMMISSION] Updating payment:', {
      payment_id,
      total_amount
    });

    // Calculate correct commission
    const commissionAmount = total_amount * 0.10; // 10% commission
    const providerPayout = total_amount * 0.90;   // 90% to provider

    console.log('💰 [UPDATE-COD-COMMISSION] Commission calculation:', {
      total_amount,
      commission_amount: commissionAmount,
      provider_payout: providerPayout
    });

    // Update the payment record
    try {
      const updatedPayment = await databases.updateDocument(
        DATABASE_ID,
        'payments',
        payment_id,
        {
          commission_amount: commissionAmount,
          provider_payout: providerPayout,
          updated_at: new Date().toISOString()
        }
      );
      
      console.log('✅ [UPDATE-COD-COMMISSION] Payment updated successfully');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment updated with correct commission',
        data: {
          payment_id: updatedPayment.$id,
          commission_amount: commissionAmount,
          provider_payout: providerPayout
        }
      });
    } catch (error: any) {
      console.error('❌ [UPDATE-COD-COMMISSION] Error updating payment:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update payment: ' + error.message 
      }, { status: 500 });
    }
  } catch (e: any) {
    console.error('❌ [UPDATE-COD-COMMISSION] Unexpected error:', e.message, e);
    return NextResponse.json({ 
      success: false, 
      error: e.message || 'Server error' 
    }, { status: 500 });
  }
} 