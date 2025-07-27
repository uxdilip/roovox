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

  // Function to get device image URL
  const getDeviceImage = (brand: string, model: string, category: string) => {
    const brandLower = brand.toLowerCase();
    const modelLower = model.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (category === 'phone') {
      if (brandLower === 'apple') {
        if (modelLower.includes('iphone15promax')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-natural_titanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1693009283804';
        if (modelLower.includes('iphone15pro')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-natural_titanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1693009283804';
        if (modelLower.includes('iphone15')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-blue?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1693009283804';
        if (modelLower.includes('iphone14promax')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-7inch-deep-purple?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1663704191891';
        if (modelLower.includes('iphone14pro')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-1inch-deep-purple?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1663704191891';
        if (modelLower.includes('iphone14')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch-blue?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1661950402798';
        if (modelLower.includes('iphone13promax')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-max-sierra-blue-select?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1631652956000';
        if (modelLower.includes('iphone13pro')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-alpine-green-select?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1644969385495';
        if (modelLower.includes('iphone13')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pink-select?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1631652956000';
        if (modelLower.includes('iphone12promax')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-pro-max-pacific-blue?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1603298667000';
        if (modelLower.includes('iphone12pro')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-pro-graphite-hero?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1603298667000';
        if (modelLower.includes('iphone12')) return 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-12-black-select?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1603298667000';
      } else if (brandLower === 'samsung') {
        if (modelLower.includes('galaxys24ultra')) return 'https://images.samsung.com/is/image/samsung/p6pim/latin/2308/gallery/latin-galaxy-s24-s928-sm-s928bzgcgto-534866-sm-s928bzgcgto-thumb-537243926';
        if (modelLower.includes('galaxys24')) return 'https://images.samsung.com/is/image/samsung/p6pim/latin/2308/gallery/latin-galaxy-s24-s921-sm-s921bzgcgto-534866-sm-s921bzgcgto-thumb-537243926';
        if (modelLower.includes('galaxys23ultra')) return 'https://images.samsung.com/is/image/samsung/p6pim/latin/2302/gallery/latin-galaxy-s23-s918-sm-s918bzgcgto-534866-sm-s918bzgcgto-thumb-537243926';
        if (modelLower.includes('galaxys23')) return 'https://images.samsung.com/is/image/samsung/p6pim/latin/2302/gallery/latin-galaxy-s23-s911-sm-s911bzgcgto-534866-sm-s911bzgcgto-thumb-537243926';
        if (modelLower.includes('galaxys22ultra')) return 'https://images.samsung.com/is/image/samsung/p6pim/latin/2202/gallery/latin-galaxy-s22-s908-sm-s908bzgcgto-534866-sm-s908bzgcgto-thumb-537243926';
        if (modelLower.includes('galaxys22')) return 'https://images.samsung.com/is/image/samsung/p6pim/latin/2202/gallery/latin-galaxy-s22-s901-sm-s901bzgcgto-534866-sm-s901bzgcgto-thumb-537243926';
      } else if (brandLower === 'google') {
        if (modelLower.includes('pixel8pro')) return 'https://lh3.googleusercontent.com/3TSaKxXck2ALBIht9-sqHkHHpV1hLYa7FjiqO18JqQNshyZQDEjJc0-M5XKwc_4uOPG4j9YVEmn0txM5eVOq5TA=rw-e365-w1440';
        if (modelLower.includes('pixel8')) return 'https://lh3.googleusercontent.com/3TSaKxXck2ALBIht9-sqHkHHpV1hLYa7FjiqO18JqQNshyZQDEjJc0-M5XKwc_4uOPG4j9YVEmn0txM5eVOq5TA=rw-e365-w1440';
        if (modelLower.includes('pixel7pro')) return 'https://lh3.googleusercontent.com/3TSaKxXck2ALBIht9-sqHkHHpV1hLYa7FjiqO18JqQNshyZQDEjJc0-M5XKwc_4uOPG4j9YVEmn0txM5eVOq5TA=rw-e365-w1440';
        if (modelLower.includes('pixel7')) return 'https://lh3.googleusercontent.com/3TSaKxXck2ALBIht9-sqHkHHpV1hLYa7FjiqO18JqQNshyZQDEjJc0-M5XKwc_4uOPG4j9YVEmn0txM5eVOq5TA=rw-e365-w1440';
      }
    } else if (category === 'laptop') {
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
        if (modelLower.includes('thinkpadx1carbon')) return 'https://www.lenovo.com/medias/lenovo-laptop-thinkpad-x1-carbon-gen-11-14-intel-hero.png?context=bWFzdGVyfHJvb3R8MzQ1OTY2fGltYWdlL3BuZ3xoNWEvaGYwLzEzMjU1MTc1ODUwMzU4LnBuZ3wzZWI3ZTFmOTQ3Njg0ZWM4ZjRjY2M1NzFkZGNjYzFjYzA5ZWM4YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1';
        if (modelLower.includes('thinkpadx1yoga')) return 'https://www.lenovo.com/medias/lenovo-laptop-thinkpad-x1-yoga-gen-8-14-intel-hero.png?context=bWFzdGVyfHJvb3R8MzQ1OTY2fGltYWdlL3BuZ3xoNWEvaGYwLzEzMjU1MTc1ODUwMzU4LnBuZ3wzZWI3ZTFmOTQ3Njg0ZWM4ZjRjY2M1NzFkZGNjYzFjYzA5ZWM4YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1';
        if (modelLower.includes('thinkpadt14')) return 'https://www.lenovo.com/medias/lenovo-laptop-thinkpad-t14-gen-4-14-intel-hero.png?context=bWFzdGVyfHJvb3R8MzQ1OTY2fGltYWdlL3BuZ3xoNWEvaGYwLzEzMjU1MTc1ODUwMzU4LnBuZ3wzZWI3ZTFmOTQ3Njg0ZWM4ZjRjY2M1NzFkZGNjYzFjYzA5ZWM4YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1';
        if (modelLower.includes('yoga9i')) return 'https://www.lenovo.com/medias/lenovo-laptop-yoga-9i-gen-8-14-intel-hero.png?context=bWFzdGVyfHJvb3R8MzQ1OTY2fGltYWdlL3BuZ3xoNWEvaGYwLzEzMjU1MTc1ODUwMzU4LnBuZ3wzZWI3ZTFmOTQ3Njg0ZWM4ZjRjY2M1NzFkZGNjYzFjYzA5ZWM4YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1';
        if (modelLower.includes('ideapad5')) return 'https://www.lenovo.com/medias/lenovo-laptop-ideapad-5-15-amd-hero.png?context=bWFzdGVyfHJvb3R8MzQ1OTY2fGltYWdlL3BuZ3xoNWEvaGYwLzEzMjU1MTc1ODUwMzU4LnBuZ3wzZWI3ZTFmOTQ3Njg0ZWM4ZjRjY2M1NzFkZGNjYzFjYzA5ZWM4YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1YzA1';
      }
    }
    
    // Default fallback image
    return category === 'phone' 
      ? 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-blue?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1693009283804'
      : 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697311054290';
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
      // Debug log to verify fetched brands
      console.log('Fetched brands:', Array.from(new Set(fetchedDevices.map(d => d.brand))));
    };
    if (selectedCategory) {
      fetchDevices();
    } else {
        setDevices([]);
      setLoading(false);
    }
  }, [selectedCategory]);

  // Debug log to help diagnose model filtering issues
  useEffect(() => {
    if (!loading) {
      console.log('All devices:', devices);
      console.log('Selected category:', selectedCategory);
      console.log('Selected brand:', selectedBrand);
      const filteredModels = selectedCategory && selectedBrand
        ? devices.filter(d => d.brand === selectedBrand)
        : [];
      console.log('Filtered models:', filteredModels);
    }
  }, [devices, selectedCategory, selectedBrand, loading]);

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
                <div className="h-20 bg-gray-200 rounded"></div>
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
                  <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-4">
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
          <nav className="mb-6 bg-gray-50/80 rounded-xl px-6 py-3 shadow-sm flex items-center" aria-label="Breadcrumb">
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
                    <div className="relative w-20 h-12 bg-gray-100 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                    <Image
                        src={`/assets/brand-logos/${brand.toLowerCase().replace(/\s/g, '-')}.svg`}
                      alt={brand}
                        width={80}
                        height={48}
                        className="object-contain h-12 mx-auto"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/brand-placeholder.png';
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
                  <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-4">
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