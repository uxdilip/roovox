import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 [TEST-COLLECTIONS] Testing collections...');
    
    const results: any = {
      errors: [],
      payments: [],
      commissionCollections: [],
      collectionsExist: {
        payments: false,
        commission_collections: false
      }
    };

    // Test payments collection
    try {
      console.log('🔍 [TEST-COLLECTIONS] Testing payments collection...');
      const paymentsResponse = await databases.listDocuments(
        DATABASE_ID,
        'payments',
        [Query.limit(10)]
      );
      
      results.payments = paymentsResponse.documents;
      results.collectionsExist.payments = true;
      console.log('✅ [TEST-COLLECTIONS] Payments collection exists, found', paymentsResponse.documents.length, 'records');
    } catch (error: any) {
      console.error('❌ [TEST-COLLECTIONS] Payments collection error:', error.message);
      results.errors.push(`Payments collection error: ${error.message}`);
    }

    // Test commission_collections collection
    try {
      console.log('🔍 [TEST-COLLECTIONS] Testing commission_collections collection...');
      const commissionResponse = await databases.listDocuments(
        DATABASE_ID,
        'commission_collections',
        [Query.limit(10)]
      );
      
      results.commissionCollections = commissionResponse.documents;
      results.collectionsExist.commission_collections = true;
      console.log('✅ [TEST-COLLECTIONS] Commission collections collection exists, found', commissionResponse.documents.length, 'records');
      
      // Log each commission collection for debugging
      commissionResponse.documents.forEach((doc: any, index: number) => {
        console.log(`🔍 [TEST-COLLECTIONS] Commission ${index + 1}:`, {
          id: doc.$id,
          booking_id: doc.booking_id,
          provider_id: doc.provider_id,
          status: doc.status,
          commission_amount: doc.commission_amount,
          created_at: doc.created_at
        });
      });
    } catch (error: any) {
      console.error('❌ [TEST-COLLECTIONS] Commission collections collection error:', error.message);
      results.errors.push(`Commission collections collection error: ${error.message}`);
    }

    // Check for COD payments
    const codPayments = results.payments.filter((p: any) => p.payment_method === 'COD');
    console.log('🔍 [TEST-COLLECTIONS] Found', codPayments.length, 'COD payments');

    // Check for pending commission collections
    const pendingCommissions = results.commissionCollections.filter((c: any) => c.status === 'pending');
    console.log('🔍 [TEST-COLLECTIONS] Found', pendingCommissions.length, 'pending commission collections');

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('❌ [TEST-COLLECTIONS] Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Server error',
      errors: [error.message || 'Server error']
    }, { status: 500 });
  }
} 