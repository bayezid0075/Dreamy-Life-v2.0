import Head from 'next/head';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import PublicPageLayout from '@/shared/components/PublicPageLayout';
import AdSenseBannerAd from '@/shared/components/ads/AdSenseBannerAd';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  authorName: string;
  publishedAt: string;
  tags: string[];
}

interface BlogListProps {
  initialPosts: BlogPost[];
  initialTotal: number;
  initialPage: number;
  limit: number;
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const getServerSideProps: GetServerSideProps<BlogListProps> = async () => {
  const limit = 12;
  try {
    const res = await fetch(`${API_URL}/blog?page=1&limit=${limit}`);
    if (!res.ok) {
      return { props: { initialPosts: [], initialTotal: 0, initialPage: 1, limit } };
    }
    const data = await res.json();
    return {
      props: {
        initialPosts: data.posts || data.items || data || [],
        initialTotal: data.total || 0,
        initialPage: 1,
        limit,
      },
    };
  } catch {
    return { props: { initialPosts: [], initialTotal: 0, initialPage: 1, limit } };
  }
};

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 h-full flex flex-col group">
        <div className="relative aspect-[16/10] bg-gradient-to-br from-[#e9fdff] to-[#ffd1dc] overflow-hidden">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span
                className="material-symbols-outlined text-4xl text-[#2d666d]/30"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                article
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e9fdff] text-[#2d666d]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h2 className="font-bold text-sm md:text-base text-[#1c1b1b] leading-snug line-clamp-2 mb-1.5">
            {post.title}
          </h2>

          <p className="text-xs md:text-sm text-[#45474b] line-clamp-2 leading-relaxed mb-3">
            {post.excerpt}
          </p>

          <div className="mt-auto flex items-center justify-between text-[11px] text-[#76777b]">
            <span className="font-semibold truncate mr-2">{post.authorName}</span>
            <span className="flex-shrink-0">{getTimeAgo(post.publishedAt)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function BlogPage({
  initialPosts,
  initialTotal,
  initialPage,
  limit,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);

  const hasMore = posts.length < total;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`${API_URL}/blog?page=${nextPage}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        const newPosts: BlogPost[] = data.posts || data.items || data || [];
        setPosts((prev) => [...prev, ...newPosts]);
        setPage(nextPage);
        if (data.total !== undefined) setTotal(data.total);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, limit]);

  return (
    <>
      <Head>
        <title>Blog - Dreamy Life</title>
        <meta
          name="description"
          content="Discover tips, stories, and insights on wellness, earning, and living your best life with Dreamy Life."
        />
      </Head>

      <PublicPageLayout>
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1c1b1b] tracking-tight mb-2">
            Blog
          </h1>
          <p className="text-base text-[#45474b] max-w-md mx-auto">
            Tips, stories, and insights to help you thrive.
          </p>
        </div>

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-[#5d5e64] mb-4 block">
              article
            </span>
            <p className="text-[#45474b] text-lg font-semibold">No posts yet</p>
            <p className="text-[#45474b]/60 text-sm mt-2">
              Check back soon for new articles and updates.
            </p>
          </div>
        )}

        {/* Posts Grid */}
        {posts.length > 0 && (
          <>
            {/* First row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {posts.slice(0, 3).map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {/* AdSense banner after first row */}
            <div className="my-6">
              <AdSenseBannerAd adSlot="3051399239" format="horizontal" showLabel={false} />
            </div>

            {/* Remaining posts */}
            {posts.length > 3 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {posts.slice(3).map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-8 py-3 rounded-full bg-white/60 backdrop-blur-[10px] border border-[#e5e2e1] text-[#1c1b1b] font-semibold text-sm hover:bg-white/80 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-[#45474b] border-t-transparent rounded-full" />
                  Loading...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">expand_more</span>
                  Load More
                </>
              )}
            </button>
          </div>
        )}
      </PublicPageLayout>
    </>
  );
}
