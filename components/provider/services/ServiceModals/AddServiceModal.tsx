"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { toast } from "@/hooks/use-toast";

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  onSuccess: () => void;
}

const DEVICE_TYPES = [
  { value: "phone", label: "Phone" },
  { value: "laptop", label: "Laptop" },
];

export default function AddServiceModal({
  open,
  onOpenChange,
  providerId,
  onSuccess
}: AddServiceModalProps) {
  const [form, setForm] = useState({
    deviceType: "phone",
    brand: "",
    model: "",
    issue: "",
    partType: "OEM",
    price: "",
    warranty: "3 months",
  });
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm({
        deviceType: "phone",
        brand: "",
        model: "",
        issue: "",
        partType: "OEM",
        price: "",
        warranty: "3 months",
      });
    }
  }, [open]);

  // Fetch brands when device type changes
  useEffect(() => {
    if (!form.deviceType) return;
    setBrands([]);
    setForm(f => ({ ...f, brand: "", model: "", issue: "" }));
    setModels([]);
    setIssues([]);
    setLoading(true);
    
    const collection = form.deviceType === "phone" ? COLLECTIONS.PHONES : COLLECTIONS.LAPTOPS;
    let allDocs: any[] = [];
    let offset = 0;
    const LIMIT = 100;
    
    const fetchAll = async () => {
      let keepFetching = true;
      while (keepFetching) {
        const res = await databases.listDocuments(
          DATABASE_ID,
          collection,
          [Query.limit(LIMIT), Query.offset(offset)]
        );
        allDocs = allDocs.concat(res.documents);
        if (res.documents.length < LIMIT) {
          keepFetching = false;
        } else {
          offset += LIMIT;
        }
      }
      const brandsList = Array.from(
        new Set(
          allDocs
            .map((d: any) => d.brand && d.brand.trim())
            .filter(Boolean)
        )
      );
      setBrands(brandsList);
      setLoading(false);
    };
    fetchAll().catch(() => setLoading(false));
  }, [form.deviceType]);

  // Fetch models when brand changes
  useEffect(() => {
    if (!form.deviceType || !form.brand) return;
    setModels([]);
    setForm(f => ({ ...f, model: "", issue: "" }));
    setLoading(true);
    
    const collection = form.deviceType === "phone" ? COLLECTIONS.PHONES : COLLECTIONS.LAPTOPS;
    let allDocs: any[] = [];
    let offset = 0;
    const LIMIT = 100;
    
    const fetchAll = async () => {
      let keepFetching = true;
      while (keepFetching) {
        const res = await databases.listDocuments(
          DATABASE_ID,
          collection,
          [Query.equal("brand", form.brand), Query.limit(LIMIT), Query.offset(offset)]
        );
        allDocs = allDocs.concat(res.documents);
        if (res.documents.length < LIMIT) {
          keepFetching = false;
        } else {
          offset += LIMIT;
        }
      }
      const uniqueModels = Array.from(new Set(allDocs.map((d: any) => d.model))).filter(Boolean);
      setModels(uniqueModels);
      setLoading(false);
    };
    fetchAll().catch(() => setLoading(false));
  }, [form.deviceType, form.brand]);

  // Fetch issues when device type changes
  useEffect(() => {
    if (!form.deviceType) return;
    setIssues([]);
    setForm(f => ({ ...f, issue: "" }));
    setLoading(true);
    
    databases
      .listDocuments(
        DATABASE_ID,
        'categories',
        []
      )
      .then(res => {
        const category = res.documents.find((c: any) => 
          c.name.toLowerCase() === (form.deviceType === "phone" ? "phone" : "laptop")
        );
        if (!category) {
          setIssues([]);
          setLoading(false);
          return;
        }
        databases
          .listDocuments(
            DATABASE_ID,
            COLLECTIONS.ISSUES,
            [Query.equal("category_id", category.$id)]
          )
          .then(res2 => {
            setIssues(res2.documents);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, [form.deviceType]);

  const handleFormChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deviceType || !form.brand || !form.model || !form.issue || !form.price) {
      toast({ title: "Error", description: "Please fill all required fields." });
      return;
    }
    
    setLoading(true);
    try {
      const isScreen = issues.find(i => i.$id === form.issue)?.type === 'screen';
      await databases.createDocument(
        DATABASE_ID,
        "services_offered",
        "unique()",
        {
          providerId: providerId,
          deviceType: form.deviceType,
          brand: form.brand,
          model: form.model,
          issue: form.issue,
          price: Number(form.price),
          partType: isScreen ? form.partType : '',
          warranty: isScreen ? form.warranty : '',
          created_at: new Date().toISOString(),
        }
      );
      
      toast({ title: "Success", description: "Service added successfully!" });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({ title: "Error", description: "Failed to add service." });
    } finally {
      setLoading(false);
    }
  };

  const getIssueType = (issueId: string) => {
    const found = issues.find(i => i.$id === issueId);
    return found?.type || null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
          <p className="text-sm text-gray-600">Add pricing for a specific device and issue</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deviceType">Device Type</Label>
              <Select value={form.deviceType} onValueChange={v => handleFormChange("deviceType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map(dt => (
                    <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Select value={form.brand} onValueChange={v => handleFormChange("brand", v)} disabled={!brands.length}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.filter(b => b).map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="model">Model</Label>
              <Select value={form.model} onValueChange={v => handleFormChange("model", v)} disabled={!models.length}>
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
              <Label htmlFor="issue">Issue</Label>
              <Select value={form.issue} onValueChange={v => handleFormChange("issue", v)} disabled={!issues.length}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue" />
                </SelectTrigger>
                <SelectContent>
                  {issues.map(i => (
                    <SelectItem key={i.$id} value={i.$id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {getIssueType(form.issue) === 'screen' && (
              <>
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
              </>
            )}
            
            <div className="col-span-2">
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
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 