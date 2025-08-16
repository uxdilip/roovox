import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, BarChart3, Users, Tag, MoreHorizontal, Trash2 } from "lucide-react";
import ServiceItem from "./ServiceItem";

interface SeriesViewProps {
  services: any[];
  issueMap: Record<string, string>;
  seriesData: Record<string, any>;
  refreshing?: boolean;
  onBulkUpdate: (seriesId: string) => void;
  onEditSeries: (seriesId: string) => void;
  onDeleteSeries: (seriesId: string) => void;
  onEditIndividualService?: (service: any) => void;
  onDeleteIndividualService?: (service: any) => void;
}

export default function SeriesView({
  services,
  issueMap,
  seriesData,
  refreshing = false,
  onBulkUpdate,
  onEditSeries,
  onDeleteSeries,
  onEditIndividualService,
  onDeleteIndividualService
}: SeriesViewProps) {
  // Group services by series
  const seriesGroups: Record<string, any[]> = {};
  
  services.forEach(service => {
    // Handle both platform series and custom series
    let seriesId = 'individual';
    
    if (service.series_id) {
      seriesId = service.series_id;
    } else if (service.custom_series_id) {
      seriesId = service.custom_series_id;
    }
    
    if (!seriesGroups[seriesId]) {
      seriesGroups[seriesId] = [];
    }
    seriesGroups[seriesId].push(service);
  });



  const renderSeriesGroup = (seriesId: string, services: any[]) => {
    const isCustomSeries = seriesId.startsWith('custom_') || seriesData[seriesId]?.isCustom;
    const seriesInfo = seriesData[seriesId];
    
    if (seriesId === 'individual') {
      // Get unique model names for individual services
      const uniqueModels = Array.from(new Set(services.map(service => `${service.brand} ${service.model}`)));
      const modelInfo = uniqueModels.join(', ');
      
      return (
        <div key={seriesId} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Tag className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Individual Services</h3>
                <p className="text-sm text-gray-600">
                  {modelInfo || "No models"} • {services.length} services
                </p>
              </div>
            </div>
          </div>
          
          {/* Individual Services Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Device</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Issue</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Part Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Warranty</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, index) => (
                  <tr key={service.$id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{service.brand}</span>
                        <span className="text-sm text-gray-600">{service.model}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800">
                        {issueMap[service.issue] || service.issue}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-green-600">₹{service.price?.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4">
                      {service.partType ? (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {service.partType}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {service.warranty ? (
                        <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                          {service.warranty}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={() => onEditIndividualService?.(service)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => onDeleteIndividualService?.(service)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (!seriesInfo) {
      return null;
    }

    // Get model names for display
    let modelInfo = "";
    if (seriesInfo.models && seriesInfo.models.length > 0) {
      if (isCustomSeries) {
        // For custom series, models are stored as "brand:model" strings
        const modelNames = seriesInfo.models.map((modelString: string) => {
          if (modelString.includes(':')) {
            // Old format: "Brand:Model"
            const [brand, model] = modelString.split(':');
            return `${brand} ${model}`;
          } else {
            // New format: just "Model" (Platform Series)
            return modelString;
          }
        }).join(', ');
        modelInfo = modelNames;
      } else {
        // For platform series, show the model names directly
        modelInfo = seriesInfo.models.join(', ');
      }
    } else {
      modelInfo = "No models";
    }

    return (
      <div key={seriesId} className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              {isCustomSeries ? (
                <Tag className="h-5 w-5 text-orange-600" />
              ) : (
                <Users className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {seriesInfo.name}
                </h3>
                {isCustomSeries ? (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    Custom
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Platform
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {modelInfo || "No models"} • {services.length} services
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onBulkUpdate(seriesId)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Update Pricing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditSeries(seriesId)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Series
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDeleteSeries(seriesId)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Series
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-2">
          {services.map(service => (
            <ServiceItem
              key={service.$id}
              service={service}
              issueMap={issueMap}
            />
          ))}
        </div>
      </div>
    );
  };

  // Show loading overlay when refreshing
  if (refreshing) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {/* Render the actual content but dimmed */}
          {Object.entries(seriesGroups).map(([seriesId, services]) => 
            renderSeriesGroup(seriesId, services)
          )}
        </div>
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Updating Services...</h3>
            <p className="text-gray-600">Please wait while we refresh your data</p>
          </div>
        </div>
      </div>
    );
  }

  if (Object.keys(seriesGroups).length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Users className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No series found</h3>
        <p className="text-gray-600">Create series to group your services</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(seriesGroups).map(([seriesId, services]) => 
        renderSeriesGroup(seriesId, services)
      )}
    </div>
  );
} 