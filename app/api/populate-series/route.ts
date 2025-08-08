import { NextRequest, NextResponse } from 'next/server';
import { populateModelSeries } from '@/lib/appwrite-services';

export async function POST(request: NextRequest) {
  try {
    await populateModelSeries();
    return NextResponse.json({ 
      success: true, 
      message: 'Model series populated successfully' 
    });
  } catch (error: any) {
    console.error('Error populating model series:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 