"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
      }}
      viewport={{ once: true }}
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input bg-white border border-slate-200 p-4 hover:border-slate-300 flex flex-col space-y-4",
        className,
      )}
    >
      {header && (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          {header}
        </div>
      )}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon && (
          <div className="mb-2 mt-2">
            {icon}
          </div>
        )}
        <div className="font-bold text-slate-900 mb-2 mt-2">
          {title}
        </div>
        <div className="font-normal text-slate-600 text-sm leading-relaxed">
          {description}
        </div>
      </div>
    </motion.div>
  );
};
