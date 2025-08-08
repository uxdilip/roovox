import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  href?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'footer';
}

export function Logo({ 
  className, 
  href = '/', 
  showText = true, 
  size = 'md',
  variant = 'default'
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const LogoContent = () => (
    <div className={cn('flex items-center', className)}>
      {/* Logo Text */}
      {showText && (
        <span className={cn(
          'font-chillax font-medium ',
          textSizes[size],
          variant === 'footer' 
            ? 'text-white' 
            : 'text-brand'
        )}>
          Sniket
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
} 