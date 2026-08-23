import { NextApiRequest, NextApiResponse } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SITE_URL = 'https://dreamy-life.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/blog', priority: '0.9', changefreq: 'daily' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/faq', priority: '0.7', changefreq: 'monthly' },
    { path: '/privacy-policy', priority: '0.5', changefreq: 'yearly' },
    { path: '/terms', priority: '0.5', changefreq: 'yearly' },
  ];

  let blogPages: { path: string; priority: string; changefreq: string; date: string }[] = [];

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${API_URL}/blog?page=${page}&limit=50`);
      if (!response.ok) break;
      const data = await response.json();
      const items = data.items || [];

      for (const post of items) {
        if (post.slug) {
          blogPages.push({
            path: `/blog/${post.slug}`,
            priority: '0.8',
            changefreq: 'weekly',
            date: post.publishedAt || post.updatedAt || post.createdAt,
          });
        }
      }

      hasMore = items.length === 50;
      page++;
    }
  } catch {
    // If backend is unreachable, just serve static pages
  }

  const allPages = [...staticPages, ...blogPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${(page as any).date ? `    <lastmod>${new Date((page as any).date).toISOString().split('T')[0]}</lastmod>` : ''}
  </url>`,
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(xml);
}
