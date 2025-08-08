import React from "react";
import { Package, Users, TrendingUp } from "lucide-react";

interface ServicesStatsProps {
  totalServices: number;
  activeSeries: number;
  revenuePotential: number;
}

export default function ServicesStats({ 
  totalServices, 
  activeSeries, 
  revenuePotential 
}: ServicesStatsProps) {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Services</p>
              <p className="text-2xl font-semibold text-gray-900">{totalServices}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Series</p>
              <p className="text-2xl font-semibold text-gray-900">{activeSeries}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Revenue Potential</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₹{revenuePotential.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 