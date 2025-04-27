// src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL from environment variable
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Define your static routes
  const routes = [
    '/',
    '/privacy',
    '/blog',
    '/blog/guide-to-using-ventra-with-cta',
    '/blog/real-time-cta-alerts',
    '/blog/chitrack-vs-transit-stop',
    '/blog/chicago-l-tracker-vs-google-maps',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1 : 0.8,
  }));

  // Add dynamic routes (e.g., blog posts) here if needed
  // const posts = await fetchBlogPosts();
  // const blogRoutes = posts.map(...)

  return [...routes];
} 