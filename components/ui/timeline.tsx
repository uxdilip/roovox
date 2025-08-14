"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  return (
    <div className="w-full">
      {data.map((item, index) => (
        <div key={index} className="flex justify-start pt-10 md:pt-20 md:gap-10">
          <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
            <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-slate-900 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-slate-300 border border-slate-700 p-2" />
            </div>
            <h3 className="hidden md:block text-xl md:pl-20 md:text-2xl font-bold text-slate-900">
              {item.title}
            </h3>
          </div>

          <div className="relative pl-20 pr-4 md:pl-4 w-full">
            <h3 className="md:hidden block text-xl mb-4 text-left font-bold text-slate-900">
              {item.title}
            </h3>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: index * 0.1,
              }}
              viewport={{ once: true }}
              className="text-slate-600 text-sm md:text-base leading-relaxed"
            >
              {item.content}
            </motion.div>
          </div>
        </div>
      ))}

    </div>
  );
};
