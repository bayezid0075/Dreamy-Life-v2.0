import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import PublicPageLayout from '@/shared/components/PublicPageLayout';
import AdSenseBannerAd from '@/shared/components/ads/AdSenseBannerAd';
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt?: string;
  coverImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  authorName: string;
  tags?: string[];
  viewsCount: number;
  publishedAt: string;
  createdAt: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function shareUrl(platform: string, url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const shareLinks: Record<string, string> = {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
  };
  window.open(shareLinks[platform], '_blank', 'noopener,noreferrer,width=600,height=500');
}

export default function BlogPostPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;

    setLoading(true);
    fetch(`${API_URL}/blog/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;
    fetch(`${API_URL}/blog/${slug}/view`, { method: 'POST' }).catch(() => {});
  }, [slug]);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (loading) {
    return (
      <PublicPageLayout>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin h-10 w-10 border-2 border-[#2d666d] border-t-transparent rounded-full" />
        </div>
      </PublicPageLayout>
    );
  }

  if (error || !post) {
    return (
      <PublicPageLayout title="Post Not Found">
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="material-symbols-outlined text-[#45474b]/30 text-7xl mb-4">article</span>
          <h1 className="text-2xl font-bold text-[#1c1b1b] mb-2">Post Not Found</h1>
          <p className="text-[#45474b] mb-6">The blog post you are looking for does not exist or has been removed.</p>
          <Link
            href="/blog"
            className="px-6 py-3 rounded-full bg-[#2d666d] text-white font-semibold text-sm hover:bg-[#245459] transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </PublicPageLayout>
    );
  }

  const pageTitle = post.metaTitle || post.title;
  const pageDescription = post.metaDescription || post.excerpt || post.title;

  return (
    <PublicPageLayout title={pageTitle} description={pageDescription}>
      <Head>
        <title>{pageTitle} | Dreamy Life</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {post.coverImage && <meta property="og:image" content={resolveMediaUrl(post.coverImage) || ''} />}
        <meta name="twitter:card" content={post.coverImage ? 'summary_large_image' : 'summary'} />
      </Head>

      <style jsx global>{`
        .blog-prose h1 {
          font-size: 2rem;
          font-weight: 800;
          color: #1c1b1b;
          margin-bottom: 1rem;
          line-height: 1.3;
        }
        .blog-prose h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1c1b1b;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }
        .blog-prose h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1c1b1b;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .blog-prose p {
          color: #45474b;
          line-height: 1.85;
          margin-bottom: 1.25rem;
          font-size: 1.0625rem;
        }
        .blog-prose a {
          color: #2d666d;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.15s;
        }
        .blog-prose a:hover {
          color: #1c1b1b;
        }
        .blog-prose ul,
        .blog-prose ol {
          color: #45474b;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
          line-height: 1.85;
        }
        .blog-prose ul {
          list-style-type: disc;
        }
        .blog-prose ol {
          list-style-type: decimal;
        }
        .blog-prose li {
          margin-bottom: 0.35rem;
        }
        .blog-prose blockquote {
          border-left: 4px solid #2d666d;
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: #45474b;
          font-style: italic;
        }
        .blog-prose img {
          max-width: 100%;
          border-radius: 1rem;
          margin: 1.5rem 0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }
        .blog-prose pre {
          background: rgba(29, 30, 32, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          overflow-x: auto;
          margin: 1.5rem 0;
          font-size: 0.875rem;
          line-height: 1.6;
        }
        .blog-prose code {
          background: rgba(45, 102, 109, 0.08);
          color: #2d666d;
          padding: 0.15rem 0.4rem;
          border-radius: 0.375rem;
          font-size: 0.9em;
        }
        .blog-prose pre code {
          background: none;
          color: inherit;
          padding: 0;
          border-radius: 0;
        }
        .blog-prose hr {
          border: none;
          height: 1px;
          background: #e5e2e1;
          margin: 2rem 0;
        }
        .blog-prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        .blog-prose th,
        .blog-prose td {
          border: 1px solid #e5e2e1;
          padding: 0.625rem 0.875rem;
          text-align: left;
          font-size: 0.9375rem;
        }
        .blog-prose th {
          background: rgba(229, 226, 225, 0.3);
          font-weight: 600;
          color: #1c1b1b;
        }
        .blog-prose td {
          color: #45474b;
        }
      `}</style>

      {/* Back Link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#45474b] hover:text-[#2d666d] transition-colors mb-6"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Blog
      </Link>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="relative w-full rounded-2xl overflow-hidden mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/50">
          <img
            src={resolveMediaUrl(post.coverImage) || ''}
            alt={post.title}
            className="w-full h-auto max-h-[420px] object-cover"
          />
        </div>
      )}

      {/* Article Header */}
      <article className="bg-white/60 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6 sm:p-10">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1c1b1b] leading-tight mb-5">
          {post.title}
        </h1>

        {/* Meta Row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#45474b] mb-6 pb-6 border-b border-[#e5e2e1]/40">
          {/* Author */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#e9fdff] flex items-center justify-center border border-[#2d666d]/10">
              <span className="text-[#2d666d] font-bold text-sm">
                {post.authorName?.[0]?.toUpperCase()}
              </span>
            </div>
            <span className="font-semibold text-[#1c1b1b]">{post.authorName}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          </div>

          {/* Views */}
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg">visibility</span>
            <span>{post.viewsCount.toLocaleString()} views</span>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-[#2d666d]/8 text-[#2d666d] border border-[#2d666d]/15"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* AdSense Banner - After Header */}
        <div className="mb-8">
          <AdSenseBannerAd adSlot="3051399239" format="horizontal" showLabel={false} />
        </div>

        {/* Post Body */}
        <div className="blog-prose max-w-3xl">
          <ReactMarkdown>{post.body}</ReactMarkdown>
        </div>

        {/* AdSense Banner - Bottom */}
        <div className="mt-10 pt-8 border-t border-[#e5e2e1]/40">
          <AdSenseBannerAd adSlot="3051399239" format="rectangle" showLabel={true} />
        </div>
      </article>

      {/* Share Buttons */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6 mt-6">
        <h3 className="text-base font-bold text-[#1c1b1b] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">share</span>
          Share this post
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => shareUrl('whatsapp', currentUrl, post.title)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25d366]/10 text-[#25d366] font-semibold text-sm hover:bg-[#25d366]/20 transition-colors border border-[#25d366]/15"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </button>
          <button
            onClick={() => shareUrl('facebook', currentUrl, post.title)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1877f2]/10 text-[#1877f2] font-semibold text-sm hover:bg-[#1877f2]/20 transition-colors border border-[#1877f2]/15"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>
          <button
            onClick={() => shareUrl('twitter', currentUrl, post.title)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1c1b1b]/8 text-[#1c1b1b] font-semibold text-sm hover:bg-[#1c1b1b]/15 transition-colors border border-[#1c1b1b]/10"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </button>
        </div>
      </div>

      {/* Related / Bottom Nav */}
      <div className="mt-8 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-[#45474b] font-semibold text-sm hover:bg-white/80 hover:text-[#2d666d] transition-all"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Browse more articles
        </Link>
      </div>
    </PublicPageLayout>
  );
}
