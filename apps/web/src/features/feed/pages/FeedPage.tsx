import Head from 'next/head';

export default function FeedPage() {
  return (
    <>
      <Head>
        <title>Dreamy Life - Feed</title>
      </Head>
      <div className="min-h-screen bg-surface">
        <header className="sticky top-0 bg-surface/80 backdrop-blur-lg border-b border-outline/10">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌸</span>
              <h1 className="text-lg font-bold text-on-surface">Dreamy Life</h1>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6">
          <p className="text-on-surface-variant text-center py-12">Feed coming soon...</p>
        </main>
      </div>
    </>
  );
}
