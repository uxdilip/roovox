'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Database, Smartphone } from 'lucide-react';

interface PhoneData {
  brand: string;
  model: string;
}

interface BrandSummary {
  brand: string;
  modelCount: number;
}

export default function ExportPhonesPage() {
  const [phones, setPhones] = useState<PhoneData[]>([]);
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPhones, setTotalPhones] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ExportPhonesPage mounted');
    fetchPhones();
  }, []);

  const fetchPhones = async () => {
    setLoading(true);
    try {
      console.log('Fetching phones...');
      const response = await fetch('/api/phones');
      const data = await response.json();
      console.log('API response:', data);
      
      if (data.success) {
        const phoneData = data.phones || [];
        console.log('Phone data length:', phoneData.length);
        setPhones(phoneData);
        setTotalPhones(phoneData.length);
        
        // Group by brand and create summary
        const brandMap = new Map<string, { modelCount: number }>();
        
        phoneData.forEach((phone: PhoneData) => {
          if (!brandMap.has(phone.brand)) {
            brandMap.set(phone.brand, { modelCount: 0 });
          }
          const brandInfo = brandMap.get(phone.brand)!;
          brandInfo.modelCount++;
        });

        const brandSummary: BrandSummary[] = Array.from(brandMap.entries()).map(([brand, info]) => ({
          brand,
          modelCount: info.modelCount
        }));

        console.log('Brand summary:', brandSummary);
        setBrands(brandSummary.sort((a, b) => b.modelCount - a.modelCount));
      } else {
        console.error('API returned success: false');
      }
    } catch (error) {
      console.error('Error fetching phones:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (phones.length === 0) return;

    // Create CSV content
    const csvContent = [
      'Brand,Model',
      ...phones.map(phone => `${phone.brand},${phone.model}`)
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `phone-collection-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadBrandsCSV = () => {
    if (brands.length === 0) return;

    // Create CSV content for brands summary
    const csvContent = [
      'Brand,Model Count',
      ...brands.map(brand => `${brand.brand},${brand.modelCount}`)
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `phone-brands-summary-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Phone Collection Export</h1>
        <p className="text-gray-600">Export your complete phone collection data</p>
        <div className="mt-4">
          <Button onClick={fetchPhones} variant="outline" size="sm">
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Phones</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPhones}</div>
            <p className="text-xs text-muted-foreground">All phone models</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
            <p className="text-xs text-muted-foreground">Phone manufacturers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Models</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brands.length > 0 ? Math.round(totalPhones / brands.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per brand</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Complete Collection Export
            </CardTitle>
            <CardDescription>
              Download all phone models with brand and model name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={downloadCSV} 
              disabled={loading || phones.length === 0}
              className="w-full"
            >
              {loading ? 'Loading...' : `Download CSV (${totalPhones} phones)`}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Brands Summary Export
            </CardTitle>
            <CardDescription>
              Download brand summary with model counts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={downloadBrandsCSV} 
              disabled={loading || brands.length === 0}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Loading...' : `Download Summary (${brands.length} brands)`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Brands Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Brands Overview</CardTitle>
          <CardDescription>
            Summary of all phone brands in your collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading phone collection...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">Error: {error}</div>
              <Button onClick={fetchPhones} variant="outline">Retry</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {brands.map((brand) => (
                <div key={brand.brand} className="flex items-center justify-between p-4 border rounded-lg">
                                     <div className="flex-1">
                     <h3 className="font-semibold text-lg">{brand.brand}</h3>
                   </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{brand.modelCount}</div>
                    <div className="text-sm text-gray-500">models</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 