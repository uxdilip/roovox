import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://sniket.com/sitemap.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /test-*

# Allow important pages
Allow: /book
Allow: /providers
Allow: /become-provider
Allow: /customer/
Allow: /provider/

# Crawl delay (optional)
Crawl-delay: 1`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
