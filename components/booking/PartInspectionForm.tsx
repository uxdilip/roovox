"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Camera, MapPin, Clock, DollarSign } from 'lucide-react';
import { PartInspectionRequest } from '@/types/technician';

interface PartInspectionFormProps {
  deviceInfo: {
    brand: string;
    model: string;
    issue: string;
  };
  onSubmit: (request: PartInspectionRequest) => void;
  onBack: () => void;
}

export function PartInspectionForm({ deviceInfo, onSubmit, onBack }: PartInspectionFormProps) {
  const [formData, setFormData] = useState({
    part_type: '',
    quality_preference: 'standard' as 'basic' | 'standard' | 'premium',
    specific_requirements: '',
    urgency: 'same_day' as 'immediate' | 'same_day' | 'scheduled',
    budget_min: 50,
    budget_max: 500,
    address: '',
    inspection_requirements: {
      on_site_inspection: true,
      photo_documentation: true,
      warranty_verification: false,
      compatibility_check: true,
    }
  });

  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const partTypes = [
    'Screen/Display',
    'Battery',
    'Charging Port',
    'Camera',
    'Speaker',
    'Microphone',
    'Home Button',
    'Power Button',
    'Volume Buttons',
    'Back Cover',
    'Motherboard',
    'Memory/Storage',
    'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const request: PartInspectionRequest = {
      id: Date.now().toString(),
      device_info: {
        brand: deviceInfo.brand,
        model: deviceInfo.model,
        issue_description: deviceInfo.issue,
      },
      part_details: {
        part_type: formData.part_type,
        quality_preference: formData.quality_preference,
        specific_requirements: formData.specific_requirements,
      },
      inspection_requirements: formData.inspection_requirements,
      uploaded_documents: uploadedFiles,
      customer_location: {
        lat: 37.7749, // Mock coordinates
        lng: -122.4194,
        address: formData.address,
      },
      urgency: formData.urgency,
      budget_range: {
        min: formData.budget_min,
        max: formData.budget_max,
      },
    };

    onSubmit(request);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Part Inspection Request</h2>
          <p className="text-muted-foreground">
            {deviceInfo.brand} {deviceInfo.model} - {deviceInfo.issue}
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Part Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Part Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="part_type">Part Type</Label>
                <Select value={formData.part_type} onValueChange={(value) => 
                  setFormData({ ...formData, part_type: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the part that needs inspection" />
                  </SelectTrigger>
                  <SelectContent>
                    {partTypes.map((part) => (
                      <SelectItem key={part} value={part}>{part}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quality Preference</Label>
                <RadioGroup 
                  value={formData.quality_preference} 
                  onValueChange={(value: 'basic' | 'standard' | 'premium') => 
                    setFormData({ ...formData, quality_preference: value })
                  }
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="basic" id="basic" />
                    <Label htmlFor="basic">Basic - Budget-friendly option</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard">Standard - Good quality and warranty</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="premium" id="premium" />
                    <Label htmlFor="premium">Premium - Original or high-end parts</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="requirements">Specific Requirements</Label>
                <Textarea
                  id="requirements"
                  value={formData.specific_requirements}
                  onChange={(e) => setFormData({ ...formData, specific_requirements: e.target.value })}
                  placeholder="Any specific requirements, color preferences, or additional notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Inspection Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Inspection Requirements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="on_site"
                    checked={formData.inspection_requirements.on_site_inspection}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        inspection_requirements: {
                          ...formData.inspection_requirements,
                          on_site_inspection: checked as boolean
                        }
                      })
                    }
                  />
                  <Label htmlFor="on_site">On-site inspection required</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="photo_doc"
                    checked={formData.inspection_requirements.photo_documentation}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        inspection_requirements: {
                          ...formData.inspection_requirements,
                          photo_documentation: checked as boolean
                        }
                      })
                    }
                  />
                  <Label htmlFor="photo_doc">Photo documentation needed</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="warranty"
                    checked={formData.inspection_requirements.warranty_verification}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        inspection_requirements: {
                          ...formData.inspection_requirements,
                          warranty_verification: checked as boolean
                        }
                      })
                    }
                  />
                  <Label htmlFor="warranty">Warranty verification</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compatibility"
                    checked={formData.inspection_requirements.compatibility_check}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData,
                        inspection_requirements: {
                          ...formData.inspection_requirements,
                          compatibility_check: checked as boolean
                        }
                      })
                    }
                  />
                  <Label htmlFor="compatibility">Compatibility check</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="file-upload">Upload Photos/Documents</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload photos of the damaged part
                      </span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, PDF up to 10MB each
                    </p>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>Uploaded Files:</Label>
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((file, index) => (
                        <Badge key={index} variant="secondary">
                          File {index + 1}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Service Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="address">Your Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your full address for technician dispatch"
                  required
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Service Urgency</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={formData.urgency} 
                onValueChange={(value: 'immediate' | 'same_day' | 'scheduled') => 
                  setFormData({ ...formData, urgency: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate">
                    <div>
                      <div className="font-medium">Immediate</div>
                      <div className="text-sm text-muted-foreground">Within 2 hours</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="same_day" id="same_day" />
                  <Label htmlFor="same_day">
                    <div>
                      <div className="font-medium">Same Day</div>
                      <div className="text-sm text-muted-foreground">Within 8 hours</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled">
                    <div>
                      <div className="font-medium">Scheduled</div>
                      <div className="text-sm text-muted-foreground">Choose date & time</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Budget Range</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="budget_min">Minimum Budget</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={formData.budget_min}
                  onChange={(e) => setFormData({ ...formData, budget_min: parseInt(e.target.value) })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="budget_max">Maximum Budget</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) => setFormData({ ...formData, budget_max: parseInt(e.target.value) })}
                  min="0"
                />
              </div>
              <div className="text-center text-lg font-semibold">
                ${formData.budget_min} - ${formData.budget_max}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg">
            Find Technicians
          </Button>
        </div>
      </form>
    </div>
  );
}