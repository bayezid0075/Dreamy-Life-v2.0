import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function CreatePostPage() {
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsPending(true);
    // TODO: integrate with post API
    await new Promise((r) => setTimeout(r, 500));
    setIsPending(false);
    router.push('/feed');
  };

  return (
    <>
      <Head>
        <title>Dreamy Life - Create Post</title>
      </Head>
      <div className="min-h-screen bg-surface p-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => router.back()} className="text-on-surface-variant hover:text-on-surface mb-4">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-on-surface mb-6">Create Post</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={6}
              className="w-full p-5 rounded-2xl text-on-surface bg-white/50 border border-outline/20 focus:bg-white focus:border-primary outline-none transition-all resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending || !content.trim()}
                className="h-12 px-8 rounded-full bg-primary text-on-primary font-semibold hover:opacity-90 transition-all disabled:opacity-60"
              >
                {isPending ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
