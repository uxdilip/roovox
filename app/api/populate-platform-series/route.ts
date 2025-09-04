import { NextRequest, NextResponse } from 'next/server';
import { populatePlatformSeries } from '@/lib/appwrite-services';

export async function POST(request: NextRequest) {
  try {
    
    await populatePlatformSeries();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Platform series populated successfully' 
    });
  } catch (error) {
    console.error('Error populating platform series:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to populate platform series' 
      },
      { status: 500 }
    );
  }
} 