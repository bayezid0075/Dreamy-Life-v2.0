import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CreatePostPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, user } = useAuthStore();
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isAuthenticated) { router.replace('/login'); return null; }

  const handlePost = async () => {
    if (!content.trim() && !selectedFile) return;
    setPosting(true);
    try {
      let mediaIds: string[] = [];
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await fetch(`${API_URL}/media/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) mediaIds = [uploadData.url];
      }
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ content, mediaIds }),
      });
      if (res.ok) {
        const post = await res.json();
        router.push(`/posts/${post.id}`);
      }
    } catch (err) { console.error(err); }
    finally { setPosting(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  return (
    <>
      <Head><title>Dreamy Life - Create Post</title></Head>
      <style>{`
        body { background-color: #fcf9f8; min-height: 100vh; }
        .glass-card { background: rgba(255,255,255,0.6); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 8px 32px rgba(0,0,0,0.04); }
      `}</style>

      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto px-4 h-16">
          <button onClick={() => router.back()} className="text-[#45474b] hover:text-[#1c1b1b] font-semibold">Cancel</button>
          <h1 className="text-lg font-bold text-[#1c1b1b]">New Post</h1>
          <button onClick={handlePost} disabled={posting || (!content.trim() && !selectedFile)} className="text-[#2d666d] font-bold disabled:opacity-40">
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#e9fdff] flex items-center justify-center">
              <span className="text-[#2d666d] font-bold">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
            </div>
            <span className="font-bold text-[#1c1b1b]">{user?.username || 'You'}</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full min-h-[200px] bg-transparent border-none focus:ring-0 text-[#1c1b1b] text-[15px] placeholder:text-[#45474b]/50 resize-none outline-none"
            autoFocus
          />
          {previewUrl && (
            <div className="mt-2 relative">
              <img src={previewUrl} alt="Preview" className="w-full rounded-xl max-h-[400px] object-cover" />
              <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 glass-card rounded-2xl p-4">
          <label className="flex items-center gap-3 text-[#2d666d] hover:text-[#1c1b1b] cursor-pointer transition-colors">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
            <span className="text-sm font-semibold">Add Photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </label>
        </div>
      </main>
    </>
  );
}
