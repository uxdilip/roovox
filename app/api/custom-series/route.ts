import { NextRequest, NextResponse } from 'next/server';
import { 
  createCustomSeries, 
  getCustomSeriesByProvider, 
  updateCustomSeries, 
  deleteCustomSeries 
} from '@/lib/appwrite-services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    
    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }
    
    const series = await getCustomSeriesByProvider(providerId);
    return NextResponse.json(series);
  } catch (error) {
    console.error('Error fetching custom series:', error);
    return NextResponse.json({ error: 'Failed to fetch custom series' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, name, description, deviceType, models } = body;
    
    if (!providerId || !name || !deviceType || !models) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    
    const series = await createCustomSeries({
      providerId,
      name,
      description,
      deviceType,
      models,
    });
    
    return NextResponse.json(series);
  } catch (error) {
    console.error('Error creating custom series:', error);
    return NextResponse.json({ 
      error: 'Failed to create custom series', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { seriesId, updates } = body;
    
    if (!seriesId || !updates) {
      return NextResponse.json({ error: 'Series ID and updates are required' }, { status: 400 });
    }
    
    const series = await updateCustomSeries(seriesId, updates);
    return NextResponse.json(series);
  } catch (error) {
    console.error('Error updating custom series:', error);
    return NextResponse.json({ error: 'Failed to update custom series' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('seriesId');
    
    if (!seriesId) {
      return NextResponse.json({ error: 'Series ID is required' }, { status: 400 });
    }
    
    await deleteCustomSeries(seriesId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom series:', error);
    return NextResponse.json({ error: 'Failed to delete custom series' }, { status: 500 });
  }
} 