"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

export const FAQAccordion = ({ 
  items, 
  className 
}: { 
  items: FAQItem[];
  className?: string;
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: index * 0.1,
            ease: "easeOut",
          }}
          viewport={{ once: true }}
          className="border-b border-slate-200 last:border-b-0"
        >
          <button
            onClick={() => toggleItem(index)}
            className="w-full py-6 px-4 text-left flex justify-between items-center hover:bg-slate-50 transition-colors duration-200 group"
          >
            <span className="text-lg font-semibold text-slate-900 pr-4 group-hover:text-slate-700 transition-colors">
              {item.question}
            </span>
            <div className="flex-shrink-0">
              {openIndex === index ? (
                <Minus className="h-5 w-5 text-slate-600 transition-transform duration-200" />
              ) : (
                <Plus className="h-5 w-5 text-slate-600 transition-transform duration-200" />
              )}
            </div>
          </button>
          
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-6 text-slate-600 leading-relaxed">
                  {item.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};
