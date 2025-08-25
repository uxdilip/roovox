"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Smartphone, 
  Laptop, 
  DollarSign,
  Settings,
  Save,
  X
} from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface TierPricing {
  id: string;
  $id?: string; // Appwrite document ID
  provider_id: string;
  device_type: string;
  brand: string;
  issue: string;
  part_type?: string; // "OEM" | "HQ" | null - for Screen Replacement issues
  basic: number;
  standard: number;
  premium: number;
  $createdAt?: string;
  $updatedAt?: string;
}

interface Issue {
  id: string;
  name: string;
  category: string;
}

interface NewPricingForm {
  brand: string;
  issue: string;
  basic: string;
  standard: string;
  premium: string;
}

export default function TierPricingTab() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'phones' | 'laptops'>('phones');
  const [tierPricing, setTierPricing] = useState<TierPricing[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [phoneIssues, setPhoneIssues] = useState<Issue[]>([]);
  const [laptopIssues, setLaptopIssues] = useState<Issue[]>([]);
  const [phoneBrands, setPhoneBrands] = useState<string[]>([]);
  const [laptopBrands, setLaptopBrands] = useState<string[]>([]);

  const [editingPricing, setEditingPricing] = useState<TierPricing | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletePricing, setDeletePricing] = useState<TierPricing | null>(null);
  const [newPricing, setNewPricing] = useState<NewPricingForm>({
    brand: '',
    issue: '',
    basic: '',
    standard: '',
    premium: ''
  });

  // Fetch existing tier pricing, issues, and brands
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        // Fetch existing tier pricing (this might fail if collection doesn't exist yet)
        let pricingRes;
        try {
          pricingRes = await databases.listDocuments(
            DATABASE_ID,
            'tier_pricing',
            [Query.equal('provider_id', user.id)]
          );
        } catch (error) {
          pricingRes = { documents: [] };
        }
        
        // Fetch issues using the correct collection name
        const issuesRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ISSUES,
          [Query.limit(100)]
        );
        

        
        // Initialize empty arrays
        let phoneIssues: any[] = [];
        let laptopIssues: any[] = [];
        
        // Use the proper database structure: categories -> issues with category_id
        try {
          // First get the categories
          const categoriesRes = await databases.listDocuments(
            DATABASE_ID,
            'categories',
            []
          );
          
          // Find phone and laptop categories
          const phoneCategory = categoriesRes.documents.find((c: any) => 
            c.name.toLowerCase() === 'phone'
          );
          const laptopCategory = categoriesRes.documents.find((c: any) => 
            c.name.toLowerCase() === 'laptop'
          );
          
          if (phoneCategory) {
            // Fetch phone issues using category_id
            const phoneIssuesRes = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.ISSUES,
              [Query.equal('category_id', phoneCategory.$id)]
            );
            phoneIssues.length = 0;
            phoneIssues.push(...phoneIssuesRes.documents);
          }
          
          if (laptopCategory) {
            // Fetch laptop issues using category_id
            const laptopIssuesRes = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.ISSUES,
              [Query.equal('category_id', laptopCategory.$id)]
            );
            laptopIssues.length = 0;
            laptopIssues.push(...laptopIssuesRes.documents);
          }
          
        } catch (error) {
          // Fallback: use all issues if categorization fails
          phoneIssues.length = 0;
          phoneIssues.push(...issuesRes.documents);
          laptopIssues.length = 0;
          laptopIssues.push(...issuesRes.documents);
        }
        

        
        // Fetch brands from MODEL_SERIES collection (like the service page does)
        let modelSeriesRes;
        try {
          modelSeriesRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.MODEL_SERIES,
            [Query.limit(1000)]
          );
        } catch (error) {
          modelSeriesRes = { documents: [] };
        }
        
        // Extract unique brands by device type
        let phoneBrands: string[] = [];
        let laptopBrands: string[] = [];
        
        if (modelSeriesRes.documents.length > 0) {
          phoneBrands = [...new Set(
            modelSeriesRes.documents
              .filter((doc: any) => doc.device_type === 'phone')
              .map((doc: any) => doc.brand)
          )].sort();
          
          laptopBrands = [...new Set(
            modelSeriesRes.documents
              .filter((doc: any) => doc.device_type === 'laptop')
              .map((doc: any) => doc.brand)
          )].sort();
        } else {
          // Fallback: use common brands if MODEL_SERIES is empty
          phoneBrands = ['Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'OPPO', 'Vivo', 'Realme', 'Nothing', 'Motorola', 'Nokia', 'Honor', 'POCO'];
          laptopBrands = ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Razer', 'Alienware', 'Gigabyte'];
        }
        

        
        // Map Appwrite documents to include proper id field
        const mappedPricing = pricingRes.documents.map((doc: any) => ({
          ...doc,
          id: doc.$id // Map Appwrite's $id to id
        }));
        setTierPricing(mappedPricing);
        setIssues(issuesRes.documents as any);
        setPhoneIssues(phoneIssues as any);
        setLaptopIssues(laptopIssues as any);
        setPhoneBrands(phoneBrands);
        setLaptopBrands(laptopBrands);
      } catch (error) {
        toast.error('Failed to load pricing data');
      }
    };
    
    fetchData();
  }, [user]);

  // Reset selected issue when device type changes
  useEffect(() => {
    setNewPricing(prev => ({ ...prev, issue: '' }));
  }, [activeTab]);

  const handleAddPricing = async () => {
    console.log('🔍 handleAddPricing called with:', { user, newPricing, activeTab });
    
    if (!user || !newPricing.brand || !newPricing.issue) {
      console.log('❌ Validation failed:', { user: !!user, brand: !!newPricing.brand, issue: !!newPricing.issue });
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!newPricing.basic || !newPricing.standard || !newPricing.premium) {
      console.log('❌ Pricing validation failed:', { basic: newPricing.basic, standard: newPricing.standard, premium: newPricing.premium });
      toast.error('Please fill in all pricing tiers');
      return;
    }

    try {
      const pricingData = {
        provider_id: user.id,
        brand: newPricing.brand,
        issue: newPricing.issue,
        basic: parseInt(newPricing.basic) || 0,
        standard: parseInt(newPricing.standard) || 0,
        premium: parseInt(newPricing.premium) || 0,
        device_type: activeTab
      };

      // Check if pricing already exists for this brand + issue combination
      const existingPricing = tierPricing.find(
        p => p.brand === newPricing.brand && p.issue === newPricing.issue
      );

      if (existingPricing) {
        // Update existing pricing - use $id if id is not available
        const existingId = existingPricing.id || existingPricing.$id;
        if (!existingId) {
          toast.error('Cannot update pricing: missing document ID');
          return;
        }
        
        await databases.updateDocument(
          DATABASE_ID,
          'tier_pricing',
          existingId,
          {
            basic: parseInt(newPricing.basic) || 0,
            standard: parseInt(newPricing.standard) || 0,
            premium: parseInt(newPricing.premium) || 0
          }
        );
        
        setTierPricing(prev => prev.map(p => 
          (p.id === existingId || p.$id === existingId)
            ? { 
                ...p, 
                basic: parseInt(newPricing.basic) || 0,
                standard: parseInt(newPricing.standard) || 0,
                premium: parseInt(newPricing.premium) || 0
              }
            : p
        ));
        
        toast.success('Pricing updated successfully!');
      } else {
        // Create new pricing
        const response = await databases.createDocument(
          DATABASE_ID,
          'tier_pricing',
          'unique()',
          pricingData
        );
        
        setTierPricing(prev => [...prev, { ...pricingData, id: response.$id }]);
        toast.success('Pricing added successfully!');
      }

      // Reset form and close modal
      setNewPricing({ brand: '', issue: '', basic: '', standard: '', premium: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving tier pricing:', error);
      toast.error('Failed to save pricing');
    }
  };

  const handleEditPricing = async (pricing: TierPricing) => {
    try {
      console.log('🔍 Updating pricing:', pricing);
      console.log('🔍 Pricing ID:', pricing.id);
      console.log('🔍 Pricing $id:', pricing.$id);
      
      const documentId = pricing.id || pricing.$id;
      if (!documentId) {
        toast.error('Cannot update pricing: missing document ID');
        return;
      }
      
      await databases.updateDocument(
        DATABASE_ID,
        'tier_pricing',
        documentId,
        {
          basic: pricing.basic,
          standard: pricing.standard,
          premium: pricing.premium
        }
      );
      
      setTierPricing(prev => prev.map(p => 
        (p.id === documentId || p.$id === documentId) ? pricing : p
      ));
      
      setEditingPricing(null);
      toast.success('Pricing updated successfully!');
    } catch (error) {
      console.error('Error updating tier pricing:', error);
      toast.error('Failed to update pricing');
    }
  };

  const handleDeletePricing = async (pricingId: string) => {
    try {
      console.log('🔍 Deleting pricing with ID:', pricingId);
      
      await databases.deleteDocument(
        DATABASE_ID,
        'tier_pricing',
        pricingId
      );
      
      setTierPricing(prev => prev.filter(p => p.id !== pricingId && p.$id !== pricingId));
      setDeletePricing(null);
      toast.success('Pricing deleted successfully!');
    } catch (error) {
      console.error('Error deleting tier pricing:', error);
      toast.error('Failed to delete pricing');
    }
  };

  const getFilteredPricing = () => {
    return tierPricing.filter(p => {
      const deviceType = p.device_type || 'phones'; // Default to phones for backward compatibility
      return deviceType === activeTab;
    });
  };

  const getBrands = () => activeTab === 'phones' ? phoneBrands : laptopBrands;
  
  const getCurrentIssues = () => activeTab === 'phones' ? phoneIssues : laptopIssues;



  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No user found. Please log in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tier Pricing Management</h2>
          <p className="text-muted-foreground">
            Set your pricing tiers for different device brands and repair issues
          </p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-gray-800 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Pricing
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Tier Pricing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Device Type</Label>
                <Select 
                  value={activeTab} 
                  onValueChange={(value: string) => setActiveTab(value as 'phones' | 'laptops')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phones">Phones</SelectItem>
                    <SelectItem value="laptops">Laptops</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Brand</Label>
                <Select value={newPricing.brand} onValueChange={(value) => setNewPricing(prev => ({ ...prev, brand: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {getBrands().map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Issue</Label>
                <Select value={newPricing.issue} onValueChange={(value) => setNewPricing(prev => ({ ...prev, issue: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCurrentIssues().map(issue => (
                      <SelectItem key={issue.id} value={issue.name}>{issue.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Basic (₹)</Label>
                  <Input
                    type="number"
                    placeholder=""
                    value={newPricing.basic}
                    onChange={(e) => setNewPricing(prev => ({ ...prev, basic: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Standard (₹)</Label>
                  <Input
                    type="number"
                    placeholder=""
                    value={newPricing.standard}
                    onChange={(e) => setNewPricing(prev => ({ ...prev, standard: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Premium (₹)</Label>
                  <Input
                    type="number"
                    placeholder=""
                    value={newPricing.premium}
                    onChange={(e) => setNewPricing(prev => ({ ...prev, premium: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    console.log('🔍 Save button clicked!');
                    handleAddPricing();
                  }} 
                  className="bg-black hover:bg-gray-800 text-white border-0"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Pricing
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'phones' | 'laptops')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="phones" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Phones
          </TabsTrigger>
          <TabsTrigger value="laptops" className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            Laptops
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phones" className="space-y-4">
          <PhonePricingContent 
            pricing={getFilteredPricing()}
            onEdit={setEditingPricing}
            onDelete={setDeletePricing}
            onSave={handleEditPricing}
            editingPricing={editingPricing}
          />
        </TabsContent>

        <TabsContent value="laptops" className="space-y-4">
          <LaptopPricingContent 
            pricing={getFilteredPricing()}
            onEdit={setEditingPricing}
            onDelete={setDeletePricing}
            onSave={handleEditPricing}
            editingPricing={editingPricing}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {editingPricing && (
        <EditPricingModal
          pricing={editingPricing}
          onSave={handleEditPricing}
          onCancel={() => setEditingPricing(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePricing} onOpenChange={(open) => !open && setDeletePricing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the pricing for <strong>{deletePricing?.brand}</strong> - <strong>{deletePricing?.issue}</strong>?
              <br />
              <span className="text-sm text-muted-foreground">
                Basic: ₹{deletePricing?.basic?.toLocaleString()}, Standard: ₹{deletePricing?.standard?.toLocaleString()}, Premium: ₹{deletePricing?.premium?.toLocaleString()}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deletePricing) {
                  const documentId = deletePricing.id || deletePricing.$id;
                  if (documentId) {
                    handleDeletePricing(documentId);
                  } else {
                    toast.error('Cannot delete pricing: missing document ID');
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Delete Pricing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Phone Pricing Content Component
function PhonePricingContent({ 
  pricing, 
  onEdit, 
  onDelete, 
  onSave, 
  editingPricing 
}: {
  pricing: TierPricing[];
  onEdit: (pricing: TierPricing) => void;
  onDelete: (pricing: TierPricing) => void;
  onSave: (pricing: TierPricing) => void;
  editingPricing: TierPricing | null;
}) {
  const groupedByBrand = pricing.reduce((acc, p) => {
    if (!acc[p.brand]) acc[p.brand] = [];
    acc[p.brand].push(p);
    return acc;
  }, {} as Record<string, TierPricing[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByBrand).map(([brand, brandPricing]) => (
        <Card key={brand}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{brand}</span>
              <Badge variant="secondary">{brandPricing.length} issues</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brandPricing.map((pricingItem) => (
                <div key={pricingItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{pricingItem.issue}</div>
                    <div className="text-sm text-muted-foreground">
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Basic</div>
                      <div className="font-semibold">₹{pricingItem.basic.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Standard</div>
                      <div className="font-semibold">₹{pricingItem.standard.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Premium</div>
                      <div className="font-semibold">₹{pricingItem.premium.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(pricingItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(pricingItem)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {pricing.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No phone pricing configured yet</p>
            <p className="text-sm">Add your first pricing tier to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Laptop Pricing Content Component
function LaptopPricingContent({ 
  pricing, 
  onEdit, 
  onDelete, 
  onSave, 
  editingPricing 
}: {
  pricing: TierPricing[];
  onEdit: (pricing: TierPricing) => void;
  onDelete: (pricing: TierPricing) => void;
  onSave: (pricing: TierPricing) => void;
  editingPricing: TierPricing | null;
}) {
  const groupedByBrand = pricing.reduce((acc, p) => {
    if (!acc[p.brand]) acc[p.brand] = [];
    acc[p.brand].push(p);
    return acc;
  }, {} as Record<string, TierPricing[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByBrand).map(([brand, brandPricing]) => (
        <Card key={brand}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{brand}</span>
              <Badge variant="secondary">{brandPricing.length} issues</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brandPricing.map((pricingItem) => (
                <div key={pricingItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{pricingItem.issue}</div>
                    <div className="text-sm text-muted-foreground">
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Basic</div>
                      <div className="font-semibold">₹{pricingItem.basic.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Standard</div>
                      <div className="font-semibold">₹{pricingItem.standard.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Premium</div>
                      <div className="font-semibold">₹{pricingItem.premium.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(pricingItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(pricingItem)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {pricing.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Laptop className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No laptop pricing configured yet</p>
            <p className="text-sm">Add your first pricing tier to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Edit Pricing Modal Component
function EditPricingModal({ 
  pricing, 
  onSave, 
  onCancel 
}: {
  pricing: TierPricing;
  onSave: (pricing: TierPricing) => void;
  onCancel: () => void;
}) {
  const [editedPricing, setEditedPricing] = useState(pricing);

  const handleSave = () => {
    onSave(editedPricing);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Pricing</h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label>Brand</Label>
            <div className="p-2 bg-muted rounded-md text-sm">{pricing.brand}</div>
          </div>
          <div>
            <Label>Issue</Label>
            <div className="p-2 bg-muted rounded-md text-sm">{pricing.issue}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Basic (₹)</Label>
              <Input
                type="number"
                value={editedPricing.basic}
                onChange={(e) => setEditedPricing(prev => ({ ...prev, basic: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Standard (₹)</Label>
              <Input
                type="number"
                value={editedPricing.standard}
                onChange={(e) => setEditedPricing(prev => ({ ...prev, standard: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Premium (₹)</Label>
              <Input
                type="number"
                value={editedPricing.premium}
                onChange={(e) => setEditedPricing(prev => ({ ...prev, premium: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-black hover:bg-gray-800 text-white border-0">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


              </div>

              <div>

                <Label>Brand</Label>

                <Select value={newPricing.brand} onValueChange={(value) => setNewPricing(prev => ({ ...prev, brand: value }))}>

                  <SelectTrigger>

                    <SelectValue placeholder="Select brand" />

                  </SelectTrigger>

                  <SelectContent>

                    {getBrands().map(brand => (

                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

              <div>

                <Label>Issue</Label>

                <Select value={newPricing.issue} onValueChange={(value) => setNewPricing(prev => ({ ...prev, issue: value }))}>

                  <SelectTrigger>

                    <SelectValue placeholder="Select issue" />

                  </SelectTrigger>

                  <SelectContent>

                    {getCurrentIssues().map(issue => (

                      <SelectItem key={issue.id} value={issue.name}>{issue.name}</SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

              <div className="grid grid-cols-3 gap-2">

                <div>

                  <Label>Basic (₹)</Label>

                  <Input

                    type="number"

                    placeholder=""

                    value={newPricing.basic}

                    onChange={(e) => setNewPricing(prev => ({ ...prev, basic: e.target.value }))}

                  />

                </div>

                <div>

                  <Label>Standard (₹)</Label>

                  <Input

                    type="number"

                    placeholder=""

                    value={newPricing.standard}

                    onChange={(e) => setNewPricing(prev => ({ ...prev, standard: e.target.value }))}

                  />

                </div>

                <div>

                  <Label>Premium (₹)</Label>

                  <Input

                    type="number"

                    placeholder=""

                    value={newPricing.premium}

                    onChange={(e) => setNewPricing(prev => ({ ...prev, premium: e.target.value }))}

                  />

                </div>

              </div>

              <div className="flex justify-end gap-2">

                <Button variant="outline" onClick={() => setShowAddModal(false)}>

                  Cancel

                </Button>

                <Button 

                  onClick={() => {

                    console.log('🔍 Save button clicked!');

                    handleAddPricing();

                  }} 

                  className="bg-black hover:bg-gray-800 text-white border-0"

                >

                  <Save className="h-4 w-4 mr-2" />

                  Save Pricing

                </Button>

              </div>

            </div>

          </DialogContent>

        </Dialog>

      </div>



      {/* Tabs */}

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'phones' | 'laptops')}>

        <TabsList className="grid w-full grid-cols-2">

          <TabsTrigger value="phones" className="flex items-center gap-2">

            <Smartphone className="h-4 w-4" />

            Phones

          </TabsTrigger>

          <TabsTrigger value="laptops" className="flex items-center gap-2">

            <Laptop className="h-4 w-4" />

            Laptops

          </TabsTrigger>

        </TabsList>



        <TabsContent value="phones" className="space-y-4">

          <PhonePricingContent 

            pricing={getFilteredPricing()}

            onEdit={setEditingPricing}

            onDelete={setDeletePricing}

            onSave={handleEditPricing}

            editingPricing={editingPricing}

          />

        </TabsContent>



        <TabsContent value="laptops" className="space-y-4">

          <LaptopPricingContent 

            pricing={getFilteredPricing()}

            onEdit={setEditingPricing}

            onDelete={setDeletePricing}

            onSave={handleEditPricing}

            editingPricing={editingPricing}

          />

        </TabsContent>

      </Tabs>



      {/* Edit Modal */}

      {editingPricing && (

        <EditPricingModal

          pricing={editingPricing}

          onSave={handleEditPricing}

          onCancel={() => setEditingPricing(null)}

        />

      )}



      {/* Delete Confirmation Dialog */}

      <AlertDialog open={!!deletePricing} onOpenChange={(open) => !open && setDeletePricing(null)}>

        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>Delete Pricing</AlertDialogTitle>

            <AlertDialogDescription>

              Are you sure you want to delete the pricing for <strong>{deletePricing?.brand}</strong> - <strong>{deletePricing?.issue}</strong>?

              <br />

              <span className="text-sm text-muted-foreground">

                Basic: ₹{deletePricing?.basic?.toLocaleString()}, Standard: ₹{deletePricing?.standard?.toLocaleString()}, Premium: ₹{deletePricing?.premium?.toLocaleString()}

              </span>

            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction 

              onClick={() => {

                if (deletePricing) {

                  const documentId = deletePricing.id || deletePricing.$id;

                  if (documentId) {

                    handleDeletePricing(documentId);

                  } else {

                    toast.error('Cannot delete pricing: missing document ID');

                  }

                }

              }}

              className="bg-red-600 hover:bg-red-700 text-white border-0"

            >

              Delete Pricing

            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </div>

  );

}



// Phone Pricing Content Component

function PhonePricingContent({ 

  pricing, 

  onEdit, 

  onDelete, 

  onSave, 

  editingPricing 

}: {

  pricing: TierPricing[];

  onEdit: (pricing: TierPricing) => void;

  onDelete: (pricing: TierPricing) => void;

  onSave: (pricing: TierPricing) => void;

  editingPricing: TierPricing | null;

}) {

  const groupedByBrand = pricing.reduce((acc, p) => {

    if (!acc[p.brand]) acc[p.brand] = [];

    acc[p.brand].push(p);

    return acc;

  }, {} as Record<string, TierPricing[]>);



  return (

    <div className="space-y-6">

      {Object.entries(groupedByBrand).map(([brand, brandPricing]) => (

        <Card key={brand}>

          <CardHeader>

            <CardTitle className="flex items-center gap-2">

              <span>{brand}</span>

              <Badge variant="secondary">{brandPricing.length} issues</Badge>

            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="space-y-3">

              {brandPricing.map((pricingItem) => (

                <div key={pricingItem.id} className="flex items-center justify-between p-3 border rounded-lg">

                  <div className="flex-1">

                    <div className="font-medium">{pricingItem.issue}</div>

                    <div className="text-sm text-muted-foreground">

                    </div>

                  </div>

                  <div className="flex items-center gap-4">

                    <div className="text-right">

                      <div className="text-sm text-muted-foreground">Basic</div>

                      <div className="font-semibold">₹{pricingItem.basic.toLocaleString()}</div>

                    </div>

                    <div className="text-right">

                      <div className="text-sm text-muted-foreground">Standard</div>

                      <div className="font-semibold">₹{pricingItem.standard.toLocaleString()}</div>

                    </div>

                    <div className="text-right">

                      <div className="text-sm text-muted-foreground">Premium</div>

                      <div className="font-semibold">₹{pricingItem.premium.toLocaleString()}</div>

                    </div>

                    <div className="flex items-center gap-2">

                      <Button

                        size="sm"

                        variant="outline"

                        onClick={() => onEdit(pricingItem)}

                      >

                        <Edit className="h-4 w-4" />

                      </Button>

                      <Button

                        size="sm"

                        variant="destructive"

                        onClick={() => onDelete(pricingItem)}

                      >

                        <Trash2 className="h-4 w-4" />

                      </Button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </CardContent>

        </Card>

      ))}



      {pricing.length === 0 && (

        <Card>

          <CardContent className="py-12 text-center text-muted-foreground">

            <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />

            <p>No phone pricing configured yet</p>

            <p className="text-sm">Add your first pricing tier to get started</p>

          </CardContent>

        </Card>

      )}

    </div>

  );

}



// Laptop Pricing Content Component

function LaptopPricingContent({ 

  pricing, 

  onEdit, 

  onDelete, 

  onSave, 

  editingPricing 

}: {

  pricing: TierPricing[];

  onEdit: (pricing: TierPricing) => void;

  onDelete: (pricing: TierPricing) => void;

  onSave: (pricing: TierPricing) => void;

  editingPricing: TierPricing | null;

}) {

  const groupedByBrand = pricing.reduce((acc, p) => {

    if (!acc[p.brand]) acc[p.brand] = [];

    acc[p.brand].push(p);

    return acc;

  }, {} as Record<string, TierPricing[]>);



  return (

    <div className="space-y-6">

      {Object.entries(groupedByBrand).map(([brand, brandPricing]) => (

        <Card key={brand}>

          <CardHeader>

            <CardTitle className="flex items-center gap-2">

              <span>{brand}</span>

              <Badge variant="secondary">{brandPricing.length} issues</Badge>

            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="space-y-3">

              {brandPricing.map((pricingItem) => (

                <div key={pricingItem.id} className="flex items-center justify-between p-3 border rounded-lg">

                  <div className="flex-1">

                    <div className="font-medium">{pricingItem.issue}</div>

                    <div className="text-sm text-muted-foreground">

                    </div>

                  </div>

                  <div className="flex items-center gap-4">

                    <div className="text-right">

                      <div className="text-sm text-muted-foreground">Basic</div>

                      <div className="font-semibold">₹{pricingItem.basic.toLocaleString()}</div>

                    </div>

                    <div className="text-right">

                      <div className="text-sm text-muted-foreground">Standard</div>

                      <div className="font-semibold">₹{pricingItem.standard.toLocaleString()}</div>

                    </div>

                    <div className="text-right">

                      <div className="text-sm text-muted-foreground">Premium</div>

                      <div className="font-semibold">₹{pricingItem.premium.toLocaleString()}</div>

                    </div>

                    <div className="flex items-center gap-2">

                      <Button

                        size="sm"

                        variant="outline"

                        onClick={() => onEdit(pricingItem)}

                      >

                        <Edit className="h-4 w-4" />

                      </Button>

                      <Button

                        size="sm"

                        variant="destructive"

                        onClick={() => onDelete(pricingItem)}

                      >

                        <Trash2 className="h-4 w-4" />

                      </Button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </CardContent>

        </Card>

      ))}



      {pricing.length === 0 && (

        <Card>

          <CardContent className="py-12 text-center text-muted-foreground">

            <Laptop className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />

            <p>No laptop pricing configured yet</p>

            <p className="text-sm">Add your first pricing tier to get started</p>

          </CardContent>

        </Card>

      )}

    </div>

  );

}



// Edit Pricing Modal Component

function EditPricingModal({ 

  pricing, 

  onSave, 

  onCancel 

}: {

  pricing: TierPricing;

  onSave: (pricing: TierPricing) => void;

  onCancel: () => void;

}) {

  const [editedPricing, setEditedPricing] = useState(pricing);



  const handleSave = () => {

    onSave(editedPricing);

  };



  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">

      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">

        <div className="flex items-center justify-between mb-4">

          <h3 className="text-lg font-semibold">Edit Pricing</h3>

          <Button variant="ghost" size="sm" onClick={onCancel}>

            <X className="h-4 w-4" />

          </Button>

        </div>

        

        <div className="space-y-4">

          <div>

            <Label>Brand</Label>

            <div className="p-2 bg-muted rounded-md text-sm">{pricing.brand}</div>

          </div>

          <div>

            <Label>Issue</Label>

            <div className="p-2 bg-muted rounded-md text-sm">{pricing.issue}</div>

          </div>

          <div className="grid grid-cols-3 gap-2">

            <div>

              <Label>Basic (₹)</Label>

              <Input

                type="number"

                value={editedPricing.basic}

                onChange={(e) => setEditedPricing(prev => ({ ...prev, basic: parseInt(e.target.value) || 0 }))}

              />

            </div>

            <div>

              <Label>Standard (₹)</Label>

              <Input

                type="number"

                value={editedPricing.standard}

                onChange={(e) => setEditedPricing(prev => ({ ...prev, standard: parseInt(e.target.value) || 0 }))}

              />

            </div>

            <div>

              <Label>Premium (₹)</Label>

              <Input

                type="number"

                value={editedPricing.premium}

                onChange={(e) => setEditedPricing(prev => ({ ...prev, premium: parseInt(e.target.value) || 0 }))}

              />

            </div>

          </div>

          <div className="flex justify-end gap-2 pt-4">

            <Button variant="outline" onClick={onCancel}>

              Cancel

            </Button>

            <Button onClick={handleSave} className="bg-black hover:bg-gray-800 text-white border-0">

              <Save className="h-4 w-4 mr-2" />

              Save Changes

            </Button>

          </div>

        </div>

      </div>

    </div>

  );

}


