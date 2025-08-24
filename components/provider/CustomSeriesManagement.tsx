'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus, Eye, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getCustomSeriesByProvider, 
  getCustomSeriesServices, 
  deleteCustomSeries,
  updateCustomSeriesService 
} from '@/lib/appwrite-services';

interface CustomSeriesManagementProps {
  providerId: string;
}

interface CustomSeries {
  $id: string;
  name: string;
  description: string;
  deviceType: 'phone' | 'laptop';
  models: Array<{ brand: string; model: string }>;
  created_at: string;
}

interface CustomSeriesService {
  $id: string;
  issue: string;
  partType: string;
  price: number;
  warranty: string | null;
}

export default function CustomSeriesManagement({ providerId }: CustomSeriesManagementProps) {
  const { toast } = useToast();
  const [customSeries, setCustomSeries] = useState<CustomSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<CustomSeries | null>(null);
  const [seriesServices, setSeriesServices] = useState<CustomSeriesService[]>([]);

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPricingModal, setShowAddPricingModal] = useState(false);
  const [editingService, setEditingService] = useState<CustomSeriesService | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editWarranty, setEditWarranty] = useState('');
  const [newPricing, setNewPricing] = useState<{
    issue: string;
    partType: string;
    price: number;
    warranty: string;
  }>({
    issue: '',
    partType: 'OEM',
    price: 0,
    warranty: '6 months'
  });
  const [availableIssues, setAvailableIssues] = useState<any[]>([]);

  useEffect(() => {
    loadCustomSeries();
    loadAvailableIssues();
  }, [providerId]);

  const loadAvailableIssues = async () => {
    try {
      const { getIssuesByCategory } = await import('@/lib/appwrite-services');
      const issues = await getIssuesByCategory('phone'); // Default to phone, can be made dynamic
      setAvailableIssues(issues);
    } catch (error) {
      console.error('Error loading issues:', error);
    }
  };

  const loadCustomSeries = async () => {
    try {
      const series = await getCustomSeriesByProvider(providerId);
      setCustomSeries(series);
    } catch (error) {
      console.error('Error loading custom series:', error);
      toast({
        title: "Error",
        description: "Failed to load custom series",
        variant: "destructive",
      });
    }
  };

  const loadSeriesServices = async (seriesId: string) => {
    try {
      const services = await getCustomSeriesServices(seriesId);
      setSeriesServices(services);
    } catch (error) {
      console.error('Error loading series services:', error);
    }
  };

  const handleViewPricing = async (series: CustomSeries) => {
    setSelectedSeries(series);
    await loadSeriesServices(series.$id);
    setShowPricingModal(true);
  };

  const handleEditService = (service: CustomSeriesService) => {
    setEditingService(service);
    setEditPrice(service.price);
    setEditWarranty(service.warranty || '');
    setShowEditModal(true);
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    try {
      await updateCustomSeriesService(editingService.$id, {
        price: editPrice,
        warranty: editWarranty || null,
      });

      // Refresh services
      if (selectedSeries) {
        await loadSeriesServices(selectedSeries.$id);
      }

      setShowEditModal(false);
      setEditingService(null);
      
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSeries = async (seriesId: string, seriesName: string) => {
    if (!confirm(`Are you sure you want to delete "${seriesName}"? This will also delete all associated pricing.`)) {
      return;
    }

    try {
      await deleteCustomSeries(seriesId);
      await loadCustomSeries();
      
      toast({
        title: "Success",
        description: `Series "${seriesName}" deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting series:', error);
      toast({
        title: "Error",
        description: "Failed to delete series",
        variant: "destructive",
      });
    }
  };

  const handleAddPricing = async (series: CustomSeries) => {
    setSelectedSeries(series);
    setShowAddPricingModal(true);
  };

  const handleCreatePricing = async () => {
    if (!selectedSeries || !newPricing.issue || newPricing.price <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { createCustomSeriesService } = await import('@/lib/appwrite-services');
      await createCustomSeriesService({
        customSeriesId: selectedSeries.$id,
        providerId,
        issue: newPricing.issue,
        partType: newPricing.partType,
        price: newPricing.price,
        warranty: newPricing.warranty || null,
      });

      // Refresh services
      await loadSeriesServices(selectedSeries.$id);
      
      // Reset form
      setNewPricing({
        issue: '',
        partType: 'OEM',
        price: 0,
        warranty: '6 months'
      });

      toast({
        title: "Success",
        description: "Pricing added successfully",
      });
    } catch (error) {
      console.error('Error creating pricing:', error);
      toast({
        title: "Error",
        description: "Failed to add pricing",
        variant: "destructive",
      });
    }
  };

  const getBrandCount = (models: Array<{ brand: string; model: string }>) => {
    const brands = new Set(models.map(m => m.brand));
    return brands.size;
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Custom Series Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage your custom series and their pricing
          </p>
        </div>
      </div>

      {customSeries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground">No custom series created yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first custom series to group models from multiple brands
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {customSeries.map((series) => (
            <Card key={series.$id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{series.name}</CardTitle>
                    <CardDescription>
                      {series.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {series.deviceType}
                    </Badge>
                    <Badge variant="outline">
                      {series.models.length} models
                    </Badge>
                    <Badge variant="outline">
                      {getBrandCount(series.models)} brands
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Models Preview */}
                  <div>
                    <Label className="text-sm font-medium">Models:</Label>
                                       <div className="flex flex-wrap gap-1 mt-1">
                     {series.models.slice(0, 5).map((modelObj, index) => {
                       return (
                         <Badge key={index} variant="secondary" className="text-xs">
                           {modelObj.brand} {modelObj.model}
                         </Badge>
                       );
                     })}
                     {series.models.length > 5 && (
                       <Badge variant="secondary" className="text-xs">
                         +{series.models.length - 5} more
                       </Badge>
                     )}
                   </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPricing(series)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Pricing
                    </Button>
                                         <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleViewPricing(series)}
                     >
                       <Settings className="h-4 w-4 mr-1" />
                       Manage Pricing
                     </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSeries(series.$id, series.name)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pricing Modal */}
      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Pricing for "{selectedSeries?.name}"
            </DialogTitle>
            <DialogDescription>
              Manage pricing for all models in this custom series
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Series Info:</Label>
                <div className="text-sm text-muted-foreground mt-1">
                  <p>Device Type: {selectedSeries?.deviceType}</p>
                  <p>Models: {selectedSeries?.models.length}</p>
                  <p>Brands: {selectedSeries ? getBrandCount(selectedSeries.models) : 0}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Models:</Label>
                               <div className="text-sm text-muted-foreground mt-1 max-h-20 overflow-y-auto">
                 {selectedSeries?.models.map((modelObj, index) => {
                   return (
                     <div key={index}>
                       {modelObj.brand} {modelObj.model}
                     </div>
                   );
                 })}
               </div>
              </div>
            </div>

            {seriesServices.length > 0 ? (
              <div>
                <Label className="text-sm font-medium">Pricing:</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue</TableHead>
                      <TableHead>Part Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Warranty</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seriesServices.map((service) => (
                      <TableRow key={service.$id}>
                        <TableCell>{service.issue}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{service.partType}</Badge>
                        </TableCell>
                        <TableCell>₹{service.price}</TableCell>
                        <TableCell>{service.warranty || 'No warranty'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditService(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
                         ) : (
               <div className="text-center py-4">
                 <div className="text-muted-foreground mb-4">
                   No pricing set for this series yet
                 </div>
                                   <Button 
                    onClick={() => selectedSeries && handleAddPricing(selectedSeries)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                   <Plus className="h-4 w-4 mr-2" />
                   Add Pricing
                 </Button>
               </div>
             )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Service Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service Pricing</DialogTitle>
            <DialogDescription>
              Update pricing for {editingService?.issue} ({editingService?.partType})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(Number(e.target.value))}
                placeholder="Enter price"
              />
            </div>
            
            <div>
              <Label htmlFor="warranty">Warranty (months)</Label>
              <Input
                id="warranty"
                type="number"
                value={editWarranty}
                onChange={(e) => setEditWarranty(e.target.value)}
                placeholder="Enter warranty in months"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateService}>
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Pricing Modal */}
      <Dialog open={showAddPricingModal} onOpenChange={setShowAddPricingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Pricing for "{selectedSeries?.name}"</DialogTitle>
            <DialogDescription>
              Add pricing for a specific issue and part type
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="issue">Issue *</Label>
              <Select 
                value={newPricing.issue} 
                onValueChange={(value) => setNewPricing({...newPricing, issue: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an issue" />
                </SelectTrigger>
                <SelectContent>
                  {availableIssues.map((issue) => (
                    <SelectItem key={issue.$id} value={issue.name}>
                      {issue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="partType">Part Type *</Label>
              <Select 
                value={newPricing.partType} 
                onValueChange={(value) => setNewPricing({...newPricing, partType: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OEM">OEM</SelectItem>
                  <SelectItem value="HQ">High Quality</SelectItem>
                  <SelectItem value="Single">Single</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={newPricing.price}
                onChange={(e) => setNewPricing({...newPricing, price: Number(e.target.value)})}
                placeholder="Enter price"
                min="0"
              />
            </div>
            
            <div>
              <Label htmlFor="warranty">Warranty</Label>
              <Input
                id="warranty"
                value={newPricing.warranty}
                onChange={(e) => setNewPricing({...newPricing, warranty: e.target.value})}
                placeholder="e.g., 6 months"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowAddPricingModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePricing}>
              Add Pricing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 