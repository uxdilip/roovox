'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Smartphone, Laptop, Settings, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getModelSeries } from '@/lib/appwrite-services';
import PlatformSeriesCustomizationModal from './ServiceModals/PlatformSeriesCustomizationModal';

interface PlatformSeriesSelectorProps {
  deviceType?: 'phone' | 'laptop';
}

export default function PlatformSeriesSelector({ 
  deviceType = 'phone' 
}: PlatformSeriesSelectorProps) {
  const [platformSeries, setPlatformSeries] = useState<any[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [customizationModal, setCustomizationModal] = useState<{
    isOpen: boolean;
    series: any;
  }>({ isOpen: false, series: null });

  useEffect(() => {
    loadPlatformSeries();
  }, [deviceType]);

  useEffect(() => {
    filterSeries();
  }, [searchTerm, selectedBrand, platformSeries]);

  const loadPlatformSeries = async () => {
    try {
      setIsLoading(true);
      const series = await getModelSeries(undefined, deviceType);
      setPlatformSeries(series);
    } catch (error) {
      console.error('Error loading platform series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSeries = () => {
    let filtered = platformSeries;

    if (searchTerm) {
      filtered = filtered.filter(series =>
        series.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        series.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        series.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedBrand && selectedBrand !== 'all') {
      filtered = filtered.filter(series => series.brand === selectedBrand);
    }

    setFilteredSeries(filtered);
  };

  const getBrands = () => {
    const brands = ['all', ...Array.from(new Set(platformSeries.map(s => s.brand)))];
    return brands;
  };

  const handleCustomize = (series: any) => {
    setCustomizationModal({ isOpen: true, series });
  };

  const handleCustomizationSuccess = () => {
    // Refresh the series list
    loadPlatformSeries();
  };

  const getDeviceIcon = (type: string) => {
    return type === 'phone' ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />;
  };

  const getBrandColor = (brand: string) => {
    const colors: Record<string, string> = {
      'Apple': 'bg-gray-100 text-gray-800',
      'Samsung': 'bg-blue-100 text-blue-800',
      'Xiaomi': 'bg-orange-100 text-orange-800',
      'Vivo': 'bg-purple-100 text-purple-800',
      'Realme': 'bg-yellow-100 text-yellow-800',
      'OPPO': 'bg-green-100 text-green-800',
      'OnePlus': 'bg-red-100 text-red-800',
      'Multi-Brand': 'bg-indigo-100 text-indigo-800'
    };
    return colors[brand] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getDeviceIcon(deviceType)}
          <h3 className="text-lg font-semibold">Platform Series Templates</h3>
          <Badge variant="secondary" className="text-xs">
            {platformSeries.length} templates available
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search series by name, description, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {getBrands().map((brand) => (
            <option key={brand} value={brand}>
              {brand === 'all' ? 'All Brands' : brand}
            </option>
          ))}
        </select>
      </div>

      {/* Series Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSeries.map((series) => (
          <Card key={series.$id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-medium line-clamp-2">
                    {series.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {series.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Brand Badge */}
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`text-xs ${getBrandColor(series.brand)}`}>
                  {series.brand}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {series.models.length} models
                </Badge>
              </div>

              {/* Model Preview */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Sample models:</p>
                <div className="flex flex-wrap gap-1">
                  {series.models.slice(0, 3).map((model: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {model.split(':')[1]}
                    </Badge>
                  ))}
                  {series.models.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{series.models.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCustomize(series)}
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Customize
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredSeries.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No platform series found matching your criteria.</p>
          <p className="text-sm">Try adjusting your search or brand filter.</p>
        </div>
      )}

      {/* Customization Modal */}
      <PlatformSeriesCustomizationModal
        isOpen={customizationModal.isOpen}
        onClose={() => setCustomizationModal({ isOpen: false, series: null })}
        platformSeries={customizationModal.series}
        onSuccess={handleCustomizationSuccess}
      />
    </div>
  );
} 