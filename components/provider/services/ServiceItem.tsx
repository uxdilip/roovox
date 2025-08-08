import React from "react";
import { Badge } from "@/components/ui/badge";

interface ServiceItemProps {
  service: any;
  issueMap: Record<string, string>;
}

export default function ServiceItem({ 
  service, 
  issueMap
}: ServiceItemProps) {
  return (
    <div className="flex items-center justify-between text-sm py-1 min-h-[32px]">
      <div className="flex items-center gap-2 flex-1">
        <span className="text-blue-600 font-bold">•</span>
        <span className="font-medium text-gray-800">
          {issueMap[service.issue] || service.issue}
        </span>
        <span className="text-gray-500">:</span>
        <span className="font-semibold text-green-600">₹{service.price?.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1 ml-2">
        {service.partType && (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            {service.partType}
          </Badge>
        )}
        {service.warranty && (
          <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
            {service.warranty}
          </Badge>
        )}
      </div>
    </div>
  );
} 