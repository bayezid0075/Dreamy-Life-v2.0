import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Page not found</p>
      <Link
        href="/dashboard"
        className="px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
