"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { databases, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { getModelSeries, getCustomSeriesByProvider, getCustomSeriesServices } from "@/lib/appwrite-services";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Import our new components

import ServicesQuickActions from "./ServicesQuickActions";
import ServiceFilters from "./ServiceFilters";
import SeriesView from "./SeriesView";
import PlatformSeriesSelector from './PlatformSeriesSelector';

// Import modals
import AddServiceModal from "./ServiceModals/AddServiceModal";
import EditIndividualServiceModal from "./ServiceModals/EditIndividualServiceModal";
import SeriesBulkUpdateModal from "./ServiceModals/SeriesBulkUpdateModal";
import EditSeriesModal from "./ServiceModals/EditSeriesModal";
import CustomSeriesModal from "./ServiceModals/CustomSeriesModal";
import DeleteSeriesModal from "./ServiceModals/DeleteSeriesModal";

export default function ServicesDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [seriesData, setSeriesData] = useState<Record<string, any>>({});
  const [issueIdToName, setIssueIdToName] = useState<Record<string, string>>({});
  const [allIssues, setAllIssues] = useState<any[]>([]);

  // Filter state
  const [filterDevice, setFilterDevice] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [filterIssue, setFilterIssue] = useState<string>("all");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditIndividualServiceModal, setShowEditIndividualServiceModal] = useState(false);
  const [showPlatformSeriesModal, setShowPlatformSeriesModal] = useState(false);
  const [showSeriesBulkUpdateModal, setShowSeriesBulkUpdateModal] = useState(false);
  const [showEditSeriesModal, setShowEditSeriesModal] = useState(false);
  const [showCustomSeriesModal, setShowCustomSeriesModal] = useState(false);
  const [showDeleteSeriesModal, setShowDeleteSeriesModal] = useState(false);
  
  // Selected service states
  const [selectedIndividualService, setSelectedIndividualService] = useState<any>(null);
  const [selectedSeriesForBulk, setSelectedSeriesForBulk] = useState<string>("");
  const [selectedSeriesForEdit, setSelectedSeriesForEdit] = useState<string>("");
  const [selectedSeriesForDelete, setSelectedSeriesForDelete] = useState<string>("");



  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
          <p className="text-gray-600">Please wait while we authenticate you</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Fetch all data in parallel for instant loading
  useEffect(() => {
    if (!user || authLoading) return;
    
    setLoading(true);
    setError("");
    
    const fetchAllData = async () => {
      try {
        // Fetch all data in parallel for maximum speed
        const [
          regularServicesRes,
          allSeries,
          customSeries,
          issuesRes
        ] = await Promise.all([
          // Regular services
          databases.listDocuments(
            DATABASE_ID,
            "services_offered",
            [Query.equal("providerId", user.id)]
          ),
          // Platform series
          getModelSeries(),
          // Custom series
          getCustomSeriesByProvider(user.id),
          // Issues (with higher limit to avoid pagination)
          databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ISSUES,
            [Query.limit(1000)]
          )
        ]);
        
        // Process series data
        const seriesMap: Record<string, any> = {};
        allSeries.forEach(series => {
          seriesMap[series.$id] = series;
        });
        
        customSeries.forEach(series => {
          seriesMap[series.$id] = {
            ...series,
            name: series.name,
            models: series.models || [],
            isCustom: true
          };
        });
        
        // Process issues data
        setAllIssues(issuesRes.documents);
        const issueMap: Record<string, string> = {};
        issuesRes.documents.forEach((issue: any) => {
          issueMap[issue.$id] = issue.name;
        });
        
        // Fetch custom series services in parallel
        const customSeriesServicesPromises = customSeries.map(async (series) => {
          const seriesServices = await getCustomSeriesServices(series.$id);
          return seriesServices.map(service => ({
            ...service,
            $id: service.$id,
            providerId: service.providerId,
            deviceType: series.deviceType,
            brand: 'Custom Series',
            model: 'Custom Series',
            issue: service.issue,
            price: service.price,
            partType: service.partType,
            warranty: service.warranty,
            created_at: service.created_at,
            custom_series_id: series.$id,
            series_name: series.name
          }));
        });
        
        const customSeriesServicesArrays = await Promise.all(customSeriesServicesPromises);
        const customSeriesServices = customSeriesServicesArrays.flat();
        
        // Combine all services
        const allServices = [...regularServicesRes.documents, ...customSeriesServices];
        
        // Set all state at once
        setServices(allServices);
        setSeriesData(seriesMap);
        setIssueIdToName(issueMap);
        setLoading(false);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError("Failed to load services");
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [user, authLoading]);

  // Compute filtered and sorted services
  const filteredServices = services
    .filter(s => (filterDevice !== "all" ? s.deviceType === filterDevice : true))
    .filter(s => (filterBrand !== "all" ? s.brand === filterBrand : true))
    .filter(s => (filterIssue !== "all" ? s.issue === filterIssue : true));

  const sortedServices = [...filteredServices].sort((a, b) => {
    return a.created_at > b.created_at ? -1 : 1;
  });
  
  // Unique values for filters
  const deviceTypes = Array.from(new Set(services.map(s => s.deviceType)));
  const brandsList = Array.from(new Set(services.map(s => s.brand)));
  const issuesList = Array.from(new Set(services.map(s => s.issue)));



  // Event handlers
  const handleFilterChange = (type: "device" | "brand" | "issue", value: string) => {
    switch (type) {
      case "device":
        setFilterDevice(value);
        break;
      case "brand":
        setFilterBrand(value);
        break;
      case "issue":
        setFilterIssue(value);
        break;
    }
  };

  const handleClearFilters = () => {
    setFilterDevice("all");
    setFilterBrand("all");
    setFilterIssue("all");
  };



  const handleBulkUpdate = (seriesId: string) => {
    setSelectedSeriesForBulk(seriesId);
    setShowSeriesBulkUpdateModal(true);
  };

  const handleEditSeries = (seriesId: string) => {
    setSelectedSeriesForEdit(seriesId);
    setShowEditSeriesModal(true);
  };

  const handleDeleteSeries = (seriesId: string) => {
    setSelectedSeriesForDelete(seriesId);
    setShowDeleteSeriesModal(true);
  };

  const handleEditIndividualService = (service: any) => {
    setSelectedIndividualService(service);
    setShowEditIndividualServiceModal(true);
  };

  const handleDeleteIndividualService = async (service: any) => {
    if (confirm(`Are you sure you want to delete the ${service.issue} service for ${service.brand} ${service.model}?`)) {
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          "services_offered",
          service.$id
        );
        toast({ title: "Success", description: "Service deleted successfully!" });
        handleServiceUpdate(); // Refresh the services
      } catch (error) {
        console.error('Error deleting service:', error);
        toast({ title: "Error", description: "Failed to delete service. Please try again.", variant: "destructive" });
      }
    }
  };

  const handleServiceUpdate = () => {
    // Refresh services and series data after any update
    setRefreshing(true);
    
    const refreshData = async () => {
      try {
        // Refresh regular services
        const regularServicesRes = await databases.listDocuments(
          DATABASE_ID,
          "services_offered",
          [Query.equal("providerId", user.id)]
        );
        
        // Refresh series data (both platform and custom)
        const allSeries = await getModelSeries();
        const seriesMap: Record<string, any> = {};
        allSeries.forEach(series => {
          seriesMap[series.$id] = series;
        });

        // Refresh custom series
        if (user) {
          const customSeries = await getCustomSeriesByProvider(user.id);
          customSeries.forEach(series => {
            seriesMap[series.$id] = {
              ...series,
              name: series.name,
              models: series.models || [],
              isCustom: true
            };
          });
        }

        // Refresh custom series services
        const customSeries = await getCustomSeriesByProvider(user.id);
        const customSeriesServices: any[] = [];
        for (const series of customSeries) {
          const seriesServices = await getCustomSeriesServices(series.$id);
          const transformedServices = seriesServices.map(service => ({
            ...service,
            $id: service.$id,
            providerId: service.providerId,
            deviceType: series.deviceType,
            brand: 'Custom Series',
            model: 'Custom Series',
            issue: service.issue,
            price: service.price,
            partType: service.partType,
            warranty: service.warranty,
            created_at: service.created_at,
            custom_series_id: series.$id,
            series_name: series.name
          }));
          customSeriesServices.push(...transformedServices);
        }
        
        // Combine regular and custom series services
        const allServices = [...regularServicesRes.documents, ...customSeriesServices];
        
        setServices(allServices);
        setSeriesData(seriesMap);
        setRefreshing(false);
        toast({ title: "Success", description: "Services updated successfully!" });
      } catch (error) {
        console.error('Error refreshing data:', error);
        setRefreshing(false);
        toast({ 
          title: "Error", 
          description: "Failed to refresh data", 
          variant: "destructive" 
        });
      }
    };
    
    refreshData();
  };



  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Services</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your service offerings and pricing structure
              </p>
            </div>
          </div>
        </div>



        {/* Quick Actions */}
        <ServicesQuickActions
          onCustomSeries={() => setShowCustomSeriesModal(true)}
          onAddService={() => setShowAddModal(true)}
          onPlatformSeries={() => setShowPlatformSeriesModal(true)}
        />

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              <p className="text-sm text-gray-600">Filter your services</p>
            </div>
          </div>
          <ServiceFilters
            filterDevice={filterDevice}
            filterBrand={filterBrand}
            filterIssue={filterIssue}
            deviceTypes={deviceTypes}
            brands={brandsList}
            issues={issuesList}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Main Content - Always Series View */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading services...</h3>
              <p className="text-gray-600">Please wait while we fetch your data</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading services</h3>
              <p className="text-gray-600">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <SeriesView
              services={sortedServices}
              issueMap={issueIdToName}
              seriesData={seriesData}
              refreshing={refreshing}
              onBulkUpdate={handleBulkUpdate}
              onEditSeries={handleEditSeries}
              onDeleteSeries={handleDeleteSeries}
              onEditIndividualService={handleEditIndividualService}
              onDeleteIndividualService={handleDeleteIndividualService}
            />
          )}
        </div>

        {/* Modals */}
        <AddServiceModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          providerId={user.id}
          onSuccess={handleServiceUpdate}
        />

        <EditIndividualServiceModal
          open={showEditIndividualServiceModal}
          onOpenChange={setShowEditIndividualServiceModal}
          service={selectedIndividualService}
          onSuccess={handleServiceUpdate}
        />



        <SeriesBulkUpdateModal
          open={showSeriesBulkUpdateModal}
          onOpenChange={setShowSeriesBulkUpdateModal}
          providerId={user.id}
          seriesId={selectedSeriesForBulk}
          seriesData={seriesData[selectedSeriesForBulk]}
          onSuccess={handleServiceUpdate}
        />

        <EditSeriesModal
          open={showEditSeriesModal}
          onOpenChange={setShowEditSeriesModal}
          seriesData={seriesData[selectedSeriesForEdit]}
          onSuccess={handleServiceUpdate}
        />

        <CustomSeriesModal
          open={showCustomSeriesModal}
          onOpenChange={setShowCustomSeriesModal}
          providerId={user.id}
          onSuccess={handleServiceUpdate}
        />

        <DeleteSeriesModal
          open={showDeleteSeriesModal}
          onOpenChange={setShowDeleteSeriesModal}
          providerId={user.id}
          seriesId={selectedSeriesForDelete}
          seriesData={seriesData[selectedSeriesForDelete]}
          onSuccess={handleServiceUpdate}
        />

        {/* Platform Series Modal */}
        {showPlatformSeriesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Platform Series Templates</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlatformSeriesModal(false)}
                  className="text-gray-700"
                >
                  ✕
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <PlatformSeriesSelector
                  deviceType="phone"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 