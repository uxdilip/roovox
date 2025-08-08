# Custom Fonts Implementation Guide

This document explains how to use the custom fonts **Chillax** and **Snonym** in your application.

## 🎨 Font Overview

### **Chillax** - Display Font
- **Usage**: Headlines, titles, and prominent text
- **Characteristics**: Modern, clean, and highly readable
- **Best for**: Hero sections, page titles, and brand messaging
- **Weights**: Light (200), Regular (400), Medium (500), Semibold (600), Bold (700)
- **OpenType Features**: Ligatures, Fractions, Ordinals, Stylistic Alternates, Stylistic Sets

### **Snonym** - Body Font
- **Usage**: Body text, paragraphs, and general content
- **Characteristics**: Excellent readability and comfortable reading experience
- **Best for**: Articles, descriptions, and long-form content
- **Weights**: Light (200), Regular (400), Medium (500), Semibold (600), Bold (700)

## 📁 File Structure

```
public/fonts/
├── Chillax-Variable.woff2    # Variable font (recommended)
├── Chillax-Light.woff2       # Light weight (200)
├── Chillax-Regular.woff2     # Regular weight (400)
├── Chillax-Medium.woff2      # Medium weight (500)
├── Chillax-SemiBold.woff2    # Semibold weight (600)
├── Chillax-Bold.woff2        # Bold weight (700)
├── Snonym-Variable.woff2     # Variable font (recommended)
├── Snonym-Light.woff2        # Light weight (200)
├── Snonym-Regular.woff2      # Regular weight (400)
├── Snonym-Medium.woff2       # Medium weight (500)
├── Snonym-SemiBold.woff2     # Semibold weight (600)
└── Snonym-Bold.woff2         # Bold weight (700)
```

## 🚀 Usage Methods

### **1. Tailwind CSS Classes**

```tsx
// Display text with Chillax
<h1 className="font-chillax text-4xl font-bold">
  Welcome to Our Platform
</h1>

// Light weight display text
<h2 className="font-chillax text-2xl font-light text-muted-foreground">
  Subtle Section Title
</h2>

// Body text with Snonym
<p className="font-snonym text-base leading-relaxed">
  This is body text using the Snonym font for excellent readability.
</p>

// Light weight body text
<p className="font-snonym text-sm font-light text-muted-foreground">
  Supporting text with light weight for subtle appearance.
</p>

// Using semantic classes
<h2 className="font-display text-2xl font-semibold">
  Section Title
</h2>

<p className="font-body text-lg">
  Body content with proper typography.
</p>
```

### **2. OpenType Features (Chillax Only)**

```tsx
// Ligatures - connects letter combinations
<p className="font-chillax font-features-ligatures">
  fi fl ff ffi ffl
</p>

// Fractions - displays proper fractions
<p className="font-chillax font-features-fractions">
  1/2 3/4 5/8
</p>

// Ordinals - displays proper ordinal numbers
<p className="font-chillax font-features-ordinals">
  1st 2nd 3rd 4th
</p>

// Stylistic Alternates - alternative character forms
<p className="font-chillax font-features-stylistic">
  A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
</p>

// All features combined
<p className="font-chillax font-features-all">
  1st 2nd 3rd 4th • 1/2 3/4 5/8 • fi fl ff ffi ffl • A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
</p>
```

### **3. Stylistic Sets (Chillax Only)**

```tsx
// Body text optimized
<p className="font-chillax font-stylistic-body">
  Body text optimized for readability in paragraphs and long-form content.
</p>

// Alternate character forms
<p className="font-chillax font-stylistic-alt-a">Alternate A: A K X Y</p>
<p className="font-chillax font-stylistic-alt-k">Alternate K: A K X Y</p>
<p className="font-chillax font-stylistic-alt-x">Alternate X: a k x y</p>
<p className="font-chillax font-stylistic-alt-y">Alternate Y: A K X Y</p>
<p className="font-chillax font-stylistic-alt-lowercase">Alternate Lowercase: a k x y</p>

// All stylistic sets combined
<p className="font-chillax font-stylistic-all">
  All Sets: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z • a b c d e f g h i j k l m n o p q r s t u v w x y z
</p>
```

### **4. Typography Components**

```tsx
import { Display, Heading, Body } from '@/components/ui/typography';

// Display component (uses Chillax)
<Display>Main Page Title</Display>

// Heading component with different levels
<Heading level={1}>Primary Heading</Heading>
<Heading level={2}>Secondary Heading</Heading>
<Heading level={3}>Tertiary Heading</Heading>

// Body component with different sizes
<Body size="lg">Large body text</Body>
<Body size="md">Medium body text</Body>
<Body size="sm">Small body text</Body>

// With custom styling
<Heading 
  level={2} 
  textColor="primary" 
  textAlign="center"
  className="mb-4"
>
  Centered Primary Heading
</Heading>
```

### **5. CSS Custom Properties**

```css
/* Using CSS variables */
.title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 700;
}

.light-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 200;
  color: var(--muted-foreground);
}

.content {
  font-family: var(--font-body);
  font-size: 1.125rem;
  line-height: 1.75;
}

.subtle-text {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 200;
  color: var(--muted-foreground);
}
```

### **6. Typography Scale Classes**

```tsx
// Predefined typography classes
<h1 className="text-display-2xl">Extra Large Display</h1>
<h2 className="text-display-xl">Large Display</h2>
<h3 className="text-display-lg">Medium Display</h3>
<h4 className="text-display-md">Small Display</h4>

<p className="text-body-lg">Large Body Text</p>
<p className="text-body-md">Medium Body Text</p>
<p className="text-body-sm">Small Body Text</p>
```

## 🎯 Best Practices

### **Font Pairing**
- Use **Chillax** for headlines and display text
- Use **Snonym** for body text and content
- Maintain consistent hierarchy with font weights

### **Weight Usage Guidelines**

#### **Chillax Weights:**
- **Light (200)**: Subtle headings, secondary titles, captions
- **Regular (400)**: Standard headings, titles
- **Medium (500)**: Emphasis in headings, important titles
- **Semibold (600)**: Strong headings, section titles
- **Bold (700)**: Hero titles, main headings

#### **Snonym Weights:**
- **Light (200)**: Supporting text, footnotes, metadata, subtle content
- **Regular (400)**: Standard body text, paragraphs
- **Medium (500)**: Emphasis in body text, important content
- **Semibold (600)**: Strong emphasis, call-to-action text
- **Bold (700)**: Important body text, highlights

### **OpenType Features Usage**

#### **Ligatures**
- Automatically connects letter combinations like "fi", "fl", "ff"
- Improves readability and visual appeal
- Use for body text and headings

#### **Fractions**
- Displays proper fractions instead of regular numbers
- Perfect for recipes, measurements, and technical content
- Use when displaying ratios or proportions

#### **Ordinals**
- Displays proper ordinal numbers (1st, 2nd, 3rd, 4th)
- Ideal for dates, rankings, and sequential content
- Use in titles and important text

#### **Stylistic Alternates**
- Provides alternative character forms
- Adds visual variety and personality
- Use sparingly for emphasis or branding

#### **Stylistic Sets**
- **Body Text Optimized (ss01)**: Optimized for readability in paragraphs
- **Alternate A (ss02)**: Alternative form of letter A
- **Alternate K (ss03)**: Alternative form of letter K
- **Alternate X (ss04)**: Alternative form of letter X
- **Alternate Y (ss05)**: Alternative form of letter Y
- **Alternate Lowercase (ss06)**: Alternative lowercase forms

### **Responsive Typography**
```tsx
// Responsive font sizes
<h1 className="font-chillax text-2xl md:text-4xl lg:text-5xl font-bold">
  Responsive Title
</h1>

<p className="font-snonym text-sm md:text-base lg:text-lg">
  Responsive body text that scales with screen size.
</p>

// Responsive light weight
<h2 className="font-chillax text-xl md:text-2xl lg:text-3xl font-light text-muted-foreground">
  Responsive Light Heading
</h2>
```

### **Font Loading Optimization**
- Fonts use `font-display: swap` for better performance
- Variable fonts are preferred for smaller file sizes
- Static fonts are provided as fallbacks

### **Accessibility**
```tsx
// Ensure proper contrast and sizing
<h1 className="font-chillax text-4xl font-bold text-foreground">
  Accessible Heading
</h1>

<p className="font-snonym text-base leading-relaxed text-foreground">
  Accessible body text with proper line height.
</p>

// Light weight with proper contrast
<p className="font-snonym text-sm font-light text-muted-foreground">
  Subtle text with appropriate contrast ratio.
</p>
```

## 🔧 Configuration

### **Tailwind Config**
```typescript
// tailwind.config.ts
fontFamily: {
  'chillax': ['Chillax', 'Inter', 'system-ui', 'sans-serif'],
  'snonym': ['Snonym', 'Inter', 'system-ui', 'sans-serif'],
  'display': ['Chillax', 'Inter', 'system-ui', 'sans-serif'],
  'body': ['Snonym', 'Inter', 'system-ui', 'sans-serif'],
}
```

### **Font Configuration**
```typescript
// lib/fonts.ts
export const fonts = {
  chillax: {
    family: 'Chillax',
    fallback: ['Inter', 'system-ui', 'sans-serif'],
    weights: { 
      light: 200, 
      regular: 400, 
      medium: 500, 
      semibold: 600, 
      bold: 700 
    }
  },
  snonym: {
    family: 'Snonym',
    fallback: ['Inter', 'system-ui', 'sans-serif'],
    weights: { 
      light: 200, 
      regular: 400, 
      medium: 500, 
      semibold: 600, 
      bold: 700 
    }
  }
}
```

## 📱 Font Weights Available

### **Chillax**
- `font-light` (200) - Subtle headings, secondary titles
- `font-normal` (400) - Standard headings, titles
- `font-medium` (500) - Emphasis in headings
- `font-semibold` (600) - Strong headings, section titles
- `font-bold` (700) - Hero titles, main headings

### **Snonym**
- `font-light` (200) - Supporting text, footnotes, metadata
- `font-normal` (400) - Standard body text, paragraphs
- `font-medium` (500) - Emphasis in body text
- `font-semibold` (600) - Strong emphasis, call-to-action
- `font-bold` (700) - Important body text, highlights

## 🎨 Design System Integration

### **Typography Scale**
```tsx
// Consistent typography hierarchy
<Display>Hero Title (Chillax, 2.5rem, Bold)</Display>
<Heading level={1}>Page Title (Chillax, 2rem, Semibold)</Heading>
<Heading level={2}>Section Title (Chillax, 1.5rem, Medium)</Heading>
<Heading level={3}>Subsection Title (Snonym, 1.25rem, Medium)</Heading>
<Body size="lg">Large Body (Snonym, 1.125rem, Normal)</Body>
<Body size="md">Body Text (Snonym, 1rem, Normal)</Body>
<Body size="sm">Small Text (Snonym, 0.875rem, Normal)</Body>

// Light weight examples
<h2 className="font-chillax text-2xl font-light text-muted-foreground">
  Subtle Section Title
</h2>
<p className="font-snonym text-sm font-light text-muted-foreground">
  Supporting text with light weight
</p>
```

### **Component Usage**
```tsx
// In your components
import { Heading, Body } from '@/components/ui/typography';

export function Card({ title, description, subtitle }: CardProps) {
  return (
    <div className="p-6 border rounded-lg">
      <Heading level={3} className="mb-2">{title}</Heading>
      {subtitle && (
        <p className="font-chillax text-sm font-light text-muted-foreground mb-2">
          {subtitle}
        </p>
      )}
      <Body size="md" textColor="muted">{description}</Body>
    </div>
  );
}
```

## 💡 Light Weight Usage Examples

### **Chillax Light (200)**
```tsx
// Subtle headings
<h2 className="font-chillax text-xl font-light text-muted-foreground">
  Related Articles
</h2>

// Secondary headings
<h3 className="font-chillax text-lg font-light text-muted-foreground">
  Additional Information
</h3>

// Caption text
<p className="font-chillax text-sm font-light text-muted-foreground">
  Image caption or metadata
</p>
```

### **Snonym Light (200)**
```tsx
// Supporting text
<p className="font-snonym text-sm font-light text-muted-foreground">
  Last updated: January 15, 2024
</p>

// Footnotes
<p className="font-snonym text-xs font-light text-muted-foreground">
  * Terms and conditions apply
</p>

// Secondary content
<p className="font-snonym text-base font-light text-muted-foreground">
  This is supporting information that provides additional context.
</p>
```

## 🔤 OpenType Features Examples

### **Ligatures**
```tsx
// Standard text
<p className="font-chillax text-xl">fi fl ff ffi ffl</p>

// With ligatures enabled
<p className="font-chillax text-xl font-features-ligatures">fi fl ff ffi ffl</p>
```

### **Fractions**
```tsx
// Standard fractions
<p className="font-chillax text-xl">1/2 3/4 5/8</p>

// Proper fractions
<p className="font-chillax text-xl font-features-fractions">1/2 3/4 5/8</p>
```

### **Ordinals**
```tsx
// Standard ordinals
<p className="font-chillax text-xl">1st 2nd 3rd 4th</p>

// Proper ordinals
<p className="font-chillax text-xl font-features-ordinals">1st 2nd 3rd 4th</p>
```

### **Stylistic Alternates**
```tsx
// Standard characters
<p className="font-chillax text-xl">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</p>

// Stylistic alternates
<p className="font-chillax text-xl font-features-stylistic">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</p>
```

### **Stylistic Sets**
```tsx
// Body text optimized
<p className="font-chillax font-stylistic-body">
  Body text optimized for readability in paragraphs and long-form content.
</p>

// Alternate characters
<p className="font-chillax font-stylistic-alt-a">Alternate A: A K X Y</p>
<p className="font-chillax font-stylistic-alt-k">Alternate K: A K X Y</p>
<p className="font-chillax font-stylistic-alt-x">Alternate X: a k x y</p>
<p className="font-chillax font-stylistic-alt-y">Alternate Y: A K X Y</p>
<p className="font-chillax font-stylistic-alt-lowercase">Alternate Lowercase: a k x y</p>
```

## 🔍 Troubleshooting

### **Font Not Loading**
1. Check if font files are in `public/fonts/`
2. Verify font file names match CSS declarations
3. Check browser network tab for 404 errors

### **Font Display Issues**
1. Ensure proper font-weight values
2. Check for CSS conflicts
3. Verify font-family fallbacks

### **OpenType Features Not Working**
1. Verify font supports the specific OpenType feature
2. Check browser support for font-feature-settings
3. Ensure proper CSS class names are used

### **Performance Issues**
1. Use variable fonts when possible
2. Implement font preloading for critical fonts
3. Consider font subsetting for smaller file sizes

## 📚 Additional Resources

- [Chillax Font Documentation](https://chillax-font.com)
- [Snonym Font Documentation](https://snonym-font.com)
- [Web Font Loading Best Practices](https://web.dev/font-loading/)
- [CSS Font Display](https://developer.mozilla.org/en-US/docs/Web/CSS/font-display)
- [OpenType Features Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings)
- [Fontshare - Chilla Font](https://fontshare.com/?q=chilla) 