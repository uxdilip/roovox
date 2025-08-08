"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Plus } from "lucide-react";
import { 
  updateCustomSeries,
  getBrandsByCategory,
  getPhones,
  getLaptops
} from "@/lib/appwrite-services";

interface EditSeriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesData: any;
  onSuccess: () => void;
}

interface DeviceModel {
  brand: string;
  model: string;
}

export default function EditSeriesModal({
  open,
  onOpenChange,
  seriesData,
  onSuccess
}: EditSeriesModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<{ key: string; label: string }[]>([]);
  const [availableModels, setAvailableModels] = useState<DeviceModel[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);

  // Form state
  const [seriesName, setSeriesName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModels, setSelectedModels] = useState<DeviceModel[]>([]);

  const isCustomSeries = seriesData?.isCustom;

  // Load initial data when modal opens
  useEffect(() => {
    if (open && seriesData) {
      setSeriesName(seriesData.name || '');
      setDescription(seriesData.description || '');
      
      // Convert existing models from string format to object format
      if (seriesData.models && Array.isArray(seriesData.models)) {
        const models = seriesData.models.map((modelString: string) => {
          const [brand, model] = modelString.split(':');
          return { brand, model };
        });
        setSelectedModels(models);
      }
      
      loadBrands();
    }
  }, [open, seriesData]);

  // Auto-load models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      loadModels(selectedBrand);
    } else {
      setAvailableModels([]);
    }
  }, [selectedBrand, seriesData?.deviceType]);

  const loadBrands = async () => {
    try {
      const brandsData = await getBrandsByCategory(seriesData.deviceType || 'phone');
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const loadModels = async (brand: string) => {
    if (!brand) return;
    
    setLoadingModels(true);
    try {
      let allDevices;
      if (seriesData.deviceType === 'phone') {
        allDevices = await getPhones();
      } else {
        allDevices = await getLaptops();
      }
      
      const brandDevices = allDevices.filter(device => 
        device.brand.toLowerCase() === brand.toLowerCase()
      );
      
      const models = brandDevices.map(device => ({
        brand: device.brand,
        model: device.model
      }));
      
      setAvailableModels(models);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const addModel = (model: DeviceModel) => {
    const exists = selectedModels.some(m => m.brand === model.brand && m.model === model.model);
    if (!exists) {
      setSelectedModels([...selectedModels, model]);
    }
  };

  const removeModel = (model: DeviceModel) => {
    setSelectedModels(selectedModels.filter(m => 
      !(m.brand === model.brand && m.model === model.model)
    ));
  };

  const addAllModels = () => {
    const filteredModels = availableModels.filter(model =>
      model.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const newModels = filteredModels.filter(model => 
      !selectedModels.some(selected => 
        selected.brand === model.brand && selected.model === model.model
      )
    );
    
    setSelectedModels([...selectedModels, ...newModels]);
  };

  const handleSave = async () => {
    if (!seriesName.trim()) {
      toast({
        title: "Error",
        description: "Series name is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedModels.length === 0) {
      toast({
        title: "Error",
        description: "At least one model must be selected",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateCustomSeries(seriesData.$id, {
        name: seriesName,
        description: description,
        models: selectedModels
      });

      toast({
        title: "Success",
        description: "Series updated successfully!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating series:', error);
      toast({
        title: "Error",
        description: "Failed to update series",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = availableModels.filter(model =>
    model.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!seriesData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Edit Series: {seriesData.name}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Update series name, description, and models
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Series Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Series Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seriesName">Series Name</Label>
                <Input
                  id="seriesName"
                  value={seriesName}
                  onChange={(e) => setSeriesName(e.target.value)}
                  placeholder="Enter series name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter series description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Models Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Models ({selectedModels.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Models */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label>Select Brand</Label>
                    <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.key} value={brand.key}>
                            {brand.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={addAllModels} disabled={!selectedBrand || loadingModels || filteredModels.length === 0}>
                      {loadingModels ? 'Loading...' : 'Add All'}
                    </Button>
                  </div>
                </div>

                {/* Search Models */}
                {availableModels.length > 0 && (
                  <div>
                    <Label>Search Models</Label>
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search models..."
                    />
                  </div>
                )}

                {/* Available Models */}
                {availableModels.length > 0 && (
                  <div>
                    <Label>Available Models ({filteredModels.length})</Label>
                    <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                      {filteredModels.map((model, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                          onClick={() => addModel(model)}
                        >
                          <span className="text-sm">{model.model}</span>
                          <Plus className="h-4 w-4" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Models */}
              <div>
                <Label>Selected Models ({selectedModels.length})</Label>
                <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                  {selectedModels.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No models selected</p>
                    </div>
                  ) : (
                    selectedModels.map((model, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">{model.brand}</Badge>
                          <span className="text-sm">{model.model}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeModel(model)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 