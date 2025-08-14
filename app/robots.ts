import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/_next/', '/test-*'],
    },
    sitemap: 'https://sniket.com/sitemap.xml',
  };
}
