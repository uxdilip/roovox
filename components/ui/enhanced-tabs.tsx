"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { ReactNode, useState } from "react";

interface EnhancedTabsProps {
  tabs: {
    value: string;
    label: string;
    count?: number;
    content: ReactNode;
  }[];
  defaultValue?: string;
  className?: string;
  onTabChange?: (value: string) => void;
}

export const EnhancedTabs = ({
  tabs,
  defaultValue,
  className,
  onTabChange,
}: EnhancedTabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Enhanced Tabs List */}
      <div className="relative border-b border-gray-200">
        <div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "relative py-4 sm:py-6 px-3 sm:px-4 text-sm sm:text-base font-medium transition-colors duration-200 whitespace-nowrap",
                activeTab === tab.value
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <motion.span
                    key={tab.count}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-full bg-gray-100 text-gray-600"
                  >
                    {tab.count}
                  </motion.span>
                )}
              </div>
              
              {/* Animated underline */}
              {activeTab === tab.value && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {tabs.map((tab) => (
          <motion.div
            key={tab.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: activeTab === tab.value ? 1 : 0,
              y: activeTab === tab.value ? 0 : 10,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={activeTab === tab.value ? "block" : "hidden"}
          >
            {tab.content}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
