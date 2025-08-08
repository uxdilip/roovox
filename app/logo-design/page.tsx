"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  SniketLogo, 
  SniketLogoFull, 
  SniketLogoIcon, 
  SniketLogoHorizontal,
  SniketLogoWord 
} from '@/components/ui/sniket-logo';

export default function LogoDesignPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F8] p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-chillax text-4xl font-bold text-[#333333] mb-4">
            Sniket Logo Design
          </h1>
          <p className="font-snonym text-lg text-[#666666] max-w-2xl mx-auto">
            Modern logo design with gradient purple icon and stylized typography, 
            perfect for your brand identity and website implementation.
          </p>
        </div>

        {/* Reusable Logo Component */}
        <Card className="bg-white shadow-lg mb-12">
          <CardHeader>
            <CardTitle className="font-chillax text-2xl text-[#333333]">
              Logo Component
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Different Sizes */}
            <div>
              <h3 className="font-chillax text-lg font-semibold text-[#333333] mb-4">
                Different Sizes
              </h3>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <SniketLogo size="sm" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">Small</p>
                </div>
                <div className="text-center">
                  <SniketLogo size="md" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">Medium</p>
                </div>
                <div className="text-center">
                  <SniketLogo size="lg" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">Large</p>
                </div>
                <div className="text-center">
                  <SniketLogo size="xl" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">Extra Large</p>
                </div>
                <div className="text-center">
                  <SniketLogo size="2xl" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">2XL</p>
                </div>
              </div>
            </div>

            {/* Different Variants */}
            <div>
              <h3 className="font-chillax text-lg font-semibold text-[#333333] mb-4">
                Logo Variants
              </h3>
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <SniketLogoFull size="lg" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">Full Logo</p>
                </div>
                <div className="text-center">
                  <SniketLogoIcon size="lg" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">Icon Only</p>
                </div>
                <div className="text-center">
                  <SniketLogoHorizontal size="lg" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">Horizontal</p>
                </div>
                <div className="text-center">
                  <SniketLogoWord size="lg" textColor="primary" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">Word Only</p>
                </div>
              </div>
            </div>

            {/* Different Colors */}
            <div>
              <h3 className="font-chillax text-lg font-semibold text-[#333333] mb-4">
                Color Options
              </h3>
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <SniketLogo size="lg" textColor="default" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">Default</p>
                </div>
                <div className="text-center">
                  <SniketLogo size="lg" textColor="white" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">White</p>
                </div>
                <div className="text-center">
                  <SniketLogo size="lg" textColor="primary" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">Primary</p>
                </div>
                <div className="text-center">
                  <SniketLogo size="lg" textColor="gradient" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">Gradient</p>
                </div>
              </div>
            </div>

            {/* Usage Examples */}
            <div>
              <h3 className="font-chillax text-lg font-semibold text-[#333333] mb-4">
                Usage Examples
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-chillax text-sm font-semibold text-[#333333] mb-2">
                    Header Navigation
                  </h4>
                  <SniketLogo size="md" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">
                    &lt;SniketLogo size="md" /&gt;
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-chillax text-sm font-semibold text-[#333333] mb-2">
                    Hero Section
                  </h4>
                  <SniketLogo size="3xl" textColor="primary" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">
                    &lt;SniketLogo size="3xl" textColor="primary" /&gt;
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-chillax text-sm font-semibold text-[#333333] mb-2">
                    Word Only Logo
                  </h4>
                  <SniketLogoWord size="xl" textColor="primary" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">
                    &lt;SniketLogoWord size="xl" textColor="primary" /&gt;
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-chillax text-sm font-semibold text-[#333333] mb-2">
                    Mobile App Icon
                  </h4>
                  <SniketLogoIcon size="xl" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">
                    &lt;SniketLogoIcon size="xl" /&gt;
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-chillax text-sm font-semibold text-[#333333] mb-2">
                    Footer
                  </h4>
                  <SniketLogo size="sm" textColor="default" />
                  <p className="font-snonym text-xs text-[#666666] mt-2">
                    &lt;SniketLogo size="sm" textColor="default" /&gt;
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo Variations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Primary Logo */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="font-chillax text-2xl text-[#333333]">
                Primary Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-8">
              <div className="flex items-center space-x-4">
                {/* Icon */}
                <div className="relative">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: '#601d8a',
                      boxShadow: '0 4px 20px rgba(96, 29, 138, 0.3)'
                    }}
                  >
                    <span className="font-chillax font-medium text-white font-features-stylistic text-2xl">
                      S
                    </span>
                  </div>
                </div>
                
                {/* Wordmark */}
                <div className="flex items-center">
                  <span className="font-chillax text-3xl font-medium text-[#333333]">
                    Sniket
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Icon Only */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="font-chillax text-2xl text-[#333333]">
                Icon Only
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-8">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: '#601d8a',
                  boxShadow: '0 6px 30px rgba(96, 29, 138, 0.4)'
                }}
              >
                <span className="font-chillax font-medium text-white font-features-stylistic text-lg">
                  S
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Word Only Logo with Primary Background */}
        <Card className="bg-white shadow-lg mb-12">
          <CardHeader>
            <CardTitle className="font-chillax text-2xl text-[#333333]">
              Word Only Logo
            </CardTitle>
            <p className="font-snonym text-sm text-[#666666]">
              Clean wordmark with primary color background and stylistic alternates
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Primary Background */}
            <div className="flex items-center justify-center p-8 rounded-lg" style={{ background: '#601d8a' }}>
              <SniketLogoWord size="3xl" textColor="white" />
            </div>
            
            {/* Different Sizes */}
            <div>
              <h3 className="font-chillax text-lg font-semibold text-[#333333] mb-4">
                Different Sizes
              </h3>
              <div className="flex items-center justify-center space-x-6 p-6 rounded-lg" style={{ background: '#601d8a' }}>
                <div className="text-center">
                  <SniketLogoWord size="sm" textColor="white" />
                  <p className="font-snonym text-xs text-white mt-2">Small</p>
                </div>
                <div className="text-center">
                  <SniketLogoWord size="md" textColor="white" />
                  <p className="font-snonym text-xs text-white mt-2">Medium</p>
                </div>
                <div className="text-center">
                  <SniketLogoWord size="lg" textColor="white" />
                  <p className="font-snonym text-xs text-white mt-2">Large</p>
                </div>
                <div className="text-center">
                  <SniketLogoWord size="xl" textColor="white" />
                  <p className="font-snonym text-xs text-white mt-2">Extra Large</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instagram Download Section */}
        <Card className="bg-white shadow-lg mb-12">
          <CardHeader>
            <CardTitle className="font-chillax text-2xl text-[#333333]">
              Instagram Ready Logo
            </CardTitle>
            <p className="font-snonym text-sm text-[#666666]">
              Word-only logo with primary background, perfect for Instagram posts
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Instagram Square Format (1:1) */}
            <div>
              <h3 className="font-chillax text-lg font-semibold text-[#333333] mb-4">
                Square Format (1:1) - Instagram Post
              </h3>
              <div className="flex justify-center">
                <div 
                  className="w-80 h-80 rounded-lg flex items-center justify-center"
                  style={{ background: '#601d8a' }}
                >
                  <SniketLogoWord size="4xl" textColor="white" />
                </div>
              </div>
              <p className="font-snonym text-xs text-[#666666] mt-2 text-center">
                Size: 320x320px • Perfect for Instagram posts
              </p>
            </div>

            {/* Instagram Story Format (9:16) */}
            <div>
              <h3 className="font-chillax text-lg font-semibold text-[#333333] mb-4">
                Story Format (9:16) - Instagram Stories
              </h3>
              <div className="flex justify-center">
                <div 
                  className="w-72 h-96 rounded-lg flex items-center justify-center"
                  style={{ background: '#601d8a' }}
                >
                  <SniketLogoWord size="3xl" textColor="white" />
                </div>
              </div>
              <p className="font-snonym text-xs text-[#666666] mt-2 text-center">
                Size: 288x384px • Perfect for Instagram stories
              </p>
            </div>

            {/* Instagram Reel Format (9:16) */}
            <div>
              <h3 className="font-chillax text-lg font-semibold text-[#333333] mb-4">
                Reel Format (9:16) - Instagram Reels
              </h3>
              <div className="flex justify-center">
                <div 
                  className="w-64 h-96 rounded-lg flex items-center justify-center"
                  style={{ background: '#601d8a' }}
                >
                  <SniketLogoWord size="2xl" textColor="white" />
                </div>
              </div>
              <p className="font-snonym text-xs text-[#666666] mt-2 text-center">
                Size: 256x384px • Perfect for Instagram reels
              </p>
            </div>

            {/* Download Instructions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-chillax text-sm font-semibold text-[#333333] mb-2">
                How to Download:
              </h4>
              <ol className="font-snonym text-sm text-[#666666] space-y-1">
                <li>1. Right-click on the logo you want</li>
                <li>2. Select "Save image as..." or "Copy image"</li>
                <li>3. Choose your preferred format (PNG recommended)</li>
                <li>4. Save with a descriptive name like "sniket-logo-instagram"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Design Specifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Color Palette */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="font-chillax text-2xl text-[#333333]">
                Color Palette
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div 
                    className="w-full h-16 rounded-lg mb-2"
                    style={{
                      background: '#601d8a'
                    }}
                  ></div>
                  <p className="font-snonym text-sm font-medium text-[#333333]">Primary Color</p>
                  <p className="font-snonym text-xs text-[#666666]">#601d8a</p>
                </div>
                <div>
                  <div className="w-full h-16 bg-[#333333] rounded-lg mb-2"></div>
                  <p className="font-snonym text-sm font-medium text-[#333333]">Text Color</p>
                  <p className="font-snonym text-xs text-[#666666]">#333333</p>
                </div>
                <div>
                  <div className="w-full h-16 bg-[#F8F8F8] rounded-lg mb-2 border border-gray-200"></div>
                  <p className="font-snonym text-sm font-medium text-[#333333]">Background</p>
                  <p className="font-snonym text-xs text-[#666666]">#F8F8F8</p>
                </div>
                <div>
                  <div className="w-full h-16 bg-white rounded-lg mb-2 border border-gray-200"></div>
                  <p className="font-snonym text-sm font-medium text-[#333333]">White</p>
                  <p className="font-snonym text-xs text-[#666666]">#FFFFFF</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="font-chillax text-2xl text-[#333333]">
                Typography
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-chillax text-2xl font-medium text-[#333333] mb-2">
                  Sniket
                </h3>
                <p className="font-snonym text-sm text-[#666666]">
                  Chillax Medium • Primary brand name
                </p>
              </div>
              <div>
                <h4 className="font-chillax text-lg font-semibold text-[#333333] mb-2">
                  Sniket
                </h4>
                <p className="font-snonym text-sm text-[#666666]">
                  Chillax Semibold • Secondary usage
                </p>
              </div>
              <div>
                <p className="font-snonym text-base text-[#333333] mb-2">
                  Supporting text and descriptions
                </p>
                <p className="font-snonym text-sm text-[#666666]">
                  Snonym Regular • Body text
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Guidelines */}
        <Card className="bg-white shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="font-chillax text-2xl text-[#333333]">
              Usage Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-chillax text-lg font-semibold text-[#333333] mb-3">
                  ✅ Do's
                </h4>
                <ul className="font-snonym text-sm text-[#666666] space-y-2">
                  <li>• Use on light backgrounds for maximum contrast</li>
                  <li>• Maintain minimum spacing around the logo</li>
                  <li>• Scale proportionally without distortion</li>
                  <li>• Use the full logo for primary brand presence</li>
                  <li>• Use icon-only version for small spaces</li>
                </ul>
              </div>
              <div>
                <h4 className="font-chillax text-lg font-semibold text-[#333333] mb-3">
                  ❌ Don'ts
                </h4>
                <ul className="font-snonym text-sm text-[#666666] space-y-2">
                  <li>• Don't change the gradient colors</li>
                  <li>• Don't stretch or distort the logo</li>
                  <li>• Don't add effects or shadows to the logo</li>
                  <li>• Don't use on very dark backgrounds</li>
                  <li>• Don't separate the icon from the wordmark</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 