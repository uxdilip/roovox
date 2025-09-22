"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode, useState, useEffect } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Mobile fallback - simple gradient background
  if (isMobile) {
    return (
      <div
        className={cn(
          "relative flex h-[100vh] flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 text-slate-950",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-[100vh] flex-col items-center justify-center bg-white text-slate-950 transition-bg",
        className,
      )}
      {...props}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={
          {
            "--aurora":
              "repeating-linear-gradient(100deg,#6366f1_10%,#8b5cf6_15%,#a78bfa_20%,#c4b5fd_25%,#7c3aed_30%)",
            "--white-gradient":
              "repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)",
            "--indigo-500": "#6366f1",
            "--purple-500": "#8b5cf6", 
            "--purple-400": "#a78bfa",
            "--purple-300": "#c4b5fd",
            "--purple-600": "#7c3aed",
            "--white": "#fff",
            "--transparent": "transparent",
          } as React.CSSProperties
        }
      >
        <div
          className={cn(
            `after:animate-aurora pointer-events-none absolute -inset-[10px] [background-image:var(--white-gradient),var(--aurora)] [background-size:200%,_150%] [background-position:50%_50%,50%_50%] opacity-25 blur-[6px] invert filter will-change-auto transform-gpu [--aurora:repeating-linear-gradient(100deg,var(--indigo-500)_10%,var(--purple-500)_15%,var(--purple-400)_20%,var(--purple-300)_25%,var(--purple-600)_30%)] [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] after:[background-size:150%,_100%] after:[background-attachment:fixed] after:mix-blend-difference after:content-[""]`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`,
          )}
        ></div>
      </div>
      {children}
    </div>
  );
};
