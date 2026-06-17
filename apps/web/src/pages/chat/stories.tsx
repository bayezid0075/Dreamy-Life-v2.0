import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function StoriesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <>
      <Head>
        <title>Dreamy Life - Stories</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>

      <body className="bg-aurora text-on-surface min-h-screen font-[\'Plus_Jakarta_Sans\',sans-serif] antialiased pb-24 md:pb-0 relative overflow-x-hidden">
        <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center px-6 h-16 w-full max-w-[1280px] mx-auto">
            <Link href="/chat" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-primary active:scale-95">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="text-[24px] font-bold text-on-surface tracking-tight">Stories</h1>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-primary active:scale-95">
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </header>

        <main className="pt-[calc(64px+env(safe-area-inset-top))] px-4 md:px-6 max-w-[1280px] mx-auto min-h-screen flex flex-col items-center justify-center">
          <div className="glass-panel rounded-2xl p-12 text-center max-w-md">
            <div className="w-32 h-32 rounded-full bg-white/40 flex items-center justify-center mb-6 mx-auto shadow-inner">
              <span className="material-symbols-outlined text-6xl text-outline-variant" style={{ fontVariationSettings: "'FILL' 0" }}>amp_stories</span>
            </div>
            <h2 className="text-[24px] font-bold text-on-surface mb-2">Stories</h2>
            <p className="text-[16px] text-outline max-w-sm mx-auto">Share moments with your friends and network. Stories disappear after 24 hours. Coming soon!</p>
          </div>
        </main>

        {/* BottomNavBar */}
        <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-lg bg-white/40 backdrop-blur-xl border-t border-white/30 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
          <div className="flex justify-around items-center h-20 px-4 w-full">
            <Link href="/chat" className="flex flex-col items-center justify-center text-on-surface-variant hover:opacity-80 transition-opacity active:scale-90 transition-transform duration-200">
              <span className="material-symbols-outlined">chat_bubble</span>
              <span className="text-[10px] font-semibold mt-1">Chats</span>
            </Link>
            <Link href="/chat/calls" className="flex flex-col items-center justify-center text-on-surface-variant hover:opacity-80 transition-opacity active:scale-90 transition-transform duration-200">
              <span className="material-symbols-outlined">call</span>
              <span className="text-[10px] font-semibold mt-1">Calls</span>
            </Link>
            <Link href="/chat/people" className="flex flex-col items-center justify-center text-on-surface-variant hover:opacity-80 transition-opacity active:scale-90 transition-transform duration-200">
              <span className="material-symbols-outlined">group</span>
              <span className="text-[10px] font-semibold mt-1">People</span>
            </Link>
            <Link href="/chat/stories" className="flex flex-col items-center justify-center bg-primary text-on-primary rounded-full px-4 py-1 active:scale-90 transition-transform duration-200">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>amp_stories</span>
              <span className="text-[10px] font-semibold mt-1">Stories</span>
            </Link>
          </div>
        </nav>
      </body>
    </>
  );
}
