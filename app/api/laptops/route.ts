export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');

    let queries = [];
    if (brand) {
      queries.push(Query.equal('brand', brand));
    }

    // Get all laptops with a higher limit
    queries.push(Query.limit(1000));

    const laptops = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.LAPTOPS,
      queries
    );

    return NextResponse.json({ 
      success: true, 
      laptops: laptops.documents,
      total: laptops.total 
    });
  } catch (error: any) {
    console.error('Error fetching laptops:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
