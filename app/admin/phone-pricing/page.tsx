"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Smartphone, 
  Laptop,
  DollarSign, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";

interface DevicePricing {
  id: string;
  brand: string;
  model: string;
  market_price_inr: number;
  complexity_tier: 'basic' | 'standard' | 'premium';
  series_name?: string;
  $updatedAt: string;
  category: 'phone' | 'laptop';
}

interface AddDeviceForm {
  category: 'phone' | 'laptop';
  brand: string;
  model: string;
  series_name: string;
  market_price_inr: string;
  complexity_tier: 'basic' | 'standard' | 'premium';
  specifications?: string;
}

export default function DevicePricingPage() {
  const [devices, setDevices] = useState<DevicePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'phone' | 'laptop'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddDeviceForm>({
    category: "phone",
    brand: "",
    model: "",
    series_name: "",
    market_price_inr: "",
    complexity_tier: "standard",
    specifications: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Available brands for the form
  const availableBrands = [
    "Apple", "Samsung", "Xiaomi", "OnePlus", "Vivo", "Oppo", 
    "Realme", "Nothing", "Google", "Motorola", "POCO", "Honor", 
    "Nokia", "Asus", "Dell", "HP", "Lenovo", "Acer", "MSI", "Razer"
  ];

  // Phone-specific brands
  const phoneBrands = [
    "Apple", "Samsung", "Xiaomi", "OnePlus", "Vivo", "Oppo", 
    "Realme", "Nothing", "Google", "Motorola", "POCO", "Honor", 
    "Nokia", "Asus"
  ];

  // Laptop-specific brands
  const laptopBrands = [
    "Apple", "Dell", "HP", "Lenovo", "Acer", "Asus", "MSI", "Razer"
  ];

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (addForm.brand && addForm.category) {
      fetchAvailableModels();
    } else {
      setAvailableModels([]);
    }
  }, [addForm.brand, addForm.category]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      
      // Fetch both phones and laptops
      const [phonesResponse, laptopsResponse] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.PHONES, [Query.limit(100)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.LAPTOPS, [Query.limit(100)])
      ]);
      
      const phonesWithPricing = phonesResponse.documents
        .filter(phone => phone.market_price_inr !== null && phone.market_price_inr !== undefined)
        .map(phone => ({
          id: phone.$id,
          brand: phone.brand,
          model: phone.model,
          market_price_inr: phone.market_price_inr || 0,
          complexity_tier: phone.complexity_tier || 'standard',
          series_name: phone.series_name || '',
          $updatedAt: phone.$updatedAt,
          category: 'phone' as const
        }));
      
      const laptopsWithPricing = laptopsResponse.documents
        .filter(laptop => laptop.market_price_inr !== null && laptop.market_price_inr !== undefined)
        .map(laptop => ({
          id: laptop.$id,
          brand: laptop.brand,
          model: laptop.model,
          market_price_inr: laptop.market_price_inr || 0,
          complexity_tier: laptop.complexity_tier || 'standard',
          series_name: laptop.series_name || '',
          $updatedAt: laptop.$updatedAt,
          category: 'laptop' as const
        }));
      
      setDevices([...phonesWithPricing, ...laptopsWithPricing]);
    } catch (error) {
      console.error("Error fetching devices:", error);
      setMessage({ type: 'error', text: 'Failed to fetch devices' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableModels = async () => {
    try {
      const collection = addForm.category === 'phone' ? COLLECTIONS.PHONES : COLLECTIONS.LAPTOPS;
      const response = await databases.listDocuments(
        DATABASE_ID,
        collection,
        [Query.equal('brand', addForm.brand)]
      );
      
      const models = response.documents.map(device => device.model);
      setAvailableModels(models);
    } catch (error) {
      console.error("Error fetching models:", error);
      setAvailableModels([]);
    }
  };

  const filteredDevices = devices?.filter(device => {
    if (!device || !device.model || !device.brand) return false;
    
    const matchesSearch = device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === "all" || device.brand === selectedBrand;
    const matchesCategory = selectedCategory === "all" || device.category === selectedCategory;
    return matchesSearch && matchesBrand && matchesCategory;
  }) || [];

  const handleAddDevice = async () => {
    if (!addForm.brand || !addForm.model || !addForm.market_price_inr || !addForm.series_name) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    // Validate price is a positive number
    const price = parseInt(addForm.market_price_inr);
    if (isNaN(price) || price <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid positive price' });
      return;
    }

    try {
      setSubmitting(true);
      
      const collection = addForm.category === 'phone' ? COLLECTIONS.PHONES : COLLECTIONS.LAPTOPS;
      
      // Check if device already exists
      const existingDevices = await databases.listDocuments(
        DATABASE_ID,
        collection,
        [
          Query.equal('brand', addForm.brand),
          Query.equal('model', addForm.model)
        ]
      );

      if (existingDevices.documents.length > 0) {
        // Update existing device
        const device = existingDevices.documents[0];
        await databases.updateDocument(
          DATABASE_ID,
          collection,
          device.$id,
          {
            market_price_inr: price,
            complexity_tier: addForm.complexity_tier,
            series_name: addForm.series_name,
            specifications: addForm.specifications || device.specifications || ''
          }
        );
        setMessage({ type: 'success', text: 'Device pricing updated successfully!' });
      } else {
        // Create new device
        const deviceData: any = {
          brand: addForm.brand,
          model: addForm.model,
          series_name: addForm.series_name,
          market_price_inr: price,
          complexity_tier: addForm.complexity_tier,
          category: addForm.category
        };

        if (addForm.specifications) {
          deviceData.specifications = addForm.specifications;
        }

        // Set default values for required fields
        deviceData.common_issues = [];
        deviceData.created_at = new Date().toISOString();
        deviceData.updated_at = new Date().toISOString();

        await databases.createDocument(
          DATABASE_ID,
          collection,
          'unique()',
          deviceData
        );
        setMessage({ type: 'success', text: 'New device added successfully!' });
      }

      setAddForm({
        category: "phone",
        brand: "",
        model: "",
        series_name: "",
        market_price_inr: "",
        complexity_tier: "standard",
        specifications: ""
      });
      setShowAddForm(false);
      
      // Refresh the list
      fetchDevices();
    } catch (error) {
      console.error("Error adding/updating device:", error);
      setMessage({ type: 'error', text: 'Failed to add/update device. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'basic': return 'Basic (₹0-25k)';
      case 'standard': return 'Standard (₹25k-60k)';
      case 'premium': return 'Premium (₹60k+)';
      default: return 'Unknown';
    }
  };

  const getCategoryIcon = (category: string) => {
    return category === 'phone' ? <Smartphone className="w-8 h-8 text-blue-600" /> : <Laptop className="w-8 h-8 text-green-600" />;
  };

  const getBrandsByCategory = (category: 'phone' | 'laptop') => {
    return category === 'phone' ? phoneBrands : laptopBrands;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Device Pricing Management</h1>
          <p className="text-gray-600 mt-2">Manage market prices and complexity tiers for phones and laptops</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Cancel' : 'Add Device Pricing'}
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessage(null)}
            className="ml-auto"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Add Device Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Device Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Device Type *</Label>
                <Select value={addForm.category} onValueChange={(value: 'phone' | 'laptop') => {
                  setAddForm({...addForm, category: value, brand: "", model: ""});
                  setAvailableModels([]);
                }}>
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
                <Label htmlFor="brand">Brand *</Label>
                <Select value={addForm.brand} onValueChange={(value) => {
                  setAddForm({...addForm, brand: value, model: ""});
                  setAvailableModels([]);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {getBrandsByCategory(addForm.category).map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="model">Model *</Label>
                <Select value={addForm.model} onValueChange={(value) => setAddForm({...addForm, model: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableModels.length === 0 && addForm.brand && (
                  <p className="text-sm text-gray-500 mt-1">No existing models found. You can add a new one.</p>
                )}
              </div>
              <div>
                <Label htmlFor="series">Series Name *</Label>
                <Input
                  id="series"
                  placeholder="e.g., iPhone Series, Galaxy S Series"
                  value={addForm.series_name}
                  onChange={(e) => setAddForm({...addForm, series_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="price">Market Price (INR) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 75000"
                  value={addForm.market_price_inr}
                  onChange={(e) => setAddForm({...addForm, market_price_inr: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="tier">Complexity Tier *</Label>
                <Select value={addForm.complexity_tier} onValueChange={(value: 'basic' | 'standard' | 'premium') => setAddForm({...addForm, complexity_tier: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (₹0-25k)</SelectItem>
                    <SelectItem value="standard">Standard (₹25k-60k)</SelectItem>
                    <SelectItem value="premium">Premium (₹60k+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="specifications">Specifications (Optional)</Label>
              <Input
                id="specifications"
                placeholder="e.g., 6.1 inch, A16 Bionic, 128GB"
                value={addForm.specifications}
                onChange={(e) => setAddForm({...addForm, specifications: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddDevice} 
                disabled={submitting}
                className="flex items-center gap-2"
              >
                {submitting ? 'Saving...' : 'Save Device Pricing'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Devices</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by brand or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="category-filter">Device Type</Label>
              <Select value={selectedCategory} onValueChange={(value: 'all' | 'phone' | 'laptop') => setSelectedCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="phone">Phones Only</SelectItem>
                  <SelectItem value="laptop">Laptops Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="brand-filter">Filter by Brand</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {availableBrands.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Smartphone className="w-6 h-6 text-blue-600" />
                <Laptop className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total with Pricing</p>
                <p className="text-2xl font-bold">{devices?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Phones</p>
                <p className="text-xl font-bold">{devices?.filter(d => d.category === 'phone').length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Laptop className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Laptops</p>
                <p className="text-xl font-bold">{devices?.filter(d => d.category === 'laptop').length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                {devices?.filter(d => d.complexity_tier === 'basic').length || 0} Basic
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                {devices?.filter(d => d.complexity_tier === 'standard').length || 0} Standard
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Devices with Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading devices...</p>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex gap-2 justify-center mb-4">
                <Smartphone className="w-12 h-12 text-gray-400" />
                <Laptop className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-600">No devices found with pricing data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getCategoryIcon(device.category)}
                    <div>
                      <h3 className="font-semibold">{device.brand} {device.model}</h3>
                      <p className="text-sm text-gray-600">{device.series_name}</p>
                      <Badge variant="outline" className="mt-1">
                        {device.category === 'phone' ? 'Phone' : 'Laptop'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        ₹{device.market_price_inr ? device.market_price_inr.toLocaleString() : '0'}
                      </p>
                      <p className="text-sm text-gray-500">Market Price</p>
                    </div>
                    <Badge className={getTierColor(device.complexity_tier)}>
                      {getTierLabel(device.complexity_tier)}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Updated</p>
                      <p className="text-xs text-gray-400">
                        {device.$updatedAt ? new Date(device.$updatedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
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
