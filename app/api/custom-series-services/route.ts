import { NextRequest, NextResponse } from 'next/server';
import { 
  createCustomSeriesService, 
  getCustomSeriesServices, 
  updateCustomSeriesService 
} from '@/lib/appwrite-services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customSeriesId = searchParams.get('customSeriesId');
    
    if (!customSeriesId) {
      return NextResponse.json({ error: 'Custom Series ID is required' }, { status: 400 });
    }
    
    const services = await getCustomSeriesServices(customSeriesId);
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching custom series services:', error);
    return NextResponse.json({ error: 'Failed to fetch custom series services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customSeriesId, providerId, issue, partType, price, warranty } = body;
    
    if (!customSeriesId || !providerId || !issue || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const service = await createCustomSeriesService({
      customSeriesId,
      providerId,
      issue,
      partType,
      price,
      warranty,
    });
    
    return NextResponse.json(service);
  } catch (error) {
    console.error('Error creating custom series service:', error);
    return NextResponse.json({ error: 'Failed to create custom series service' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, updates } = body;
    
    if (!serviceId || !updates) {
      return NextResponse.json({ error: 'Service ID and updates are required' }, { status: 400 });
    }
    
    const service = await updateCustomSeriesService(serviceId, updates);
    return NextResponse.json(service);
  } catch (error) {
    console.error('Error updating custom series service:', error);
    return NextResponse.json({ error: 'Failed to update custom series service' }, { status: 500 });
  }
} 