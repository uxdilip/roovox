"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { databases, DATABASE_ID } from "@/lib/appwrite";
import { toast } from "@/hooks/use-toast";

interface EditIndividualServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: any;
  onSuccess: () => void;
}

export default function EditIndividualServiceModal({
  open,
  onOpenChange,
  service,
  onSuccess
}: EditIndividualServiceModalProps) {
  const [form, setForm] = useState({
    price: "",
    partType: "OEM",
    warranty: "3 months",
  });
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens or service changes
  useEffect(() => {
    if (open && service) {
      setForm({
        price: service.price?.toString() || "",
        partType: service.partType || "OEM",
        warranty: service.warranty || "3 months",
      });
    }
  }, [open, service]);

  const handleFormChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.price) {
      toast({ title: "Error", description: "Please fill all required fields." });
      return;
    }
    
    setLoading(true);
    try {
      await databases.updateDocument(
        DATABASE_ID,
        "services_offered",
        service.$id,
        {
          price: Number(form.price),
          partType: form.partType,
          warranty: form.warranty,
        }
      );
      
      toast({ title: "Success", description: "Service updated successfully!" });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({ title: "Error", description: "Failed to update service." });
    } finally {
      setLoading(false);
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
          <p className="text-sm text-gray-600">
            Update pricing for {service.brand} {service.model} - {service.issue}
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Device Info (Read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input 
                id="brand"
                value={service.brand}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <Label htmlFor="model">Model</Label>
              <Input 
                id="model"
                value={service.model}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Issue Info (Read-only) */}
          <div>
            <Label htmlFor="issue">Issue</Label>
            <Input 
              id="issue"
              value={service.issue}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partType">Part Type</Label>
              <Select value={form.partType} onValueChange={v => handleFormChange("partType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select part type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OEM">OEM</SelectItem>
                  <SelectItem value="HQ">HQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="warranty">Warranty</Label>
              <Input 
                id="warranty"
                value={form.warranty} 
                onChange={e => handleFormChange("warranty", e.target.value)} 
                placeholder="e.g. 3 months" 
                required 
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="price">Price (₹)</Label>
            <Input 
              id="price"
              type="number" 
              value={form.price} 
              onChange={e => handleFormChange("price", e.target.value)} 
              min={0} 
              required 
            />
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

