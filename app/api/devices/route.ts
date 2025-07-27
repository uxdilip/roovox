export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');

    let queries = [];
    if (category) {
      queries.push(Query.equal('category', category));
    }
    if (brand) {
      queries.push(Query.equal('brand', brand));
    }

    const devices = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.DEVICES,
      queries
    );

    return NextResponse.json({ success: true, devices: devices.documents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}