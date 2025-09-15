"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Smartphone, Laptop, ChevronRight, Search, X } from 'lucide-react';
import { Device } from '@/types';
import Image from 'next/image';
import { getDevices, getPhones, getLaptops } from '@/lib/appwrite-services';
import { FAQAccordion } from '@/components/ui/faq-accordion';
import Link from 'next/link';

interface DeviceSelectorProps {
  onDeviceSelect: (device: any) => void;
}

export default function DeviceSelector({ onDeviceSelect }: DeviceSelectorProps) {
  // Simple state management
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'phone' | 'laptop' | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Simple session cache
  const [deviceCache, setDeviceCache] = useState<{
    phone?: Device[];
    laptop?: Device[];
  }>({});

  // Brand logo mapping function
  const getBrandLogo = (brand: string): string => {
    // Map brand names to their logo files (matching exact filenames in assets)
    const brandLogos: { [key: string]: string } = {
      // Phone brands
      'apple': '/assets/brand-logos/apple.png',
      'samsung': '/assets/brand-logos/samsung.png',
      'xiaomi': '/assets/brand-logos/mi.png',
      'mi': '/assets/brand-logos/mi.png',
      'oneplus': '/assets/brand-logos/oneplus.png',
      'vivo': '/assets/brand-logos/vivo.png',
      'oppo': '/assets/brand-logos/oppo.png',
      'realme': '/assets/brand-logos/realme.png',
      'nothing': '/assets/brand-logos/Nothing.png',
      'google': '/assets/brand-logos/google.png',
      'motorola': '/assets/brand-logos/motorola.png',
      'poco': '/assets/brand-logos/poco.jpg',
      'honor': '/assets/brand-logos/Honor.png',
      'nokia': '/assets/brand-logos/Nokia.png',
      'asus': '/assets/brand-logos/Asus.png',
      'infinix': '/assets/brand-logos/infinix.png',
      'iqoo': '/assets/brand-logos/iqoo.png',
      
      // Laptop brands
      'dell': '/assets/brand-logos/dell.png',
      'hp': '/assets/brand-logos/hp.png',
      'lenovo': '/assets/brand-logos/lenovo.png',
      'acer': '/assets/brand-logos/acer.png',
      'msi': '/assets/brand-logos/msi.svg',
      'razer': '/assets/brand-logos/razer.svg',
      'alienware': '/assets/brand-logos/alienware.svg',
      
      // Handle potential case variations
      'Dell': '/assets/brand-logos/dell.png',
      'HP': '/assets/brand-logos/hp.png',
      'Lenovo': '/assets/brand-logos/lenovo.png',
      'Acer': '/assets/brand-logos/acer.png',
      'MSI': '/assets/brand-logos/msi.svg',
      'Razer': '/assets/brand-logos/razer.svg',
      'Alienware': '/assets/brand-logos/alienware.svg',
      'ASUS': '/assets/brand-logos/Asus.png'
    };
    
    // First try exact match, then lowercase match, then fallback
    return brandLogos[brand] || brandLogos[brand.toLowerCase()] || '/assets/brand-placeholder.svg';
  };

  // Function to get device image URL - uses single model image for phones, existing logic for laptops
  const getDeviceImage = (brand: string, model: string, category: string) => {
    // For phones, use single model image
    if (category === 'phone') {
      return '/assets/model-image.jpg';
    }
    
    // For laptops, keep existing logic
    if (category === 'laptop') {
      const brandLower = brand.toLowerCase();
      const modelLower = model.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (brandLower === 'apple') {
        if (modelLower.includes('macbookpro16')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697311054290';
        if (modelLower.includes('macbookpro14')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697311054290';
        if (modelLower.includes('macbookpro13')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp13-spacegray-select-202206?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1653493201000';
        if (modelLower.includes('macbookair15')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-midnight-select-202306?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1683843331550';
        if (modelLower.includes('macbookair13')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-midnight-select-202206?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1653493201000';
      } else if (brandLower === 'dell') {
        if (modelLower.includes('xps13plus')) return 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dellwww/en-us/xps/xps-13-plus-9320/media-gallery/xs9320t-xnb-laptop-sl.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=402&qlt=100,1&resMode=sharp2&size=402,402';
        if (modelLower.includes('xps15')) return 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dellwww/en-us/xps/xps-15-9530/media-gallery/xs9530t-xnb-laptop-sl.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=402&qlt=100,1&resMode=sharp2&size=402,402';
        if (modelLower.includes('xps17')) return 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dellwww/en-us/xps/xps-17-9730/media-gallery/xs9730t-xnb-laptop-sl.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=402&qlt=100,1&resMode=sharp2&size=402,402';
      } else if (brandLower === 'hp') {
        if (modelLower.includes('spectrex36014')) return 'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08132951.png';
        if (modelLower.includes('spectrex36016')) return 'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08132951.png';
        if (modelLower.includes('envy16')) return 'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08132951.png';
        if (modelLower.includes('envy14')) return 'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08132951.png';
        if (modelLower.includes('pavilion15')) return 'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08132951.png';
      } else if (brandLower === 'lenovo') {
        if (modelLower.includes('thinkpadx1carbon')) return 'https://www.lenovo.com/medias/lenovo-laptop-thinkpad-x1-carbon-gen-11-14-intel-hero.png?context=bWFzdGVyfHJvb3R8MzQ1OTY2fGltYWdlL3BuZ3xoNWEvaGYwLzEzMjU1MTc1ODUwMzU4LnBuZ3wzZWI3ZTFmOTQ3Njg0ZWM4ZjRjY2M1NzFkZGNjYzFjYzA5ZWM4YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1';
        if (modelLower.includes('thinkpadx1yoga')) return 'https://www.lenovo.com/medias/lenovo-laptop-thinkpad-x1-yoga-gen-8-14-intel-hero.png?context=bWFzdGVyfHJvb3R8MzQ1OTY2fGltYWdlL3BuZ3xoNWEvaGYwLzEzMjU1MTc1ODUwMzU4LnBuZ3wzZWI3ZTFmOTQ3Njg0ZWM4ZjRjY2M1NzFkZGNjYzFjYzA5ZWM4YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1';
        if (modelLower.includes('thinkpadt14')) return 'https://www.lenovo.com/medias/lenovo-laptop-thinkpad-t14-gen-4-14-intel-hero.png?context=bWFzdGVyfHJvb3R8MzQ1OTY2fGltYWdlL3BuZ3xoNWEvaGYwLzEzMjU1MTc1ODUwMzU4LnBuZ3wzZWI3ZTFmOTQ3Njg0ZWM4ZjRjY2M1NzFkZGNjYzFjYzA5ZWM4YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1';
        if (modelLower.includes('yoga9i')) return 'https://www.lenovo.com/medias/lenovo-laptop-thinkpad-x1-yoga-gen-8-14-intel-hero.png?context=bWFzdGVyfHJvb3R8MzQ1OTY2fGltYWdlL3BuZ3xoNWEvaGYwLzEzMjU1MTc1ODUwMzU4LnBuZ3wzZWI3ZTFmOTQ3Njg0ZWM4ZjRjY2M1NzFkZGNjYzFjYzA5ZWM4YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1';
        if (modelLower.includes('ideapad5')) return 'https://www.lenovo.com/medias/lenovo-laptop-ideapad-5-15-amd-hero.png?context=bWFzdGVyfHJvb3R8MzQ1OTY2fGltYWdlL3BuZ3xoNWEvaGYwLzEzMjU1MTc1ODUwMzU4LnBuZ3wzZWI3ZTFmOTQ3Njg0ZWM4ZjRjY2M1NzFkZGNjYzFjYzA5ZWM4YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1';
      }
    }
    
    // Default fallback image for laptops
    return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697311054290';
  };

  // Industry-standard caching useEffect - Urban Company pattern
  useEffect(() => {
    const fetchDevices = async () => {
      if (!selectedCategory) {
        // Don't clear cache when going back to category selection
        setDevices([]);
        setLoading(false);
        return;
      }

      // Check if data is already cached - instant load
      if (deviceCache[selectedCategory]) {
        setDevices(deviceCache[selectedCategory]!);
        setLoading(false);
        return;
      }

      // Only show loading for first-time fetch of this category
      setLoading(true);
      let fetchedDevices: Device[] = [];
      
      try {
        if (selectedCategory === 'phone') {
          fetchedDevices = await getPhones();
        } else if (selectedCategory === 'laptop') {
          fetchedDevices = await getLaptops();
        }
        
        // Update state and cache simultaneously
        setDevices(fetchedDevices);
        
        // Cache the data for entire session (Urban Company pattern)
        setDeviceCache(prev => ({
          ...prev,
          [selectedCategory]: fetchedDevices
        }));
        
      } catch (error) {
        console.error('Error fetching devices:', error);
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [selectedCategory]); // Only depend on selectedCategory

  // Model filtering logic handled in component

  const categories = [
    { id: 'phone', name: 'Mobile Phones', icon: Smartphone },
    { id: 'laptop', name: 'Laptops', icon: Laptop }
  ];

  const brands = selectedCategory && devices?.length
    ? Array.from(new Set(devices.map(d => d.brand)))
    : [];

  // Filter models based on selected brand and search query
  const allModelsForBrand = selectedCategory && selectedBrand && devices?.length
    ? devices.filter(d => d.brand === selectedBrand)
    : [];

  const models = searchQuery
    ? allModelsForBrand.filter(model => 
        model.model.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allModelsForBrand;

  // Clear search when changing brand
  useEffect(() => {
    setSearchQuery('');
  }, [selectedBrand]);

  // FAQ data for customers
  const customerFaqItems = [
    {
      question: "How do I choose the right brand for my device?",
      answer: "Select the brand that matches your device exactly. If you're unsure, check your device's logo, boot screen, or go to Settings > About to find the manufacturer information."
    },
    {
      question: "What if my brand is not listed?",
      answer: "If your brand isn't listed, please contact our support team at support@sniket.com or call us. We're constantly adding new brands and may still be able to help with your repair."
    },
    {
      question: "Can you repair devices from any brand?",
      answer: "We support most major smartphone and laptop brands. For rare or less common brands, reach out to us for confirmation. We work with certified technicians who have experience with various devices."
    },
    {
      question: "Is my data safe during the repair?",
      answer: "Absolutely. We take data privacy very seriously. Our certified technicians follow strict protocols, and we recommend backing up your data before any repair. We never access personal files unless specifically required for diagnostics."
    },
    {
      question: "How long do repairs usually take?",
      answer: "Most repairs are completed within 24-48 hours. Screen replacements and battery changes typically take 2-4 hours, while more complex issues may take 1-3 days depending on parts availability."
    },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold mb-2 text-gray-900">
          Select Your Device
        </h2>
        <p className="text-sm lg:text-base text-gray-600">
          Choose the device you need help with
        </p>
      </div>

      {!selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 max-w-4xl mx-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/70 group"
                onClick={() => setSelectedCategory(category.id as 'phone' | 'laptop')}
              >
                <CardContent className="p-6 lg:p-8 text-center">
                  <div className="relative w-full h-32 lg:h-40 bg-gray-50 rounded-lg lg:rounded-xl overflow-hidden mb-4 lg:mb-6 border group-hover:bg-gray-100 transition-colors">
                    <Image
                      src={category.id === 'phone' 
                        ? 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-blue?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1693009283804'
                        : 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697311054290'
                      }
                      alt={category.name}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <h3 className="text-lg lg:text-xl xl:text-2xl font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm lg:text-base text-gray-500 mt-2">
                    {category.id === 'phone' ? 'Screen repair, battery replacement, and more' : 'Hardware fixes, software issues, performance optimization'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedCategory && !selectedBrand && (
        <div className="space-y-6 lg:space-y-8">
         
          
          {/* Back Button */}
          <div className="flex items-center mb-4 lg:mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedCategory(null)} 
              className="text-sm lg:text-base p-2 lg:p-3 hover:bg-gray-100"
            >
              ← Back
            </Button>
          </div>

          {/* Brand Selection Section */}
          <div>
            <div className="mb-4 lg:mb-6">
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">
                Choose Your Brand
              </h3>
              <p className="text-sm lg:text-base text-gray-600">
                Select the brand of your {selectedCategory === 'phone' ? 'phone' : 'laptop'}
              </p>
            </div>

            {/* Mobile: Horizontal Scroll Layout */}
            <div className="block sm:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide">
                {loading ? (
                  // Loading skeleton for mobile brands
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-32">
                      <Card className="h-28 animate-pulse">
                        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                          <div className="w-16 h-10 bg-gray-200 rounded mb-2"></div>
                          <div className="w-20 h-3 bg-gray-200 rounded"></div>
                        </CardContent>
                      </Card>
                    </div>
                  ))
                ) : (
                  brands.map((brand) => (
                    <div 
                      key={brand} 
                      className="flex-shrink-0 w-32 cursor-pointer"
                      onClick={() => setSelectedBrand(brand)}
                    >
                      <Card className="transition-all duration-200 border-2 hover:shadow-lg hover:border-primary/70 h-28">
                        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                          <div className="relative w-16 h-10 flex items-center justify-center mb-2">
                            <Image
                              src={getBrandLogo(brand)}
                              alt={brand}
                              width={64}
                              height={40}
                              className="object-contain max-h-10 max-w-16"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/assets/brand-placeholder.svg';
                              }}
                            />
                          </div>
                          <h3 className="font-semibold text-xs text-center leading-tight">{brand}</h3>
                        </CardContent>
                      </Card>
                    </div>
                  ))
                )}
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                Swipe to see more brands →
              </div>
            </div>

            {/* Tablet: 3-Column Grid */}
            <div className="hidden sm:grid md:hidden grid-cols-3 gap-4 lg:gap-6">
              {loading ? (
                // Loading skeleton for tablet brands
                [...Array(6)].map((_, i) => (
                  <Card key={i} className="h-32 animate-pulse">
                    <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                      <div className="w-18 h-11 bg-gray-200 rounded mb-3"></div>
                      <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                brands.map((brand) => (
                  <Card 
                    key={brand} 
                    className="transition-all duration-200 border-2 cursor-pointer hover:shadow-xl hover:border-primary/70 h-32"
                    onClick={() => setSelectedBrand(brand)}
                  >
                    <CardContent className="p-4 lg:p-6 flex flex-col items-center justify-center h-full">
                      <div className="relative w-18 lg:w-20 h-11 lg:h-12 flex items-center justify-center mb-3">
                        <Image
                          src={getBrandLogo(brand)}
                          alt={brand}
                        width={72}
                        height={44}
                        className="object-contain max-h-11 lg:max-h-12"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/brand-placeholder.svg';
                        }}
                      />
                    </div>
                    <h3 className="font-semibold text-sm lg:text-base text-center leading-tight">{brand}</h3>
                  </CardContent>
                </Card>
              ))
            )}
            </div>

            {/* Desktop: 4-Column Grid */}
            <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {loading ? (
                // Loading skeleton for desktop brands
                [...Array(8)].map((_, i) => (
                  <Card key={i} className="h-32 lg:h-36 animate-pulse">
                    <CardContent className="p-4 lg:p-6 flex flex-col items-center justify-center h-full">
                      <div className="w-18 lg:w-20 h-11 lg:h-12 bg-gray-200 rounded mb-3"></div>
                      <div className="w-20 h-4 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                brands.map((brand) => (
                  <Card 
                    key={brand} 
                    className="transition-all duration-200 border-2 cursor-pointer hover:shadow-xl hover:border-primary/70 h-32 lg:h-36"
                    onClick={() => setSelectedBrand(brand)}
                  >
                    <CardContent className="p-4 lg:p-6 flex flex-col items-center justify-center h-full">
                      <div className="relative w-18 lg:w-20 h-11 lg:h-12 flex items-center justify-center mb-3">
                        <Image
                          src={getBrandLogo(brand)}
                          alt={brand}
                          width={80}
                          height={48}
                        className="object-contain max-h-11 lg:max-h-12"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/brand-placeholder.svg';
                        }}
                      />
                    </div>
                    <h3 className="font-semibold text-sm lg:text-base text-center leading-tight">{brand}</h3>
                  </CardContent>
                </Card>
              ))
            )}
            </div>
          </div>
          {/* FAQ Section - Using providers page component */}
          <div className="mt-8 lg:mt-12">
            <div className="mb-8 lg:mb-12 text-center">
              <h3 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h3>
              <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Common questions about device selection and repairs
              </p>
            </div>
            
            <FAQAccordion items={customerFaqItems} />
          </div>
        </div>
      )}

      {selectedCategory && selectedBrand && (
        <div className="space-y-4 lg:space-y-6">
          <div className="flex items-center mb-4 lg:mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedBrand(null)}
              className="text-sm lg:text-base p-2 lg:p-3 hover:bg-gray-100"
            >
              ← Back
            </Button>
          </div>
          
          <div className="mb-4 lg:mb-6">
            <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">
              Select Your {selectedBrand} Model
            </h3>
            <p className="text-sm lg:text-base text-gray-600">
              Choose the specific model of your {selectedCategory === 'phone' ? 'phone' : 'laptop'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder={`Search ${selectedBrand} models...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            {searchQuery && models.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No models found matching "{searchQuery}". Try a different search term.
              </p>
            )}
            {searchQuery && models.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Found {models.length} model{models.length === 1 ? '' : 's'} matching "{searchQuery}"
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {/* Deduplicate models by model name */}
            {models.map((model) => (
              <Card 
                key={model.model}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/70 h-48 lg:h-56"
                onClick={() => onDeviceSelect(model)}
              >
                <CardContent className="p-4 lg:p-6 text-center flex flex-col h-full">
                  <div className="relative w-full h-24 lg:h-32 bg-gray-50 rounded-lg overflow-hidden mb-3 lg:mb-4 border flex-grow">
                    <Image
                      src={getDeviceImage(model.brand, model.model, model.category)}
                      alt={model.model}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <h3 className="text-sm lg:text-lg font-semibold text-gray-900 leading-tight">
                    {model.model}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}