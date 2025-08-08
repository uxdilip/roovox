import { Inter } from 'next/font/google';

// Google Fonts
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Custom Font Configuration
export const fonts = {
  chillax: {
    family: 'Chillax',
    fallback: ['Inter', 'system-ui', 'sans-serif'],
    weights: {
      light: 200,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    styles: {
      normal: 'normal',
    },
  },
  snonym: {
    family: 'Snonym',
    fallback: ['Inter', 'system-ui', 'sans-serif'],
    weights: {
      light: 200,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    styles: {
      normal: 'normal',
    },
  },
} as const;

// Font Family Classes
export const fontClasses = {
  display: 'font-chillax',
  body: 'font-snonym',
  sans: 'font-sans',
} as const;

// Typography Scale Classes
export const typographyClasses = {
  display: {
    '2xl': 'text-display-2xl',
    xl: 'text-display-xl',
    lg: 'text-display-lg',
    md: 'text-display-md',
  },
  body: {
    lg: 'text-body-lg',
    md: 'text-body-md',
    sm: 'text-body-sm',
  },
} as const;

// Font Utility Functions
export const getFontFamily = (font: keyof typeof fonts) => {
  return fonts[font].family;
};

export const getFontFallback = (font: keyof typeof fonts) => {
  return fonts[font].fallback.join(', ');
};

export const getFontStack = (font: keyof typeof fonts) => {
  return `${fonts[font].family}, ${fonts[font].fallback.join(', ')}`;
}; 