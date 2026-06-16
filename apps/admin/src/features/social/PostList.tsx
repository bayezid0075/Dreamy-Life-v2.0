'use client';

import { useEffect, useState } from 'react';
import { getAdminPosts, deletePost, type Post, type PostListResponse } from '@/features/social/api';

function PostRow({ post, onDelete }: { post: Post; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      onDelete();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <tr className="border-b border-outline-variant/30 hover:bg-primary-container/10 transition-colors">
      <td className="py-3 max-w-xs">
        <p className="text-on-surface font-bold truncate">{post.authorName}</p>
      </td>
      <td className="py-3 max-w-md">
        <p className="text-on-surface truncate">{post.content}</p>
      </td>
      <td className="py-3 text-on-surface-variant">{post.likesCount}</td>
      <td className="py-3 text-on-surface-variant">{post.commentsCount}</td>
      <td className="py-3 text-on-surface-variant">
        {new Date(post.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 text-right">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1 rounded bg-error/10 text-error font-bold text-xs hover:bg-error/20 transition-colors disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </td>
    </tr>
  );
}

export default function PostList() {
  const [data, setData] = useState<PostListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async (p: number) => {
    setLoading(true);
    try {
      const result = await getAdminPosts({ page: p, limit: 10 });
      setData(result);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  const posts = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="max-w-container-max mx-auto space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">Content Moderation</h1>
        <p className="text-on-surface-variant font-body-sm text-body-sm mt-xs">
          Review and manage user posts
        </p>
      </div>

      <div className="glass-panel rounded-xl p-md overflow-auto">
        <table className="w-full text-left font-body-sm text-body-sm">
          <thead>
            <tr className="text-on-surface-variant border-b border-outline-variant/50">
              <th className="py-2 font-bold">Author</th>
              <th className="py-2 font-bold">Content</th>
              <th className="py-2 font-bold">Likes</th>
              <th className="py-2 font-bold">Comments</th>
              <th className="py-2 font-bold">Created</th>
              <th className="py-2 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <PostRow key={post.id} post={post} onDelete={() => fetchPosts(page)} />
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-on-surface-variant">No posts yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border border-outline-variant text-on-surface hover:border-primary-container transition-colors disabled:opacity-50 font-bold"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-on-surface-variant font-bold">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded border border-outline-variant text-on-surface hover:border-primary-container transition-colors disabled:opacity-50 font-bold"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
