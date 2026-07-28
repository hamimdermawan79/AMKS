import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/user',
          '/login',
          '/api/',
          '/notifications',
          '/_next/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/user', '/login', '/api/', '/notifications'],
      },
    ],
    sitemap: 'https://amks-yogyakarta.vercel.app/sitemap.xml',
    host: 'https://amks-yogyakarta.vercel.app',
  };
}
