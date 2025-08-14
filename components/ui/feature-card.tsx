"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

export const FeatureCard = ({ icon, title, description, index }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
        delay: index * 0.1,
      }}
      viewport={{ once: true }}
      className="text-center group"
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex justify-center mb-6"
      >
        <div className="p-4 rounded-full bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
      </motion.div>
      <motion.h3
        whileHover={{ scale: 1.02 }}
        className="text-xl font-semibold mb-3 text-slate-900"
      >
        {title}
      </motion.h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};
