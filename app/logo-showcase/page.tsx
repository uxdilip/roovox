"use client";

import React from 'react';
import { Logo } from '@/components/ui/Logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Sniket Logo Showcase</h1>
          <p className="text-lg text-gray-600">Our new text-only logo design with Chillax font and brand color (#601D8A)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Default Logo Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Default Logo - Small</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Logo size="sm" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default Logo - Medium</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Logo size="md" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default Logo - Large</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Logo size="lg" />
            </CardContent>
          </Card>

          {/* Footer Logo Variants */}
          <Card className="bg-gray-900 text-white">
            <CardHeader>
              <CardTitle>Footer Logo - Small</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Logo size="sm" variant="footer" />
            </CardContent>
          </Card>

          <Card className="bg-gray-900 text-white">
            <CardHeader>
              <CardTitle>Footer Logo - Medium</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Logo size="md" variant="footer" />
            </CardContent>
          </Card>

          <Card className="bg-gray-900 text-white">
            <CardHeader>
              <CardTitle>Footer Logo - Large</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Logo size="lg" variant="footer" />
            </CardContent>
          </Card>
        </div>

        {/* Usage Examples */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Usage Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Header Example */}
            <Card>
              <CardHeader>
                <CardTitle>Header Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
                  <Logo size="md" />
                  <div className="flex space-x-4">
                    <button className="px-4 py-2 text-sm text-gray-600 hover:text-primary">Services</button>
                    <button className="px-4 py-2 text-sm text-gray-600 hover:text-primary">About</button>
                                         <button className="px-4 py-2 text-sm bg-brand text-white rounded-lg">Sign In</button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer Example */}
            <Card>
              <CardHeader>
                <CardTitle>Footer Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-white p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Logo size="lg" variant="footer" />
                    <div className="text-gray-400 text-sm">
                      © 2025 Sniket. All rights reserved.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Design Features */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Design Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Clean Typography</h3>
              <p className="text-gray-600">Modern, clean text logo with Chillax font and brand color</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Responsive</h3>
              <p className="text-gray-600">Multiple sizes (sm, md, lg) for different use cases and screen sizes</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Flexible</h3>
              <p className="text-gray-600">Default and footer variants with white background and primary color text</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 