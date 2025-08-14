import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = 'https://sniket.com';
  
  // Define all the important pages on your website
  const pages = [
    // Main pages
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/login', priority: '0.8', changefreq: 'monthly' },
    { url: '/register', priority: '0.8', changefreq: 'monthly' },
    { url: '/become-provider', priority: '0.9', changefreq: 'monthly' },
    
    // Customer pages
    { url: '/customer/dashboard', priority: '0.7', changefreq: 'weekly' },
    { url: '/customer/onboarding', priority: '0.6', changefreq: 'monthly' },
    { url: '/customer/bookings', priority: '0.7', changefreq: 'weekly' },
    
    // Provider pages
    { url: '/provider/login', priority: '0.8', changefreq: 'monthly' },
    { url: '/provider/dashboard', priority: '0.7', changefreq: 'weekly' },
    { url: '/provider/onboarding', priority: '0.6', changefreq: 'monthly' },
    { url: '/provider/services', priority: '0.9', changefreq: 'weekly' },
    { url: '/provider/commission', priority: '0.6', changefreq: 'monthly' },
    
    // Service pages
    { url: '/book', priority: '0.9', changefreq: 'weekly' },
    { url: '/providers', priority: '0.8', changefreq: 'weekly' },
    { url: '/payment', priority: '0.6', changefreq: 'monthly' },
    
    // Admin pages (lower priority as they're not customer-facing)
    { url: '/admin', priority: '0.3', changefreq: 'monthly' },
    { url: '/admin/users', priority: '0.3', changefreq: 'monthly' },
    { url: '/admin/providers', priority: '0.3', changefreq: 'monthly' },
    { url: '/admin/bookings', priority: '0.3', changefreq: 'monthly' },
    { url: '/admin/payments', priority: '0.3', changefreq: 'monthly' },
    { url: '/admin/commission-collection', priority: '0.3', changefreq: 'monthly' },
    { url: '/admin/data-export', priority: '0.3', changefreq: 'monthly' },
  ];

  // Generate XML sitemap
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Return XML with proper headers
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
