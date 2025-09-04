import { NextRequest, NextResponse } from 'next/server';
import { updatePhonePrices, getUpdateStatistics, testUpdateSinglePhone } from '@/lib/scripts/update-phone-prices';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { action, brand, model } = await request.json();

    switch (action) {
      case 'update_all':
        const result = await updatePhonePrices();
        return NextResponse.json(result);

      case 'test_single':
        if (!brand || !model) {
          return NextResponse.json({
            success: false,
            error: 'Brand and model are required for single phone test'
          }, { status: 400 });
        }
        
        const testResult = await testUpdateSinglePhone(brand, model);
        return NextResponse.json({
          success: true,
          message: `Test completed for ${brand} ${model}`,
          result: testResult
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "update_all" or "test_single"'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in phone price update API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'statistics') {
      const stats = await getUpdateStatistics();
      return NextResponse.json({
        success: true,
        statistics: stats
      });
    }

    // Return available actions
    return NextResponse.json({
      success: true,
      message: 'Phone Price Update API',
      available_actions: {
        'POST update_all': 'Update all phones with prices and tiers',
        'POST test_single': 'Test update for a single phone (requires brand and model)',
        'GET statistics': 'Get current update statistics'
      },
      example_usage: {
        'Update all phones': 'POST /api/update-phone-prices with { "action": "update_all" }',
        'Test single phone': 'POST /api/update-phone-prices with { "action": "test_single", "brand": "Apple", "model": "iPhone 15" }',
        'Get statistics': 'GET /api/update-phone-prices?action=statistics'
      }
    });
  } catch (error) {
    console.error('Error in phone price update API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

