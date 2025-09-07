import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/_next/', '/customer/', '/provider/', '/auth/', '/login'],
    },
    sitemap: 'https://sniket.com/sitemap.xml',
  };
}
