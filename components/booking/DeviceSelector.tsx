"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Laptop, ChevronRight } from 'lucide-react';
import { Device } from '@/types';
import Image from 'next/image';
import { getDevices, getPhones, getLaptops } from '@/lib/appwrite-services';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import Link from 'next/link';

interface DeviceSelectorProps {
  onDeviceSelect: (device: Device) => void;
}

export function DeviceSelector({ onDeviceSelect }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'phone' | 'laptop' | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Remove mock data for demonstration
  useEffect(() => {
    setLoading(true);
    const fetchDevices = async () => {
      let fetchedDevices: Device[] = [];
      if (selectedCategory === 'phone') {
        fetchedDevices = await getPhones();
      } else if (selectedCategory === 'laptop') {
        fetchedDevices = await getLaptops();
      }
        setDevices(fetchedDevices);
      setLoading(false);
      // Brands fetched successfully
    };
    if (selectedCategory) {
      fetchDevices();
    } else {
        setDevices([]);
      setLoading(false);
    }
  }, [selectedCategory]);

  // Model filtering logic handled in component

  const categories = [
    { id: 'phone', name: 'Mobile Phones', icon: Smartphone },
    { id: 'laptop', name: 'Laptops', icon: Laptop }
  ];

  const brands = selectedCategory 
    ? Array.from(new Set(devices.map(d => d.brand)))
    : [];

  const models = selectedCategory && selectedBrand
    ? devices.filter(d => d.brand === selectedBrand)
    : [];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-white rounded border"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Your Device</h2>
        <p className="text-muted-foreground">Choose the device you need help with</p>
      </div>

      {!selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedCategory(category.id as 'phone' | 'laptop')}
              >
                <CardContent className="p-6 text-center">
                  <div className="relative w-full h-32 bg-white rounded-lg overflow-hidden mb-4 border">
                    <Image
                      src={category.id === 'phone' 
                        ? 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-blue?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1693009283804'
                        : 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697311054290'
                      }
                      alt={category.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <h3 className="text-xl font-semibold">{category.name}</h3>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedCategory && !selectedBrand && (
        <div className="space-y-8">
          {/* Modern Breadcrumbs (no highlight) */}
          <nav className="mb-6 bg-white/80 rounded-xl px-6 py-3 shadow-sm flex items-center border" aria-label="Breadcrumb">
            <ol className="flex items-center text-base font-medium text-gray-500 gap-2 md:gap-3">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                <span className="mx-2 text-lg font-bold text-gray-300">&gt;&gt;</span>
              </li>
              <li>
                <Link href="/book" className="hover:text-primary transition-colors">Book</Link>
                <span className="mx-2 text-lg font-bold text-gray-300">&gt;&gt;</span>
              </li>
              <li>
                {selectedCategory === 'phone' ? 'Mobile Phones' : 'Laptops'}
                <span className="mx-2 text-lg font-bold text-gray-300">&gt;</span>
              </li>
              <li>Brand</li>
            </ol>
          </nav>
          {/* Brand cards and FAQ */}
        <div>
            <div className="flex items-center mb-6">
              <Button variant="ghost" onClick={() => setSelectedCategory(null)} className="text-base">
              ← Back
            </Button>
          </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {brands.map((brand) => (
              <Card 
                key={brand} 
                  className={"transition-all duration-200 border-2 cursor-pointer hover:shadow-xl hover:border-primary/70"}
                onClick={() => setSelectedBrand(brand)}
                  style={{ minHeight: 120 }}
              >
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    <div className="relative w-20 h-12 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                    <Image
                        src={getBrandLogo(brand)}
                      alt={brand}
                        width={80}
                        height={48}
                        className="object-contain h-12 mx-auto"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/brand-placeholder.svg';
                        }}
                    />
                  </div>
                    <h3 className="font-semibold text-base tracking-tight text-center mt-1">{brand}</h3>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
          {/* FAQ Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="w-full bg-white rounded-lg shadow-md">
              <AccordionItem value="q1">
                <AccordionTrigger>How do I choose the right brand for my device?</AccordionTrigger>
                <AccordionContent>
                  Select the brand that matches your device. If you are unsure, check your device's logo or settings for brand information.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>What if my brand is not listed?</AccordionTrigger>
                <AccordionContent>
                  If your brand is not listed, please contact our support team. We may still be able to help with your repair.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger>Can I repair devices from any brand?</AccordionTrigger>
                <AccordionContent>
                  We support most major brands. If you have a rare or less common brand, reach out to us for confirmation.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger>Is my data safe during repair?</AccordionTrigger>
                <AccordionContent>
                  Yes, we take data privacy seriously. Our technicians follow strict protocols to ensure your data is safe and secure.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      )}

      {selectedCategory && selectedBrand && (
        <div>
          <div className="flex items-center mb-4">
            <Button variant="ghost" onClick={() => setSelectedBrand(null)}>
              ← Back
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Deduplicate models by model name */}
            {models.map((model) => (
              <Card 
                key={model.model}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onDeviceSelect(model)}
              >
                <CardContent className="p-6 text-center">
                  <div className="relative w-full h-32 bg-white rounded-lg overflow-hidden mb-4 border">
                      <Image
                      src={getDeviceImage(model.brand, model.model, model.category)}
                      alt={model.model}
                        fill
                        className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      />
                  </div>
                  <h3 className="text-lg font-semibold">{model.model}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}