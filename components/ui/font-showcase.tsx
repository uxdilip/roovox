import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Display, Heading, Body } from '@/components/ui/typography';
import { 
  OpenTypeText, 
  LigatureText, 
  FractionText, 
  OrdinalText, 
  StylisticText, 
  BodyOptimizedText 
} from '@/components/ui/opentype-text';

export function FontShowcase() {
  return (
    <div className="p-8 space-y-8">
      {/* Display Font Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="font-chillax text-2xl">Chillax Font Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1 className="font-chillax text-4xl font-bold text-primary">
              Display Heading (Chillax Bold)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              font-chillax text-4xl font-bold
            </p>
          </div>
          
          <div>
            <h2 className="font-chillax text-3xl font-semibold">
              Section Title (Chillax Semibold)
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              font-chillax text-3xl font-semibold
            </p>
          </div>
          
          <div>
            <h3 className="font-chillax text-2xl font-medium">
              Subsection (Chillax Medium)
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              font-chillax text-2xl font-medium
            </p>
          </div>
          
          <div>
            <h4 className="font-chillax text-xl font-normal">
              Small Display (Chillax Regular)
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              font-chillax text-xl font-normal
            </p>
          </div>
          
          <div>
            <h5 className="font-chillax text-lg font-light">
              Light Display (Chillax Light)
            </h5>
            <p className="text-sm text-muted-foreground mt-1">
              font-chillax text-lg font-light
            </p>
          </div>
        </CardContent>
      </Card>

      {/* OpenType Features */}
      <Card>
        <CardHeader>
          <CardTitle className="font-chillax text-2xl">OpenType Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ligatures */}
          <div>
            <h3 className="font-chillax text-lg font-semibold mb-3">Ligatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-chillax text-xl font-normal">Without Ligatures: fi fl ff ffi ffl</p>
                <p className="text-sm text-muted-foreground mt-1">Standard text</p>
              </div>
              <div>
                <p className="font-chillax text-xl font-normal font-features-ligatures">With Ligatures: fi fl ff ffi ffl</p>
                <p className="text-sm text-muted-foreground mt-1">font-features-ligatures</p>
              </div>
            </div>
          </div>

          {/* Fractions */}
          <div>
            <h3 className="font-chillax text-lg font-semibold mb-3">Fractions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-chillax text-xl font-normal">Without Fractions: 1/2 3/4 5/8</p>
                <p className="text-sm text-muted-foreground mt-1">Standard text</p>
              </div>
              <div>
                <p className="font-chillax text-xl font-normal font-features-fractions">With Fractions: 1/2 3/4 5/8</p>
                <p className="text-sm text-muted-foreground mt-1">font-features-fractions</p>
              </div>
            </div>
          </div>

          {/* Ordinals */}
          <div>
            <h3 className="font-chillax text-lg font-semibold mb-3">Ordinals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-chillax text-xl font-normal">Without Ordinals: 1st 2nd 3rd 4th</p>
                <p className="text-sm text-muted-foreground mt-1">Standard text</p>
              </div>
              <div>
                <p className="font-chillax text-xl font-normal font-features-ordinals">With Ordinals: 1st 2nd 3rd 4th</p>
                <p className="text-sm text-muted-foreground mt-1">font-features-ordinals</p>
              </div>
            </div>
          </div>

          {/* Stylistic Alternates */}
          <div>
            <h3 className="font-chillax text-lg font-semibold mb-3">Stylistic Alternates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-chillax text-xl font-normal">Standard: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</p>
                <p className="text-sm text-muted-foreground mt-1">Standard characters</p>
              </div>
              <div>
                <p className="font-chillax text-xl font-normal font-features-stylistic">Stylistic: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</p>
                <p className="text-sm text-muted-foreground mt-1">font-features-stylistic</p>
              </div>
            </div>
          </div>

          {/* All Features Combined */}
          <div>
            <h3 className="font-chillax text-lg font-semibold mb-3">All Features Combined</h3>
            <div>
              <p className="font-chillax text-xl font-normal font-features-all">
                Combined: 1st 2nd 3rd 4th • 1/2 3/4 5/8 • fi fl ff ffi ffl • A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
              </p>
              <p className="text-sm text-muted-foreground mt-1">font-features-all</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OpenType Components */}
      <Card>
        <CardHeader>
          <CardTitle className="font-chillax text-2xl">OpenType Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-chillax text-lg font-semibold mb-3">Specialized Components</h3>
            <div className="space-y-4">
              <div>
                <LigatureText size="xl">
                  LigatureText Component: fi fl ff ffi ffl
                </LigatureText>
                <p className="text-sm text-muted-foreground mt-1">
                  &lt;LigatureText size="xl"&gt;fi fl ff ffi ffl&lt;/LigatureText&gt;
                </p>
              </div>
              
              <div>
                <FractionText size="xl">
                  FractionText Component: 1/2 3/4 5/8
                </FractionText>
                <p className="text-sm text-muted-foreground mt-1">
                  &lt;FractionText size="xl"&gt;1/2 3/4 5/8&lt;/FractionText&gt;
                </p>
              </div>
              
              <div>
                <OrdinalText size="xl">
                  OrdinalText Component: 1st 2nd 3rd 4th
                </OrdinalText>
                <p className="text-sm text-muted-foreground mt-1">
                  &lt;OrdinalText size="xl"&gt;1st 2nd 3rd 4th&lt;/OrdinalText&gt;
                </p>
              </div>
              
              <div>
                <StylisticText size="xl">
                  StylisticText Component: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
                </StylisticText>
                <p className="text-sm text-muted-foreground mt-1">
                  &lt;StylisticText size="xl"&gt;A B C D E F G H I J K L M N O P Q R S T U V W X Y Z&lt;/StylisticText&gt;
                </p>
              </div>
              
              <div>
                <BodyOptimizedText size="lg" weight="normal">
                  BodyOptimizedText Component: This is body text optimized for readability in paragraphs and long-form content.
                </BodyOptimizedText>
                <p className="text-sm text-muted-foreground mt-1">
                  &lt;BodyOptimizedText size="lg" weight="normal"&gt;Body text...&lt;/BodyOptimizedText&gt;
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-chillax text-lg font-semibold mb-3">Flexible OpenTypeText Component</h3>
            <div className="space-y-4">
              <div>
                <OpenTypeText 
                  features="all" 
                  size="xl" 
                  weight="semibold" 
                  textColor="primary"
                >
                  All Features + Custom Styling: 1st 2nd 3rd 4th • 1/2 3/4 5/8 • fi fl ff ffi ffl
                </OpenTypeText>
                <p className="text-sm text-muted-foreground mt-1">
                  &lt;OpenTypeText features="all" size="xl" weight="semibold" textColor="primary"&gt;
                </p>
              </div>
              
              <div>
                <OpenTypeText 
                  stylisticSet="all" 
                  size="lg" 
                  weight="medium" 
                  textColor="muted"
                >
                  All Stylistic Sets: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
                </OpenTypeText>
                <p className="text-sm text-muted-foreground mt-1">
                  &lt;OpenTypeText stylisticSet="all" size="lg" weight="medium" textColor="muted"&gt;
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stylistic Sets */}
      <Card>
        <CardHeader>
          <CardTitle className="font-chillax text-2xl">Stylistic Sets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Body Text Optimized */}
          <div>
            <h3 className="font-chillax text-lg font-semibold mb-3">Body Text Optimized (ss01)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-chillax text-lg font-normal leading-relaxed">
                  Standard body text with Chillax font. This is optimized for readability in paragraphs and long-form content.
                </p>
                <p className="text-sm text-muted-foreground mt-1">Standard text</p>
              </div>
              <div>
                <p className="font-chillax text-lg font-normal leading-relaxed font-stylistic-body">
                  Body text optimized with stylistic set 1. This is optimized for readability in paragraphs and long-form content.
                </p>
                <p className="text-sm text-muted-foreground mt-1">font-stylistic-body</p>
              </div>
            </div>
          </div>

          {/* Alternate Characters */}
          <div>
            <h3 className="font-chillax text-lg font-semibold mb-3">Alternate Characters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="font-chillax text-2xl font-normal">Standard: A K X Y</p>
                <p className="text-sm text-muted-foreground mt-1">Standard characters</p>
              </div>
              <div>
                <p className="font-chillax text-2xl font-normal font-stylistic-alt-a">Alt A: A K X Y</p>
                <p className="text-sm text-muted-foreground mt-1">font-stylistic-alt-a</p>
              </div>
              <div>
                <p className="font-chillax text-2xl font-normal font-stylistic-alt-k">Alt K: A K X Y</p>
                <p className="text-sm text-muted-foreground mt-1">font-stylistic-alt-k</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <p className="font-chillax text-2xl font-normal">Standard: a k x y</p>
                <p className="text-sm text-muted-foreground mt-1">Standard lowercase</p>
              </div>
              <div>
                <p className="font-chillax text-2xl font-normal font-stylistic-alt-x">Alt X: a k x y</p>
                <p className="text-sm text-muted-foreground mt-1">font-stylistic-alt-x</p>
              </div>
              <div>
                <p className="font-chillax text-2xl font-normal font-stylistic-alt-lowercase">Alt Lowercase: a k x y</p>
                <p className="text-sm text-muted-foreground mt-1">font-stylistic-alt-lowercase</p>
              </div>
            </div>
          </div>

          {/* All Stylistic Sets Combined */}
          <div>
            <h3 className="font-chillax text-lg font-semibold mb-3">All Stylistic Sets Combined</h3>
            <div>
              <p className="font-chillax text-xl font-normal font-stylistic-all">
                All Sets: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z • a b c d e f g h i j k l m n o p q r s t u v w x y z
              </p>
              <p className="text-sm text-muted-foreground mt-1">font-stylistic-all</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Body Font Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="font-snonym text-2xl">Snonym Font Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-snonym text-lg font-medium leading-relaxed">
              Large body text with Snonym font for excellent readability and comfortable reading experience.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              font-snonym text-lg font-medium leading-relaxed
            </p>
          </div>
          
          <div>
            <p className="font-snonym text-base font-normal leading-relaxed">
              Standard body text using Snonym font. This font is specifically designed for optimal readability in paragraphs and long-form content.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              font-snonym text-base font-normal leading-relaxed
            </p>
          </div>
          
          <div>
            <p className="font-snonym text-sm font-normal leading-relaxed">
              Small body text with Snonym font, perfect for captions, footnotes, and secondary information.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              font-snonym text-sm font-normal leading-relaxed
            </p>
          </div>
          
          <div>
            <p className="font-snonym text-base font-light leading-relaxed">
              Light body text with Snonym font, ideal for subtle text and secondary content with a softer appearance.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              font-snonym text-base font-light leading-relaxed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Typography Components */}
      <Card>
        <CardHeader>
          <CardTitle className="font-chillax text-2xl">Typography Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Display>Display Component (Chillax)</Display>
            <p className="text-sm text-muted-foreground mt-1">
              &lt;Display&gt;Display Component (Chillax)&lt;/Display&gt;
            </p>
          </div>
          
          <div className="space-y-2">
            <Heading level={1}>Heading Level 1 (Chillax)</Heading>
            <Heading level={2}>Heading Level 2 (Chillax)</Heading>
            <Heading level={3}>Heading Level 3 (Snonym)</Heading>
            <p className="text-sm text-muted-foreground">
              &lt;Heading level={1}&gt;Heading Level 1&lt;/Heading&gt;
            </p>
          </div>
          
          <div className="space-y-2">
            <Body size="lg">Large Body Text (Snonym)</Body>
            <Body size="md">Medium Body Text (Snonym)</Body>
            <Body size="sm">Small Body Text (Snonym)</Body>
            <p className="text-sm text-muted-foreground">
              &lt;Body size="lg"&gt;Large Body Text&lt;/Body&gt;
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Typography Scale Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="font-chillax text-2xl">Typography Scale Classes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1 className="text-display-2xl">Display 2XL (Chillax)</h1>
            <p className="text-sm text-muted-foreground mt-1">
              text-display-2xl
            </p>
          </div>
          
          <div>
            <h2 className="text-display-xl">Display XL (Chillax)</h2>
            <p className="text-sm text-muted-foreground mt-1">
              text-display-xl
            </p>
          </div>
          
          <div>
            <h3 className="text-display-lg">Display LG (Chillax)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              text-display-lg
            </p>
          </div>
          
          <div>
            <h4 className="text-display-md">Display MD (Chillax)</h4>
            <p className="text-sm text-muted-foreground mt-1">
              text-display-md
            </p>
          </div>
          
          <div>
            <p className="text-body-lg">Body LG (Snonym)</p>
            <p className="text-sm text-muted-foreground mt-1">
              text-body-lg
            </p>
          </div>
          
          <div>
            <p className="text-body-md">Body MD (Snonym)</p>
            <p className="text-sm text-muted-foreground mt-1">
              text-body-md
            </p>
          </div>
          
          <div>
            <p className="text-body-sm">Body SM (Snonym)</p>
            <p className="text-sm text-muted-foreground mt-1">
              text-body-sm
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Font Weights */}
      <Card>
        <CardHeader>
          <CardTitle className="font-chillax text-2xl">Font Weights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-chillax text-lg mb-2">Chillax Weights</h3>
              <div className="space-y-2">
                <p className="font-chillax font-light">Light (200) - font-light</p>
                <p className="font-chillax font-normal">Regular (400) - font-normal</p>
                <p className="font-chillax font-medium">Medium (500) - font-medium</p>
                <p className="font-chillax font-semibold">Semibold (600) - font-semibold</p>
                <p className="font-chillax font-bold">Bold (700) - font-bold</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-snonym text-lg mb-2">Snonym Weights</h3>
              <div className="space-y-2">
                <p className="font-snonym font-light">Light (200) - font-light</p>
                <p className="font-snonym font-normal">Regular (400) - font-normal</p>
                <p className="font-snonym font-medium">Medium (500) - font-medium</p>
                <p className="font-snonym font-semibold">Semibold (600) - font-semibold</p>
                <p className="font-snonym font-bold">Bold (700) - font-bold</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Light Weight Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="font-chillax text-2xl">Light Weight Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-chillax text-3xl font-light text-muted-foreground">
              Light Chillax Heading
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Perfect for subtle headings and secondary titles
            </p>
          </div>
          
          <div>
            <p className="font-snonym text-lg font-light leading-relaxed text-muted-foreground">
              Light Snonym text is excellent for subtle content, captions, and secondary information that needs to be present but not prominent.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Ideal for footnotes, metadata, and supporting text
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-chillax text-lg font-light mb-2">Chillax Light Uses:</h4>
              <ul className="font-snonym text-sm font-light space-y-1 text-muted-foreground">
                <li>• Subtle section titles</li>
                <li>• Secondary headings</li>
                <li>• Caption text</li>
                <li>• Metadata labels</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-snonym text-lg font-light mb-2">Snonym Light Uses:</h4>
              <ul className="font-snonym text-sm font-light space-y-1 text-muted-foreground">
                <li>• Supporting text</li>
                <li>• Footnotes</li>
                <li>• Secondary content</li>
                <li>• Subtle descriptions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="font-chillax text-2xl">Responsive Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1 className="font-chillax text-2xl md:text-4xl lg:text-5xl font-bold text-primary">
              Responsive Heading
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              text-2xl md:text-4xl lg:text-5xl (scales with screen size)
            </p>
          </div>
          
          <div>
            <p className="font-snonym text-sm md:text-base lg:text-lg leading-relaxed">
              This is responsive body text that scales from small on mobile to large on desktop screens.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              text-sm md:text-base lg:text-lg
            </p>
          </div>
          
          <div>
            <h2 className="font-chillax text-xl md:text-2xl lg:text-3xl font-light text-muted-foreground">
              Responsive Light Heading
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Light weight responsive heading for subtle titles
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 