import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const logoVariants = cva('flex items-center', {
  variants: {
    variant: {
      full: 'space-x-3',
      icon: 'space-x-0',
      horizontal: 'space-x-2',
      word: 'space-x-0', // New word-only variant
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
    },
    textColor: {
      default: 'text-[#333333]',
      white: 'text-white',
      gradient: 'bg-gradient-to-r from-[#601d8a] to-[#8B5CF6] bg-clip-text text-transparent',
      primary: 'text-[#601d8a]', // New primary color variant
    },
    features: {
      none: '',
      stylistic: 'font-features-stylistic',
      all: 'font-features-all',
    },
  },
  defaultVariants: {
    variant: 'full',
    size: 'md',
    textColor: 'default',
    features: 'stylistic',
  },
});

export interface SniketLogoProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof logoVariants> {
  showWordmark?: boolean;
}

const SniketLogo = React.forwardRef<HTMLDivElement, SniketLogoProps>(
  ({ className, variant, size, textColor, features, showWordmark = true, ...props }, ref) => {
    const iconSizes = {
      sm: 16,
      md: 20,
      lg: 24,
      xl: 28,
      '2xl': 32,
      '3xl': 40,
      '4xl': 48,
    };

    const iconSize = iconSizes[size || 'md'];

    return (
      <div
        ref={ref}
        className={cn(logoVariants({ variant, size, textColor, features, className }))}
        {...props}
      >
        {/* Icon - only show if not word-only variant */}
        {variant !== 'word' && (
          <div className="relative">
            <div 
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: iconSize + 8,
                height: iconSize + 8,
                borderRadius: (iconSize + 8) / 4,
                background: '#601d8a',
                boxShadow: '0 4px 20px rgba(96, 29, 138, 0.3)'
              }}
            >
              <span 
                className="font-chillax font-medium text-white font-features-stylistic"
                style={{ fontSize: iconSize * 0.6 }}
              >
                S
              </span>
            </div>
          </div>
        )}

        {/* Wordmark */}
        {showWordmark && (
          <span className="font-chillax font-medium font-features-stylistic">
            Sniket
          </span>
        )}
      </div>
    );
  }
);
SniketLogo.displayName = 'SniketLogo';

// Specialized logo components
export const SniketLogoFull = React.forwardRef<HTMLDivElement, Omit<SniketLogoProps, 'variant'>>(
  (props, ref) => <SniketLogo {...props} variant="full" ref={ref} />
);

export const SniketLogoIcon = React.forwardRef<HTMLDivElement, Omit<SniketLogoProps, 'variant'>>(
  (props, ref) => <SniketLogo {...props} variant="icon" ref={ref} />
);

export const SniketLogoHorizontal = React.forwardRef<HTMLDivElement, Omit<SniketLogoProps, 'variant'>>(
  (props, ref) => <SniketLogo {...props} variant="horizontal" ref={ref} />
);

export const SniketLogoWord = React.forwardRef<HTMLDivElement, Omit<SniketLogoProps, 'variant'>>(
  (props, ref) => <SniketLogo {...props} variant="word" ref={ref} />
);

export { SniketLogo }; 