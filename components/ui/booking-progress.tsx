"use client";
import { motion } from "framer-motion";
import React from "react";

interface BookingProgressProps {
  status: string;
  estimatedTime?: string;
  className?: string;
}

export const BookingProgress = ({
  status,
  estimatedTime,
  className,
}: BookingProgressProps) => {
  const getProgressConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return {
          step: 1,
          total: 4,
          label: "Booking Confirmed",
          color: "bg-yellow-500",
          nextStep: "Provider will confirm your booking",
        };
      case "confirmed":
        return {
          step: 2,
          total: 4,
          label: "Provider Confirmed",
          color: "bg-blue-500",
          nextStep: "Provider will start the repair",
        };
      case "in_progress":
        return {
          step: 3,
          total: 4,
          label: "Repair in Progress",
          color: "bg-orange-500",
          nextStep: "Repair will be completed soon",
        };
      case "pending_cod_collection":
        return {
          step: 4,
          total: 4,
          label: "Service Completed",
          color: "bg-purple-500",
          nextStep: "Pay on delivery to complete",
        };
      case "completed":
        return {
          step: 4,
          total: 4,
          label: "All Done!",
          color: "bg-green-500",
          nextStep: "Your device is ready",
        };
      case "cancelled":
        return {
          step: 0,
          total: 4,
          label: "Booking Cancelled",
          color: "bg-red-500",
          nextStep: "Booking has been cancelled",
        };
      default:
        return {
          step: 0,
          total: 4,
          label: "Unknown Status",
          color: "bg-gray-500",
          nextStep: "Status unknown",
        };
    }
  };

  const config = getProgressConfig(status);
  const progressPercentage = (config.step / config.total) * 100;

  if (status === "cancelled") {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-red-800">
          <span className="text-sm font-medium">❌ {config.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {config.label} ({config.step}/{config.total})
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${config.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Next Step */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">Next:</span> {config.nextStep}
      </div>

      {/* Estimated Time */}
      {estimatedTime && status !== "completed" && (
        <div className="mt-2 text-sm text-gray-500">
          <span className="font-medium">Estimated completion:</span> {estimatedTime}
        </div>
      )}
    </div>
  );
};
