import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import ServiceItem from "./ServiceItem";

interface GroupedServiceRow {
  deviceType: string;
  brand: string;
  model: string;
  services: any[];
  serviceCount: number;
}

interface ServicesTableProps {
  groupedServices: GroupedServiceRow[];
  issueMap: Record<string, string>;
  seriesData: Record<string, any>;
  onEditService: (service: any) => void;
  onDeleteService: (service: any) => void;
  onAddService: () => void;
  loading: boolean;
  error: string;
}

export default function ServicesTable({
  groupedServices,
  issueMap,
  seriesData,
  onEditService,
  onDeleteService,
  onAddService,
  loading,
  error
}: ServicesTableProps) {
  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="text-gray-500">Loading services...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (groupedServices.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Plus className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
        <p className="text-gray-600 mb-4">Get started by adding your first service</p>
        <Button onClick={onAddService}>
          Add Your First Service
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-medium text-gray-700">Device</TableHead>
            <TableHead className="font-medium text-gray-700">Brand</TableHead>
            <TableHead className="font-medium text-gray-700">Model</TableHead>
            <TableHead className="font-medium text-gray-700">Services</TableHead>
            <TableHead className="font-medium text-gray-700 w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedServices.map((group) => (
            group.services.map((service, index) => (
              <TableRow key={`${service.$id}-${index}`} className="hover:bg-gray-50/50">
                {index === 0 ? (
                  <>
                    <TableCell className="font-medium text-gray-900" rowSpan={group.services.length}>
                      {group.deviceType}
                    </TableCell>
                    <TableCell className="text-gray-700" rowSpan={group.services.length}>
                      {group.brand}
                    </TableCell>
                    <TableCell className="text-gray-700" rowSpan={group.services.length}>
                      {group.model ? (
                        group.model
                      ) : (
                        group.services[0]?.series_id && seriesData[group.services[0].series_id] ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {seriesData[group.services[0].series_id].name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {seriesData[group.services[0].series_id].models.length} models
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Series</span>
                        )
                      )}
                    </TableCell>
                  </>
                ) : null}
                <TableCell className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {issueMap[service.issue] || service.issue}
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{service.price?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {service.partType && (
                        <Badge variant="secondary" className="text-xs">
                          {service.partType}
                        </Badge>
                      )}
                      {service.warranty && (
                        <Badge variant="outline" className="text-xs">
                          {service.warranty}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onEditService(service)}
                      className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onDeleteService(service)}
                      className="h-8 w-8 p-0 text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 