import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const opentypeVariants = cva('font-chillax', {
  variants: {
    features: {
      ligatures: 'font-features-ligatures',
      fractions: 'font-features-fractions',
      ordinals: 'font-features-ordinals',
      stylistic: 'font-features-stylistic',
      all: 'font-features-all',
    },
    stylisticSet: {
      body: 'font-stylistic-body',
      altA: 'font-stylistic-alt-a',
      altK: 'font-stylistic-alt-k',
      altX: 'font-stylistic-alt-x',
      altY: 'font-stylistic-alt-y',
      altLowercase: 'font-stylistic-alt-lowercase',
      all: 'font-stylistic-all',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    textColor: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive',
    },
  },
  defaultVariants: {
    size: 'base',
    weight: 'normal',
    textColor: 'default',
  },
});

export interface OpenTypeTextProps
  extends Omit<React.HTMLAttributes<HTMLParagraphElement>, 'color'>,
    VariantProps<typeof opentypeVariants> {
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const OpenTypeText = React.forwardRef<HTMLParagraphElement, OpenTypeTextProps>(
  ({ className, features, stylisticSet, size, weight, textColor, as: Component = 'p', ...props }, ref) => {
    return (
      <Component
        className={cn(opentypeVariants({ features, stylisticSet, size, weight, textColor, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
OpenTypeText.displayName = 'OpenTypeText';

// Specialized components for common use cases
const LigatureText = React.forwardRef<HTMLParagraphElement, Omit<OpenTypeTextProps, 'features'>>(
  (props, ref) => <OpenTypeText ref={ref} features="ligatures" {...props} />
);
LigatureText.displayName = 'LigatureText';

const FractionText = React.forwardRef<HTMLParagraphElement, Omit<OpenTypeTextProps, 'features'>>(
  (props, ref) => <OpenTypeText ref={ref} features="fractions" {...props} />
);
FractionText.displayName = 'FractionText';

const OrdinalText = React.forwardRef<HTMLParagraphElement, Omit<OpenTypeTextProps, 'features'>>(
  (props, ref) => <OpenTypeText ref={ref} features="ordinals" {...props} />
);
OrdinalText.displayName = 'OrdinalText';

const StylisticText = React.forwardRef<HTMLParagraphElement, Omit<OpenTypeTextProps, 'features'>>(
  (props, ref) => <OpenTypeText ref={ref} features="stylistic" {...props} />
);
StylisticText.displayName = 'StylisticText';

const BodyOptimizedText = React.forwardRef<HTMLParagraphElement, Omit<OpenTypeTextProps, 'stylisticSet'>>(
  (props, ref) => <OpenTypeText ref={ref} stylisticSet="body" {...props} />
);
BodyOptimizedText.displayName = 'BodyOptimizedText';

export {
  OpenTypeText,
  LigatureText,
  FractionText,
  OrdinalText,
  StylisticText,
  BodyOptimizedText,
  opentypeVariants,
}; 