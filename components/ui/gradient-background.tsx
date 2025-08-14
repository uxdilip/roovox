"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { ReactNode } from "react";

interface GradientBackgroundProps {
  children: ReactNode;
  className?: string;
}

export const GradientBackground = ({
  children,
  className,
}: GradientBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        className
      )}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
