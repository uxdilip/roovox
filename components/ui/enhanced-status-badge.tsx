"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface EnhancedStatusBadgeProps {
  status: string;
  className?: string;
  showProgress?: boolean;
}

export const EnhancedStatusBadge = ({
  status,
  className,
  showProgress = false,
}: EnhancedStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          border: "border-yellow-200",
          progress: "bg-yellow-500",
          icon: "⏳",
        };
      case "confirmed":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          border: "border-blue-200",
          progress: "bg-blue-500",
          icon: "✅",
        };
      case "in_progress":
        return {
          bg: "bg-orange-100",
          text: "text-orange-800",
          border: "border-orange-200",
          progress: "bg-orange-500",
          icon: "🔧",
        };
      case "pending_cod_collection":
        return {
          bg: "bg-purple-100",
          text: "text-purple-800",
          border: "border-purple-200",
          progress: "bg-purple-500",
          icon: "💰",
        };
      case "completed":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-200",
          progress: "bg-green-500",
          icon: "🎉",
        };
      case "cancelled":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          border: "border-red-200",
          progress: "bg-red-500",
          icon: "❌",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-200",
          progress: "bg-gray-500",
          icon: "❓",
        };
    }
  };

  const config = getStatusConfig(status);
  const displayText = status === "pending_cod_collection" 
    ? "Service Completed - Pay on Delivery" 
    : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 hover:scale-105",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className="text-sm">{config.icon}</span>
      <span>{displayText}</span>
      
      {/* Progress indicator for pending statuses */}
      {showProgress && (status === "pending" || status === "in_progress") && (
        <motion.div
          className="ml-2 w-2 h-2 rounded-full bg-current opacity-60"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};
