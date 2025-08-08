import { NextRequest, NextResponse } from 'next/server';
import { updatePhonesWithSeriesMapping } from '@/lib/appwrite-services';

export async function POST(request: NextRequest) {
  try {
    await updatePhonesWithSeriesMapping();
    return NextResponse.json({ 
      success: true, 
      message: 'Phones updated with series mapping successfully' 
    });
  } catch (error: any) {
    console.error('Error updating phones with series mapping:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 