import { NextRequest, NextResponse } from 'next/server';
import { getPhones } from '@/lib/appwrite-services';

export async function GET(request: NextRequest) {
  try {
    // Get all phones
    const allPhones = await getPhones();
    
    // Filter Samsung phones
    const samsungPhones = allPhones.filter(phone => 
      phone.brand.toLowerCase() === 'samsung'
    );
    
    // Group by model patterns
    const modelAnalysis = {
      totalSamsungModels: samsungPhones.length,
      models: samsungPhones.map(phone => phone.model),
      patternMatches: {
        sSeries: samsungPhones.filter(phone => /^Galaxy\s+S\d+/.test(phone.model)),
        aSeries: samsungPhones.filter(phone => /^Galaxy\s+A\d+/.test(phone.model)),
        mSeries: samsungPhones.filter(phone => /^Galaxy\s+M\d+/.test(phone.model)),
        fSeries: samsungPhones.filter(phone => /^Galaxy\s+F\d+/.test(phone.model)),
        zSeries: samsungPhones.filter(phone => /^Galaxy\s+Z\s*(Fold|Flip)/.test(phone.model)),
        noteSeries: samsungPhones.filter(phone => /^Galaxy\s+Note\s*\d+/.test(phone.model)),
        other: samsungPhones.filter(phone => 
          !/^Galaxy\s+S\d+/.test(phone.model) &&
          !/^Galaxy\s+A\d+/.test(phone.model) &&
          !/^Galaxy\s+M\d+/.test(phone.model) &&
          !/^Galaxy\s+F\d+/.test(phone.model) &&
          !/^Galaxy\s+Z\s*(Fold|Flip)/.test(phone.model) &&
          !/^Galaxy\s+Note\s*\d+/.test(phone.model)
        )
      }
    };
    
    return NextResponse.json({ 
      success: true, 
      data: modelAnalysis 
    });
  } catch (error: any) {
    console.error('Error debugging Samsung models:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 