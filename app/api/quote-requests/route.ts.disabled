import { NextRequest, NextResponse } from 'next/server';
import { createCustomerRequest } from '@/lib/negotiation-services';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    // Validate required fields
    const requiredFields = ['customer_id', 'provider_id', 'device_info', 'requirements', 'timeline', 'urgency_level'];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Create the customer request
    const result = await createCustomerRequest(requestData.customer_id, requestData);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        requestId: result.requestId 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error creating quote request:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
