"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";
import { ChevronUp, ChevronDown, Filter } from "lucide-react";

export default function ProviderServicesPage() {
  // Enable both 'Mobile' and 'Laptop' as device type options
  const DEVICE_TYPES = [
    { value: "phone", label: "Phone" },
    { value: "laptop", label: "Laptop" },
  ];
  const { user, isLoading: authLoading } = useAuth();
  if (!user) return null;
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  // Set default form.deviceType to 'Mobile'
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
  const [issues, setIssues] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();
  const [editService, setEditService] = useState<any | null>(null);
  const [deleteService, setDeleteService] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterDevice, setFilterDevice] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [filterIssue, setFilterIssue] = useState<string>("all");
  const [issueIdToName, setIssueIdToName] = useState<Record<string, string>>({});

  // Device types should be 'phone' and 'laptop' (lowercase)
  const [allIssues, setAllIssues] = useState<any[]>([]);
  useEffect(() => {
    let all: any[] = [];
    let offset = 0;
    const limit = 100;
    let keepFetching = true;
    const fetchAllIssues = async () => {
      while (keepFetching) {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.ISSUES,
          [Query.limit(limit), Query.offset(offset)]
        );
        all = all.concat(res.documents);
        if (res.documents.length < limit) {
          keepFetching = false;
        } else {
          offset += limit;
        }
      }
      setAllIssues(all);
      const map: Record<string, string> = {};
      all.forEach((issue: any) => {
        map[issue.$id] = issue.name;
      });
      setIssueIdToName(map);
    };
    fetchAllIssues();
  }, []);

  // Helper to get issues for current device type
  const getIssuesForDeviceType = (deviceType: string) => {
    const category = deviceType === "phone" ? "phone" : "laptop";
    return allIssues.filter((i: any) => i.category_id && i.category_id.toLowerCase().includes(category));
  };

  // Helper to get issue type (e.g. 'screen')
  const getIssueType = (issueId: string) => {
    const found = allIssues.find(i => i.$id === issueId);
    return found?.type || null;
  };

  useEffect(() => {
    if (!user || authLoading) return;
    setLoading(true);
    setError("");
    databases
      .listDocuments(
        DATABASE_ID,
        "services_offered",
        [Query.equal("providerId", user.id)]
      )
      .then((res) => {
        setServices(res.documents);
        console.log('Loaded services_offered:', res.documents);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load services");
        setLoading(false);
      });
  }, [user, authLoading]);

  // Fetch all brands for the selected device type, same logic as customer flow
  useEffect(() => {
    if (!form.deviceType) return;
    setBrands([]);
    setForm(f => ({ ...f, brand: "", model: "" }));
    setModels([]);
    setForm(f => ({ ...f, model: "" }));
    setIssues([]);
    setForm(f => ({ ...f, issue: "" }));
    setFormLoading(true);
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
      // Extract all unique, trimmed brand names (no uppercasing, no extra filtering)
      const brandsList = Array.from(
        new Set(
          allDocs
            .map((d: any) => d.brand && d.brand.trim())
            .filter(Boolean)
        )
      );
      setBrands(brandsList);
      setFormLoading(false);
    };
    fetchAll().catch(() => setFormLoading(false));
  }, [form.deviceType]);

  // Fetch models when brand changes
  useEffect(() => {
    if (!form.deviceType || !form.brand) return;
    setModels([]);
    setForm(f => ({ ...f, model: "" }));
    setFormLoading(true);
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
      setFormLoading(false);
    };
    fetchAll().catch(() => setFormLoading(false));
  }, [form.deviceType, form.brand]);

  // Fetch issues when deviceType changes (Add Service modal)
  useEffect(() => {
    if (!form.deviceType) return;
    setIssues([]);
    setForm(f => ({ ...f, issue: "" }));
    setFormLoading(true);
    databases
      .listDocuments(
        DATABASE_ID,
        COLLECTIONS.CATEGORIES,
        []
      )
      .then(res => {
        const category = res.documents.find((c: any) => c.name.toLowerCase() === (form.deviceType === "phone" ? "phone" : "laptop"));
        if (!category) {
          setIssues([]);
          setFormLoading(false);
          return;
        }
        databases
          .listDocuments(
            DATABASE_ID,
            COLLECTIONS.ISSUES,
            [Query.equal("category_id", category.$id)]
          )
          .then(res2 => {
            setIssues(res2.documents.map((i: any) => i.name));
            setFormLoading(false);
          })
          .catch(() => setFormLoading(false));
      })
      .catch(() => setFormLoading(false));
  }, [form.deviceType]);

  // Edit modal form state
  const [editForm, setEditForm] = useState(form);
  useEffect(() => {
    if (editService) {
      setEditForm({
        deviceType: editService.deviceType,
        brand: editService.brand,
        model: editService.model,
        issue: editService.issue,
        partType: editService.partType,
        price: String(editService.price),
        warranty: editService.warranty,
      });
    }
  }, [editService]);

  // Fetch all brands for edit modal, same logic as customer flow
  useEffect(() => {
    if (!editService) return;
    setBrands([]);
    setEditForm(f => ({ ...f, brand: "", model: "" }));
    setModels([]);
    setEditForm(f => ({ ...f, model: "" }));
    setIssues([]);
    setEditForm(f => ({ ...f, issue: "" }));
    setFormLoading(true);
    const collection = editForm.deviceType === "phone" ? COLLECTIONS.PHONES : COLLECTIONS.LAPTOPS;
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
      // Extract all unique, trimmed brand names
      const brandsList = Array.from(
        new Set(
          allDocs
            .map((d: any) => d.brand && d.brand.trim())
            .filter(Boolean)
        )
      );
      setBrands(brandsList);
      setFormLoading(false);
    };
    fetchAll().catch(() => setFormLoading(false));
  }, [editService, editForm.deviceType]);

  // Fetch models when brand changes
  useEffect(() => {
    if (!editForm.deviceType || !editForm.brand) return;
    setModels([]);
    setEditForm(f => ({ ...f, model: "" }));
    setFormLoading(true);
    databases
      .listDocuments(
        DATABASE_ID,
        COLLECTIONS.LAPTOPS,
        [Query.equal("category", editForm.deviceType === "phone" ? "phone" : "laptop"), Query.equal("brand", editForm.brand)]
      )
      .then(res => {
        const uniqueModels = Array.from(new Set(res.documents.map((d: any) => d.model))).filter(Boolean);
        setModels(uniqueModels);
        setFormLoading(false);
      })
      .catch(() => setFormLoading(false));
  }, [editForm.deviceType, editForm.brand]);

  // Fetch issues when deviceType changes (Edit Service modal)
  useEffect(() => {
    if (!editForm.deviceType) return;
    setIssues([]);
    setEditForm(f => ({ ...f, issue: "" }));
    setFormLoading(true);
    databases
      .listDocuments(
        DATABASE_ID,
        COLLECTIONS.CATEGORIES,
        []
      )
      .then(res => {
        const category = res.documents.find((c: any) => c.name.toLowerCase() === (editForm.deviceType === "phone" ? "phone" : "laptop"));
        if (!category) {
          setIssues([]);
          setFormLoading(false);
          return;
        }
        databases
          .listDocuments(
            DATABASE_ID,
            COLLECTIONS.ISSUES,
            [Query.equal("category_id", category.$id)]
          )
          .then(res2 => {
            setIssues(res2.documents.map((i: any) => i.name));
            setFormLoading(false);
          })
          .catch(() => setFormLoading(false));
      })
      .catch(() => setFormLoading(false));
  }, [editForm.deviceType]);

  const handleFormChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.deviceType || !form.brand || !form.model || !form.issue || !form.price) {
      toast({ title: "Error", description: "Please fill all fields." });
      return;
    }
    setFormLoading(true);
    try {
      const isScreen = modalIssues.find(i => i.$id === form.issue)?.type === 'screen';
      await databases.createDocument(
        DATABASE_ID,
        "services_offered",
        "unique()",
        {
          providerId: user.id,
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
      toast({ title: "Service added!", description: "Your service has been added." });
      setShowAddModal(false);
      setForm({ deviceType: "phone", brand: "", model: "", issue: "", partType: "OEM", price: "", warranty: "3 months" });
      // Refresh services
      setLoading(true);
      databases
        .listDocuments(
          DATABASE_ID,
          "services_offered",
          [Query.equal("providerId", user.id)]
        )
        .then((res) => {
          setServices(res.documents);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } catch (err) {
      toast({ title: "Error", description: "Failed to add service." });
      setFormLoading(false);
    }
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(f => ({ ...f, [field]: value }));
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editService) return;
    setFormLoading(true);
    try {
      const isScreen = editModalIssues.find(i => i.$id === editForm.issue)?.type === 'screen';
      await databases.updateDocument(
        DATABASE_ID,
        "services_offered",
        editService.$id,
        {
          deviceType: editForm.deviceType,
          brand: editForm.brand,
          model: editForm.model,
          issue: editForm.issue,
          price: Number(editForm.price),
          partType: isScreen ? editForm.partType : '',
          warranty: isScreen ? editForm.warranty : '',
        }
      );
      toast({ title: "Service updated!", description: "Your service has been updated." });
      setEditService(null);
      setFormLoading(false);
      // Refresh services
      setLoading(true);
      databases
        .listDocuments(
          DATABASE_ID,
          "services_offered",
          [Query.equal("providerId", user.id)]
        )
        .then((res) => {
          setServices(res.documents);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } catch (err) {
      toast({ title: "Error", description: "Failed to update service." });
      setFormLoading(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deleteService) return;
    setDeleteLoading(true);
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        "services_offered",
        deleteService.$id
      );
      toast({ title: "Service deleted!", description: "The service has been removed." });
      setDeleteService(null);
      setDeleteLoading(false);
      // Refresh services
      setLoading(true);
      databases
        .listDocuments(
          DATABASE_ID,
          "services_offered",
          [Query.equal("providerId", user.id)]
        )
        .then((res) => {
          setServices(res.documents);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete service." });
      setDeleteLoading(false);
    }
  };

  // Compute filtered and sorted services
  const filteredServices = services
    .filter(s => (filterDevice !== "all" ? s.deviceType === filterDevice : true))
    .filter(s => (filterBrand !== "all" ? s.brand === filterBrand : true))
    .filter(s => (filterIssue !== "all" ? s.issue === filterIssue : true));

  const sortedServices = [...filteredServices].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (typeof aVal === "string" && typeof bVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    if (sortDir === "asc") {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  // Unique values for filters
  const deviceTypes = Array.from(new Set(services.map(s => s.deviceType)));
  const brandsList = Array.from(new Set(services.map(s => s.brand)));
  const issuesList = Array.from(new Set(services.map(s => s.issue)));

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [modalIssues, setModalIssues] = useState<any[]>([]);
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editModalIssues, setEditModalIssues] = useState<any[]>([]);

  // Fetch category and issues for Add Service modal
  useEffect(() => {
    if (!form.deviceType) return;
    setModalIssues([]);
    setSelectedCategoryId("");
    setForm(f => ({ ...f, issue: "" }));
    setFormLoading(true);
    databases
      .listDocuments(
        DATABASE_ID,
        COLLECTIONS.CATEGORIES,
        []
      )
      .then(res => {
        const category = res.documents.find((c: any) => c.name.toLowerCase() === form.deviceType);
        if (!category) {
          setModalIssues([]);
          setFormLoading(false);
          return;
        }
        setSelectedCategoryId(category.$id);
        databases
          .listDocuments(
            DATABASE_ID,
            COLLECTIONS.ISSUES,
            [Query.equal("category_id", category.$id)]
          )
          .then(res2 => {
            setModalIssues(res2.documents);
            setFormLoading(false);
          })
          .catch(() => setFormLoading(false));
      })
      .catch(() => setFormLoading(false));
  }, [form.deviceType]);

  // Fetch category and issues for Edit Service modal
  useEffect(() => {
    if (!editForm.deviceType) return;
    setEditModalIssues([]);
    setEditCategoryId("");
    setEditForm(f => ({ ...f, issue: "" }));
    setFormLoading(true);
    databases
      .listDocuments(
        DATABASE_ID,
        COLLECTIONS.CATEGORIES,
        []
      )
      .then(res => {
        const category = res.documents.find((c: any) => c.name.toLowerCase() === editForm.deviceType);
        if (!category) {
          setEditModalIssues([]);
          setFormLoading(false);
          return;
        }
        setEditCategoryId(category.$id);
        databases
          .listDocuments(
            DATABASE_ID,
            COLLECTIONS.ISSUES,
            [Query.equal("category_id", category.$id)]
          )
          .then(res2 => {
            setEditModalIssues(res2.documents);
            setFormLoading(false);
          })
          .catch(() => setFormLoading(false));
      })
      .catch(() => setFormLoading(false));
  }, [editForm.deviceType]);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <Card className="mb-6">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-2xl font-bold">My Services</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Select value={filterDevice} onValueChange={setFilterDevice}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Device Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  {deviceTypes.filter(dt => dt).map(dt => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Brand" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.filter(b => b).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterIssue} onValueChange={setFilterIssue}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Issue" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issues</SelectItem>
                  {issuesList.filter(i => i).map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
              {(filterDevice !== "all" || filterBrand !== "all" || filterIssue !== "all") && (
                <Button variant="outline" size="sm" onClick={() => { setFilterDevice("all"); setFilterBrand("all"); setFilterIssue("all"); }}>Reset Filters</Button>
              )}
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)}>Add New Service</Button>
        </CardHeader>
        <CardContent>
          {loading || authLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading services...</div>
          ) : error ? (
            <div className="py-10 text-center text-destructive">{error}</div>
          ) : sortedServices.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-4">
              <img src="/assets/undraw_access-account_aydp.svg" alt="No services" className="w-40 h-40 opacity-60" />
              <div className="text-muted-foreground">No services found. Click "Add New Service" to get started.</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table className="min-w-full">
                <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortBy("deviceType");
                      setSortDir(sortBy === "deviceType" && sortDir === "asc" ? "desc" : "asc");
                    }}>
                      Device Type {sortBy === "deviceType" && (sortDir === "asc" ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />)}
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortBy("brand");
                      setSortDir(sortBy === "brand" && sortDir === "asc" ? "desc" : "asc");
                    }}>
                      Brand {sortBy === "brand" && (sortDir === "asc" ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />)}
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortBy("model");
                      setSortDir(sortBy === "model" && sortDir === "asc" ? "desc" : "asc");
                    }}>
                      Model {sortBy === "model" && (sortDir === "asc" ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />)}
                    </TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Part Type</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortBy("price");
                      setSortDir(sortBy === "price" && sortDir === "asc" ? "desc" : "asc");
                    }}>
                      Price (₹) {sortBy === "price" && (sortDir === "asc" ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />)}
                    </TableHead>
                    <TableHead>Warranty</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedServices.map((service) => (
                    <TableRow key={service.$id} className="hover:bg-accent/40 transition-colors">
                      <TableCell>{service.deviceType}</TableCell>
                      <TableCell>{service.brand}</TableCell>
                      <TableCell>{service.model}</TableCell>
                      <TableCell>{issueIdToName[service.issue] || service.issue}</TableCell>
                      <TableCell>{service.partType}</TableCell>
                      <TableCell>₹{service.price?.toLocaleString()}</TableCell>
                      <TableCell>{service.warranty}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setEditService(service)}>Edit</Button>{" "}
                        <Button size="sm" variant="destructive" onClick={() => setDeleteService(service)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddService} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Device Type</label>
                <Select value={form.deviceType} onValueChange={v => handleFormChange("deviceType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select device type" /></SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map(dt => (
                      <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Brand</label>
                <Select value={form.brand} onValueChange={v => handleFormChange("brand", v)} disabled={!brands.length}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    {brands.filter(b => b).map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Model</label>
                <Select value={form.model} onValueChange={v => handleFormChange("model", v)} disabled={!models.length}>
                  <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                  <SelectContent>
                    {models.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Issue</label>
                <Select value={form.issue} onValueChange={v => handleFormChange("issue", v)} disabled={!modalIssues.length}>
                  <SelectTrigger><SelectValue placeholder="Select issue" /></SelectTrigger>
                  <SelectContent>
                    {modalIssues.map(i => (
                      <SelectItem key={i.$id} value={i.$id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Conditionally show Part Type and Warranty for screen replacement */}
              {getIssueType(form.issue) === 'screen' ? (
                <>
                  <div>
                    <label className="block mb-1 font-medium">Part Type</label>
                    <Select value={form.partType} onValueChange={v => handleFormChange("partType", v)}>
                      <SelectTrigger><SelectValue placeholder="Select part type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OEM">OEM</SelectItem>
                        <SelectItem value="HQ">HQ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Warranty</label>
                    <Input value={form.warranty} onChange={e => handleFormChange("warranty", e.target.value)} placeholder="e.g. 3 months, 6 months" required />
                  </div>
                </>
              ) : null}
              {/* Price field always shown */}
              <div className={getIssueType(form.issue) === 'screen' ? "col-span-2" : "col-span-2"}>
                <label className="block mb-1 font-medium">Price (₹)</label>
                <Input type="number" value={form.price} onChange={e => handleFormChange("price", e.target.value)} min={0} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={formLoading}>{formLoading ? "Adding..." : "Add Service"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit Service Modal */}
      <Dialog open={!!editService} onOpenChange={v => { if (!v) setEditService(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditService} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Device Type</label>
                <Select value={editForm.deviceType} onValueChange={v => handleEditFormChange("deviceType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select device type" /></SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map(dt => (
                      <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Brand</label>
                <Select value={editForm.brand} onValueChange={v => handleEditFormChange("brand", v)} disabled={!brands.length}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    {brands.filter(b => b).map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Model</label>
                <Select value={editForm.model} onValueChange={v => handleEditFormChange("model", v)} disabled={!models.length}>
                  <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                  <SelectContent>
                    {models.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Issue</label>
                <Select value={editForm.issue} onValueChange={v => handleEditFormChange("issue", v)} disabled={!editModalIssues.length}>
                  <SelectTrigger><SelectValue placeholder="Select issue" /></SelectTrigger>
                  <SelectContent>
                    {editModalIssues.map(i => (
                      <SelectItem key={i.$id} value={i.$id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Part Type</label>
                <Select value={editForm.partType} onValueChange={v => handleEditFormChange("partType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select part type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OEM">OEM</SelectItem>
                    <SelectItem value="HQ">HQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Price (₹)</label>
                <Input type="number" value={editForm.price} onChange={e => handleEditFormChange("price", e.target.value)} min={0} required />
              </div>
              <div className="col-span-2">
                <label className="block mb-1 font-medium">Warranty</label>
                <Input value={editForm.warranty} onChange={e => handleEditFormChange("warranty", e.target.value)} placeholder="e.g. 3 months, 6 months" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={formLoading}>{formLoading ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Service Confirmation Dialog */}
      <Dialog open={!!deleteService} onOpenChange={v => { if (!v) setDeleteService(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
          </DialogHeader>
          <div className="py-4">Are you sure you want to delete this service?</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteService(null)} disabled={deleteLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteService} disabled={deleteLoading}>{deleteLoading ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 