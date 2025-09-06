import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export async function POST(request: NextRequest) {
  try {
    const { userId, userType } = await request.json();

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'Missing userId or userType' },
        { status: 400 }
      );
    }

    const result: any = {
      userId,
      userType,
      lookups: {}
    };

    // Test User collection lookup
    try {
      const userResponse = await databases.listDocuments(
        DATABASE_ID,
        'User',
        [Query.equal('user_id', userId), Query.limit(1)]
      );
      
      result.lookups.User = {
        found: userResponse.documents.length > 0,
        data: userResponse.documents[0] || null
      };
    } catch (error: any) {
      result.lookups.User = { error: error.message };
    }

    if (userType === 'customer') {
      // Test customers collection lookup
      try {
        const customerResponse = await databases.listDocuments(
          DATABASE_ID,
          'customers',
          [Query.equal('user_id', userId), Query.limit(1)]
        );
        
        result.lookups.customers = {
          found: customerResponse.documents.length > 0,
          data: customerResponse.documents[0] || null
        };
      } catch (error: any) {
        result.lookups.customers = { error: error.message };
      }
    }

    if (userType === 'provider') {
      // Test business_setup collection lookup
      try {
        const businessResponse = await databases.listDocuments(
          DATABASE_ID,
          'business_setup',
          [Query.equal('user_id', userId), Query.limit(1)]
        );
        
        result.lookups.business_setup = {
          found: businessResponse.documents.length > 0,
          data: businessResponse.documents[0] || null
        };
      } catch (error: any) {
        result.lookups.business_setup = { error: error.message };
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Test user lookup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
