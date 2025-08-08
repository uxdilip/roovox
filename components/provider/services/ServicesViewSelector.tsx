import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Package, Users } from "lucide-react";

export type ViewType = "all" | "series";

interface ServicesViewSelectorProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function ServicesViewSelector({
  currentView,
  onViewChange
}: ServicesViewSelectorProps) {
  const viewOptions = [
    {
      value: "all" as ViewType,
      label: "All Services",
      icon: Package,
      description: "View all individual services"
    },
    {
      value: "series" as ViewType,
      label: "By Series",
      icon: Users,
      description: "Grouped by device series"
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">View:</span>
        <Select value={currentView} onValueChange={(value: ViewType) => onViewChange(value)}>
          <SelectTrigger className="w-48 bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {viewOptions.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 