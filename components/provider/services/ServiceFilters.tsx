import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X } from "lucide-react";

interface ServiceFiltersProps {
  filterDevice: string;
  filterBrand: string;
  filterIssue: string;
  deviceTypes: string[];
  brands: string[];
  issues: string[];
  onFilterChange: (type: "device" | "brand" | "issue", value: string) => void;
  onClearFilters: () => void;
}

export default function ServiceFilters({
  filterDevice,
  filterBrand,
  filterIssue,
  deviceTypes,
  brands,
  issues,
  onFilterChange,
  onClearFilters
}: ServiceFiltersProps) {
  const hasActiveFilters = filterDevice !== "all" || filterBrand !== "all" || filterIssue !== "all";

  return (
    <div className="flex items-center gap-3">
      <Select value={filterDevice} onValueChange={(value) => onFilterChange("device", value)}>
        <SelectTrigger className="w-40 bg-white border-gray-200">
          <SelectValue placeholder="Device Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Devices</SelectItem>
          {deviceTypes.filter(dt => dt).map(dt => (
            <SelectItem key={dt} value={dt}>{dt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={filterBrand} onValueChange={(value) => onFilterChange("brand", value)}>
        <SelectTrigger className="w-40 bg-white border-gray-200">
          <SelectValue placeholder="Brand" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Brands</SelectItem>
          {brands.filter(b => b).map(b => (
            <SelectItem key={b} value={b}>{b}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={filterIssue} onValueChange={(value) => onFilterChange("issue", value)}>
        <SelectTrigger className="w-48 bg-white border-gray-200">
          <SelectValue placeholder="Issue" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Issues</SelectItem>
          {issues.filter(i => i).map(i => (
            <SelectItem key={i} value={i}>{i}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearFilters}
          className="text-gray-600 hover:text-gray-900"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
} 