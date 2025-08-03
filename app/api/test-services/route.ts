import { NextResponse } from 'next/server';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export async function GET() {
  try {
    // Get all services_offered documents
    const servicesRes = await databases.listDocuments(
      DATABASE_ID,
      'services_offered',
      [Query.limit(100)]
    );

    // Get all providers
    const providersRes = await databases.listDocuments(
      DATABASE_ID,
      'providers',
      [Query.limit(100)]
    );

    return NextResponse.json({
      services_offered: {
        count: servicesRes.documents.length,
        documents: servicesRes.documents
      },
      providers: {
        count: providersRes.documents.length,
        documents: providersRes.documents
      }
    });
  } catch (error) {
    console.error('Error fetching test data:', error);
    return NextResponse.json({ error: 'Failed to fetch test data' }, { status: 500 });
  }
} 