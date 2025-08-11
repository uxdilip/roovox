"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Smartphone, Laptop, Database, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DataExportPage() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async (type: 'phones' | 'laptops' | 'all') => {
    setIsExporting(type);
    
    try {
      const response = await fetch(`/api/export-devices?type=${type}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${type}_export.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `${type === 'all' ? 'All devices' : type} have been exported to CSV.`,
        // icon property not supported in this toast implementation
      });
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive",
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsExporting(null);
    }
  };

  const exportOptions = [
    {
      id: 'phones',
      title: 'Export Phones',
      description: 'Download all phone models and specifications',
      icon: Smartphone,
      color: 'bg-blue-500',
      buttonText: 'Download Phones CSV'
    },
    {
      id: 'laptops',
      title: 'Export Laptops',
      description: 'Download all laptop models and specifications',
      icon: Laptop,
      color: 'bg-green-500',
      buttonText: 'Download Laptops CSV'
    },
    {
      id: 'all',
      title: 'Export All Devices',
      description: 'Download both phones and laptops in a single file',
      icon: Database,
      color: 'bg-purple-500',
      buttonText: 'Download All Devices CSV'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Export</h1>
          <p className="text-gray-600 mt-2">
            Export your device collections to CSV format for backup or analysis
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <FileText className="h-4 w-4 mr-2" />
          CSV Export
        </Badge>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportOptions.map((option) => (
          <Card key={option.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${option.color} text-white`}>
                  <option.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleExport(option.id as 'phones' | 'laptops' | 'all')}
                disabled={isExporting !== null}
                className="w-full"
                size="lg"
              >
                {isExporting === option.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {option.buttonText}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Information Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Export Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>CSV Format:</strong> All exports are in standard CSV format compatible with Excel, Google Sheets, and other spreadsheet applications.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>Data Included:</strong> All device information including brand, model, specifications, and metadata will be included in the export.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">
                <strong>Large Datasets:</strong> For large collections, the export may take a few moments to complete. Please be patient during the download.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 