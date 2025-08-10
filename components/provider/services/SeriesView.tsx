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
  onBulkUpdate: (seriesId: string) => void;
  onEditSeries: (seriesId: string) => void;
  onDeleteSeries: (seriesId: string) => void;
}

export default function SeriesView({
  services,
  issueMap,
  seriesData,
  onBulkUpdate,
  onEditSeries,
  onDeleteSeries
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
                  {modelInfo} • {services.length} services
                </p>
              </div>
            </div>
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
    }

    if (!seriesInfo) {
      return null;
    }

    // Get model names for display
    let modelInfo = "";
    if (isCustomSeries && seriesInfo.models && seriesInfo.models.length > 0) {
      // For custom series, models are stored as "brand:model" strings
      const modelNames = seriesInfo.models.map((modelString: string) => {
        const [brand, model] = modelString.split(':');
        return `${brand} ${model}`;
      }).join(', ');
      modelInfo = modelNames;
    } else if (seriesInfo.models && seriesInfo.models.length > 0) {
      // For platform series, show the model names
      modelInfo = seriesInfo.models.join(', ');
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
                {modelInfo} • {services.length} services
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