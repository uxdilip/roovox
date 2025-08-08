import { NextRequest, NextResponse } from 'next/server';
import { getPhones, getModelSeries } from '@/lib/appwrite-services';

export async function GET(request: NextRequest) {
  try {
    // Get all series
    const allSeries = await getModelSeries();
    console.log('Total series found:', allSeries.length);
    
    // Get all phones
    const allPhones = await getPhones();
    console.log('Total phones found:', allPhones.length);
    
    // Create series mapping
    const seriesMap = new Map();
    allSeries.forEach(series => {
      series.models.forEach((model: string) => {
        seriesMap.set(model.toLowerCase(), {
          series_id: series.$id,
          series_name: series.name,
          brand: series.brand,
          device_type: series.device_type
        });
      });
    });
    
    console.log('Series map created with', seriesMap.size, 'entries');
    
    // Check which phones would be updated
    const samsungPhones = allPhones.filter(phone => phone.brand.toLowerCase() === 'samsung');
    const updateAnalysis = {
      totalSamsungPhones: samsungPhones.length,
      phonesWithSeriesMatch: 0,
      phonesWithoutSeriesMatch: 0,
      matchedPhones: [] as any[],
      unmatchedPhones: [] as any[]
    };
    
    samsungPhones.forEach(phone => {
      const modelKey = phone.model.toLowerCase();
      const seriesInfo = seriesMap.get(modelKey);
      
      if (seriesInfo && seriesInfo.brand === phone.brand) {
        updateAnalysis.phonesWithSeriesMatch++;
        updateAnalysis.matchedPhones.push({
          model: phone.model,
          series: seriesInfo.series_name,
          has_series_id: !!phone.series_id,
          has_series_name: !!phone.series_name
        });
      } else {
        updateAnalysis.phonesWithoutSeriesMatch++;
        updateAnalysis.unmatchedPhones.push({
          model: phone.model,
          modelKey: modelKey,
          availableSeriesKeys: Array.from(seriesMap.keys()).filter(key => key.includes(phone.brand.toLowerCase()))
        });
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: {
        seriesCount: allSeries.length,
        phoneCount: allPhones.length,
        samsungPhoneCount: samsungPhones.length,
        seriesMapSize: seriesMap.size,
        updateAnalysis
      }
    });
  } catch (error: any) {
    console.error('Error debugging phone update:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 