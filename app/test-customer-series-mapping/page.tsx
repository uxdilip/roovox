"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { findProviderServicesWithSeries } from '@/lib/appwrite-services';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';

export default function TestCustomerSeriesMapping() {
  const [deviceType, setDeviceType] = useState('phone');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [issue, setIssue] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load brands
  useEffect(() => {
    const loadBrands = async () => {
      const collection = deviceType === 'phone' ? COLLECTIONS.PHONES : COLLECTIONS.LAPTOPS;
      const res = await databases.listDocuments(DATABASE_ID, collection, [Query.limit(100)]);
      const uniqueBrands = Array.from(new Set(res.documents.map(d => d.brand).filter(Boolean)));
      setBrands(uniqueBrands);
    };
    loadBrands();
  }, [deviceType]);

  // Load models when brand changes
  useEffect(() => {
    if (!brand) {
      setModels([]);
      return;
    }
    const loadModels = async () => {
      const collection = deviceType === 'phone' ? COLLECTIONS.PHONES : COLLECTIONS.LAPTOPS;
      const res = await databases.listDocuments(
        DATABASE_ID, 
        collection, 
        [Query.equal('brand', brand), Query.limit(100)]
      );
      const uniqueModels = Array.from(new Set(res.documents.map(d => d.model).filter(Boolean)));
      setModels(uniqueModels);
    };
    loadModels();
  }, [brand, deviceType]);

  // Load issues
  useEffect(() => {
    const loadIssues = async () => {
      const res = await databases.listDocuments(DATABASE_ID, 'issues', [Query.limit(100)]);
      setIssues(res.documents);
    };
    loadIssues();
  }, []);

  const testServiceLookup = async () => {
    if (!deviceType || !brand || !model || !issue) {
      alert('Please select all fields');
      return;
    }

    setLoading(true);
    try {
      const services = await findProviderServicesWithSeries(
        deviceType,
        brand,
        model,
        [issue]
      );
      setResults(services);
    } catch (error) {
      console.error('Error testing service lookup:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getPricingTypeBadge = (service: any) => {
    switch (service.pricingType) {
      case 'platform_series':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Platform Series</Badge>;
      case 'custom_series':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Custom Series</Badge>;
      case 'model_override':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Model Specific</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Customer Service Lookup Test</h1>
        <p className="text-gray-600">
          Test how customers find providers with the new series-based pricing system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Device Type</label>
              <Select value={deviceType} onValueChange={setDeviceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="laptop">Laptop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Brand</label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Issue</label>
              <Select value={issue} onValueChange={setIssue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue" />
                </SelectTrigger>
                <SelectContent>
                  {issues.map(i => (
                    <SelectItem key={i.$id} value={i.name}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={testServiceLookup} disabled={loading || !deviceType || !brand || !model || !issue}>
            {loading ? 'Testing...' : 'Test Service Lookup'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results ({results.length} services found)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((service, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Provider: {service.providerId}</h3>
                    {getPricingTypeBadge(service)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Issue:</span> {service.issue}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> ₹{service.price?.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Part Type:</span> {service.partType || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Warranty:</span> {service.warranty || 'N/A'}
                    </div>
                    {service.seriesName && (
                      <div className="col-span-2">
                        <span className="font-medium">Series:</span> {service.seriesName}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No services found for the selected criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 