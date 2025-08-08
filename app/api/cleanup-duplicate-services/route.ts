import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting cleanup of duplicate services...');
    
    // Get all series-based services
    const servicesRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SERVICES_OFFERED,
      [Query.isNull('model')] // Only series-based services
    );
    
    const services = servicesRes.documents;
    console.log(`🔍 Found ${services.length} series-based services`);
    
    // Group services by provider, series, issue, and partType
    const serviceGroups = new Map();
    const duplicates: Array<{
      existing: any;
      duplicate: any;
      key: string;
    }> = [];
    
    services.forEach(service => {
      const key = `${service.providerId}-${service.series_id}-${service.issue}-${service.partType || 'null'}`;
      
      if (serviceGroups.has(key)) {
        // This is a duplicate
        const existing = serviceGroups.get(key);
        duplicates.push({
          existing: existing,
          duplicate: service,
          key: key
        });
      } else {
        serviceGroups.set(key, service);
      }
    });
    
    console.log(`🔍 Found ${duplicates.length} duplicate entries`);
    
    // Delete duplicates (keep the first one)
    let deletedCount = 0;
    for (const duplicate of duplicates) {
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.SERVICES_OFFERED,
          duplicate.duplicate.$id
        );
        deletedCount++;
        console.log(`🗑️ Deleted duplicate: ${duplicate.duplicate.$id}`);
      } catch (error) {
        console.error(`❌ Failed to delete duplicate ${duplicate.duplicate.$id}:`, error);
      }
    }
    
    console.log(`✅ Cleanup completed: ${deletedCount} duplicates removed`);
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${deletedCount} duplicate entries removed`,
      totalServices: services.length,
      duplicatesFound: duplicates.length,
      duplicatesRemoved: deletedCount
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup duplicates' },
      { status: 500 }
    );
  }
} 