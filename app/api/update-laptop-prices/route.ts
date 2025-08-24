import { NextRequest, NextResponse } from 'next/server';
import { updateLaptopPrices, getLaptopUpdateStatistics, testUpdateSingleLaptop } from '@/lib/scripts/update-laptop-prices';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { action, brand, model } = await request.json();

    switch (action) {
      case 'update_all':
        console.log('🔄 Starting bulk laptop price update...');
        const result = await updateLaptopPrices();
        return NextResponse.json(result);

      case 'test_single':
        if (!brand || !model) {
          return NextResponse.json({
            success: false,
            error: 'Brand and model are required for single laptop test'
          }, { status: 400 });
        }
        
        console.log(`🧪 Testing single laptop update: ${brand} ${model}`);
        const testResult = await testUpdateSingleLaptop(brand, model);
        return NextResponse.json({
          success: testResult,
          message: testResult ? 
            `Successfully tested ${brand} ${model}` : 
            `Failed to test ${brand} ${model}`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "update_all" or "test_single"'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('💥 API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'statistics':
        console.log('📊 Getting laptop update statistics...');
        const stats = await getLaptopUpdateStatistics();
        return NextResponse.json({
          success: true,
          data: stats,
          message: `Statistics: ${stats.total} total laptops, ${stats.with_prices} with prices, ${stats.with_tiers} with tiers`
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Laptop price update API is ready',
          endpoints: {
            'POST /api/update-laptop-prices': {
              'update_all': 'Update all laptops with prices and tiers',
              'test_single': 'Test update single laptop (requires brand and model)'
            },
            'GET /api/update-laptop-prices?action=statistics': 'Get laptop update statistics'
          }
        });
    }

  } catch (error: any) {
    console.error('💥 API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

