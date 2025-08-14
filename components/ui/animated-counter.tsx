"use client";
import { useEffect, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { useRef } from "react";

interface AnimatedCounterProps {
  value: string;
  label: string;
  icon: React.ReactNode;
}

export const AnimatedCounter = ({ value, label, icon }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  // Extract numeric value from string (e.g., "50K+" -> 50)
  const numericValue = parseInt(value.replace(/[^\d]/g, '')) || 0;

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
      
      const timer = setInterval(() => {
        setCount((prevCount) => {
          const increment = Math.ceil(numericValue / 50);
          const nextCount = prevCount + increment;
          
          if (nextCount >= numericValue) {
            clearInterval(timer);
            return numericValue;
          }
          return nextCount;
        });
      }, 50);

      return () => clearInterval(timer);
    }
  }, [isInView, numericValue, controls]);

  const displayValue = value.includes('K') 
    ? `${count}K${value.includes('+') ? '+' : ''}` 
    : value.includes('/') 
    ? value 
    : `${count}${value.replace(/\d+/g, '')}`;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        className="flex justify-center mb-4"
      >
        <div className="p-4 rounded-full bg-slate-100 text-slate-600">
          {icon}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-3xl md:text-4xl font-bold text-slate-900 mb-2"
      >
        {displayValue}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="text-slate-600 text-sm md:text-base"
      >
        {label}
      </motion.div>
    </motion.div>
  );
};
