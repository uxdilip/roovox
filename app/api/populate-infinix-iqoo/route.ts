import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

// Infinix and iQOO phone data
const PHONE_DATA = [
  // Infinix - Note Series
  { brand: 'Infinix', model: 'Note 12i 2022', series_name: 'Note Series' },
  { brand: 'Infinix', model: 'Note 12 5G', series_name: 'Note Series' },
  { brand: 'Infinix', model: 'Note 12 Pro 4G', series_name: 'Note Series' },
  { brand: 'Infinix', model: 'Note 12 VIP', series_name: 'Note Series' },
  { brand: 'Infinix', model: 'Note 12 G96', series_name: 'Note Series' },
  { brand: 'Infinix', model: 'Note 12 2023', series_name: 'Note Series' },
  { brand: 'Infinix', model: 'Note 10', series_name: 'Note Series' },

  // Infinix - Smart Series
  { brand: 'Infinix', model: 'Smart 7 HD', series_name: 'Smart Series' },
  { brand: 'Infinix', model: 'Smart 6 HD', series_name: 'Smart Series' },
  { brand: 'Infinix', model: 'Smart 6 Plus', series_name: 'Smart Series' },
  { brand: 'Infinix', model: 'Smart 8', series_name: 'Smart Series' },
  { brand: 'Infinix', model: 'Smart 8 HD', series_name: 'Smart Series' },
  { brand: 'Infinix', model: 'Smart 7', series_name: 'Smart Series' },

  // Infinix - Hot Series
  { brand: 'Infinix', model: 'Hot 20i', series_name: 'Hot Series' },
  { brand: 'Infinix', model: 'Hot 11 2022', series_name: 'Hot Series' },
  { brand: 'Infinix', model: 'Hot 40', series_name: 'Hot Series' },
  { brand: 'Infinix', model: 'Hot 30', series_name: 'Hot Series' },
  { brand: 'Infinix', model: 'Hot 30 Play', series_name: 'Hot Series' },
  { brand: 'Infinix', model: 'Hot 20 4G', series_name: 'Hot Series' },
  { brand: 'Infinix', model: 'Hot 20S', series_name: 'Hot Series' },
  { brand: 'Infinix', model: 'Hot 20 Play', series_name: 'Hot Series' },
  { brand: 'Infinix', model: 'Hot 20 5G', series_name: 'Hot Series' },
  { brand: 'Infinix', model: 'Hot 12 Pro', series_name: 'Hot Series' },

  // Infinix - Zero Series
  { brand: 'Infinix', model: 'Zero 5G 2023', series_name: 'Zero Series' },

  // iQOO - Number Series
  { brand: 'iQOO', model: '5 Pro', series_name: 'Number Series' },
  { brand: 'iQOO', model: '10', series_name: 'Number Series' },
  { brand: 'iQOO', model: '7 5G', series_name: 'Number Series' },
  { brand: 'iQOO', model: '7 Legend 5G', series_name: 'Number Series' },
  { brand: 'iQOO', model: '9 SE 5G', series_name: 'Number Series' },

  // iQOO - Neo Series
  { brand: 'iQOO', model: 'Neo 6 5G', series_name: 'Neo Series' },
  { brand: 'iQOO', model: 'Neo 7 5G', series_name: 'Neo Series' },

  // iQOO - Z Series
  { brand: 'iQOO', model: 'Z8', series_name: 'Z Series' },
  { brand: 'iQOO', model: 'Z9 Lite 5G', series_name: 'Z Series' },

  // iQOO - U Series
  { brand: 'iQOO', model: 'U5', series_name: 'U Series' },
  { brand: 'iQOO', model: 'U1x', series_name: 'U Series' },
  { brand: 'iQOO', model: 'U5x', series_name: 'U Series' },
  { brand: 'iQOO', model: 'U5e', series_name: 'U Series' },
  { brand: 'iQOO', model: 'U3x 4G', series_name: 'U Series' }
];

export async function POST(request: NextRequest) {
  try {
    const results = [];
    const errors = [];

    for (const phoneData of PHONE_DATA) {
      try {
        // Check if device already exists
        const existingDevices = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PHONES,
          [
            Query.equal('brand', phoneData.brand),
            Query.equal('model', phoneData.model)
          ]
        );

        if (existingDevices.documents.length > 0) {
          results.push({
            status: 'skipped',
            brand: phoneData.brand,
            model: phoneData.model,
            reason: 'Already exists'
          });
          continue;
        }

        // Create new device
        const result = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PHONES,
          ID.unique(),
          {
            brand: phoneData.brand,
            model: phoneData.model,
            series_name: phoneData.series_name
          }
        );

        results.push({
          status: 'created',
          id: result.$id,
          brand: phoneData.brand,
          model: phoneData.model,
          series_name: phoneData.series_name
        });

      } catch (error: any) {
        errors.push({
          brand: phoneData.brand,
          model: phoneData.model,
          error: error.message
        });
      }
    }

    const summary = {
      total: PHONE_DATA.length,
      created: results.filter(r => r.status === 'created').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errorCount: errors.length,
      results,
      errors
    };

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${PHONE_DATA.length} phone models`,
      summary
    });

  } catch (error: any) {
    console.error('Error populating phones:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');

    let queries = [];
    if (brand) {
      queries.push(Query.equal('brand', brand));
    }

    const phones = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PHONES,
      queries
    );

    return NextResponse.json({
      success: true,
      count: phones.documents.length,
      phones: phones.documents
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 