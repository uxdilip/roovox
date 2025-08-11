import React from "react";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, Plus, Copy } from "lucide-react";

interface ServicesQuickActionsProps {
  onCustomSeries: () => void;
  onAddService: () => void;
  // onPlatformSeries: () => void; // Temporarily hidden
}

export default function ServicesQuickActions({
  onCustomSeries,
  onAddService
}: ServicesQuickActionsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        <p className="text-sm text-gray-600">Get started with common tasks</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Platform Series temporarily hidden - will fix later */}
        {/* <Button 
          onClick={onPlatformSeries} 
          className="h-auto p-4 flex flex-col items-start gap-3 text-left bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Copy className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Platform Series</div>
              <div className="text-sm text-gray-600">Use & customize templates</div>
            </div>
          </div>
        </Button> */}

        <Button 
          onClick={onCustomSeries} 
          className="h-auto p-4 flex flex-col items-start gap-3 text-left bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Plus className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Custom Series</div>
              <div className="text-sm text-gray-600">Create your own series</div>
            </div>
          </div>
        </Button>

        <Button 
          onClick={onAddService} 
          className="h-auto p-4 flex flex-col items-start gap-3 text-left bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Plus className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Add Service</div>
              <div className="text-sm text-gray-600">Add individual service</div>
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
} 