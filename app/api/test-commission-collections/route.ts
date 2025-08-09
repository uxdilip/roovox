import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 [TEST-COMMISSION-COLLECTIONS] Testing commission_collections collection...');
    
    const commissionResponse = await databases.listDocuments(
      DATABASE_ID,
      'commission_collections',
      []
    );
    
    console.log('✅ [TEST-COMMISSION-COLLECTIONS] Found', commissionResponse.documents.length, 'commission collections');
    
    const results = {
      count: commissionResponse.documents.length,
      documents: commissionResponse.documents.map((doc: any) => ({
        id: doc.$id,
        booking_id: doc.booking_id,
        provider_id: doc.provider_id,
        status: doc.status,
        commission_amount: doc.commission_amount,
        created_at: doc.created_at
      }))
    };
    
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('❌ [TEST-COMMISSION-COLLECTIONS] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Server error',
      count: 0,
      documents: []
    }, { status: 500 });
  }
} 