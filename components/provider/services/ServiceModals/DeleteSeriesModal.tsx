"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, Users, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  deleteCustomSeries,
  getCustomSeriesServices,
  deleteCustomSeriesService
} from "@/lib/appwrite-services";
import { databases, DATABASE_ID } from "@/lib/appwrite";
import { Query } from "appwrite";

interface DeleteSeriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  seriesId: string;
  seriesData: any;
  onSuccess: () => void;
}

export default function DeleteSeriesModal({
  open,
  onOpenChange,
  providerId,
  seriesId,
  seriesData,
  onSuccess
}: DeleteSeriesModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [affectedServices, setAffectedServices] = useState<any[]>([]);

  const isCustomSeries = seriesId.startsWith('custom_') || seriesData?.isCustom;

  // Load affected services when modal opens
  React.useEffect(() => {
    if (open && seriesId) {
      loadAffectedServices();
    }
  }, [open, seriesId]);

  const loadAffectedServices = async () => {
    try {
      let services;
      if (isCustomSeries) {
        // For custom series, get services from custom_series_services
        services = await getCustomSeriesServices(seriesId);
      } else {
        // For platform series, get services from services_offered
        const response = await databases.listDocuments(
          DATABASE_ID,
          'services_offered',
          [
            Query.equal('providerId', providerId),
            Query.equal('series_id', seriesId)
          ]
        );
        services = response.documents;
      }
      setAffectedServices(services);
    } catch (error) {
      console.error('Error loading affected services:', error);
    }
  };

  const handleDeleteSeries = async () => {
    setLoading(true);
    try {
      if (isCustomSeries) {
        // For custom series, delete services first, then the series
        const services = await getCustomSeriesServices(seriesId);
        
        // Delete all custom series services
        for (const service of services) {
          await deleteCustomSeriesService(service.$id);
        }
        
        // Delete the custom series
        await deleteCustomSeries(seriesId);
      } else {
        // For platform series, delete all services with this series_id
        const response = await databases.listDocuments(
          DATABASE_ID,
          'services_offered',
          [
            Query.equal('providerId', providerId),
            Query.equal('series_id', seriesId)
          ]
        );
        
        // Delete all services
        for (const service of response.documents) {
          await databases.deleteDocument(
            DATABASE_ID,
            'services_offered',
            service.$id
          );
        }
      }

      toast({
        title: "Success",
        description: `${seriesData.name} series has been deleted`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting series:', error);
      toast({
        title: "Error",
        description: "Failed to delete series. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!seriesData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Delete Series
          </DialogTitle>
          <p className="text-sm text-gray-600">
            This action cannot be undone. Please review what will be deleted.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Series Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {isCustomSeries ? (
                  <Tag className="h-5 w-5 text-orange-600" />
                ) : (
                  <Users className="h-5 w-5 text-blue-600" />
                )}
                {seriesData.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Type</p>
                  <Badge variant={isCustomSeries ? "outline" : "secondary"}>
                    {isCustomSeries ? "Custom Series" : "Platform Series"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Services</p>
                  <p className="text-sm text-gray-900">{affectedServices.length} services</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-600">Models</p>
                  <p className="text-sm text-gray-900">
                    {isCustomSeries && seriesData.models 
                      ? seriesData.models.map((m: string) => {
                          const [brand, model] = m.split(':');
                          return `${brand} ${model}`;
                        }).join(', ')
                      : seriesData.models?.join(', ') || 'No models'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Warning</h4>
                <p className="text-sm text-red-700 mt-1">
                  Deleting this series will permanently remove:
                </p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                  <li>All {affectedServices.length} services in this series</li>
                  <li>All pricing information for these services</li>
                  <li>The series configuration itself</li>
                </ul>
                <p className="text-sm text-red-700 mt-2 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Affected Services Preview */}
          {affectedServices.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Services that will be deleted:</h4>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {affectedServices.slice(0, 5).map((service, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <span>{service.issue}</span>
                    <span className="text-gray-600">₹{service.price}</span>
                  </div>
                ))}
                {affectedServices.length > 5 && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    ... and {affectedServices.length - 5} more services
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteSeries}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Series
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 