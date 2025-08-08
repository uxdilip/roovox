import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { typographyClasses } from '@/lib/fonts';

const typographyVariants = cva('', {
  variants: {
    variant: {
      'display-2xl': typographyClasses.display['2xl'],
      'display-xl': typographyClasses.display.xl,
      'display-lg': typographyClasses.display.lg,
      'display-md': typographyClasses.display.md,
      'body-lg': typographyClasses.body.lg,
      'body-md': typographyClasses.body.md,
      'body-sm': typographyClasses.body.sm,
    },
    textColor: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive',
    },
    textAlign: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
  },
  defaultVariants: {
    variant: 'body-md',
    textColor: 'default',
    textAlign: 'left',
  },
});

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color' | 'align'>,
    VariantProps<typeof typographyVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, textColor, textAlign, as: Component = 'p', ...props }, ref) => {
    return (
      <Component
        className={cn(typographyVariants({ variant, textColor, textAlign, className }))}
        ref={ref as any}
        {...props}
      />
    );
  }
);
Typography.displayName = 'Typography';

// Specific Typography Components
const Display = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref as any}
      variant="display-2xl"
      as="h1"
      className={className}
      {...props}
    />
  )
);
Display.displayName = 'Display';

const Heading = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }>(
  ({ className, level = 2, ...props }, ref) => {
    const variants = {
      1: 'display-xl',
      2: 'display-lg',
      3: 'display-md',
      4: 'body-lg',
      5: 'body-md',
      6: 'body-sm',
    } as const;

    return (
      <Typography
        ref={ref as any}
        variant={variants[level]}
        as={`h${level}`}
        className={className}
        {...props}
      />
    );
  }
);
Heading.displayName = 'Heading';

const Body = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'> & { size?: 'lg' | 'md' | 'sm' }>(
  ({ className, size = 'md', ...props }, ref) => {
    const variants = {
      lg: 'body-lg',
      md: 'body-md',
      sm: 'body-sm',
    } as const;

    return (
      <Typography
        ref={ref as any}
        variant={variants[size]}
        as="p"
        className={className}
        {...props}
      />
    );
  }
);
Body.displayName = 'Body';

export { Typography, Display, Heading, Body, typographyVariants }; 