import Link from 'next/link';
import { useRouter } from 'next/router';
import AdSenseBannerAd from '@/shared/components/ads/AdSenseBannerAd';

interface PublicPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function PublicPageLayout({ children, title, description }: PublicPageLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fcf9f8] font-['Plus_Jakarta_Sans']">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm border border-white/50">
              <span className="material-symbols-outlined text-[#5d5e64] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
            </div>
            <span className="text-xl font-bold text-[#1c1b1b] tracking-tight hidden sm:block">Dreamy Life</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {[
              { href: '/blog', label: 'Blog' },
              { href: '/about', label: 'About' },
              { href: '/faq', label: 'FAQ' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm font-semibold transition-colors ${
                  router.pathname.startsWith(item.href)
                    ? 'bg-[#1c1b1b] text-white'
                    : 'text-[#45474b] hover:bg-[#e5e2e1]/40'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* AdSense Banner */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
        <AdSenseBannerAd adSlot="3051399239" format="horizontal" showLabel={false} />
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e2e1]/40 bg-white/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-white/50">
                  <span className="material-symbols-outlined text-[#5d5e64] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                </div>
                <span className="text-lg font-bold text-[#1c1b1b]">Dreamy Life</span>
              </div>
              <p className="text-sm text-[#45474b] leading-relaxed">
                Your personal wellness and earning platform.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1c1b1b] mb-3">Explore</h4>
              <div className="space-y-2">
                <Link href="/blog" className="block text-sm text-[#45474b] hover:text-[#2d666d] transition-colors">Blog</Link>
                <Link href="/about" className="block text-sm text-[#45474b] hover:text-[#2d666d] transition-colors">About Us</Link>
                <Link href="/faq" className="block text-sm text-[#45474b] hover:text-[#2d666d] transition-colors">FAQ</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1c1b1b] mb-3">Legal</h4>
              <div className="space-y-2">
                <Link href="/privacy-policy" className="block text-sm text-[#45474b] hover:text-[#2d666d] transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block text-sm text-[#45474b] hover:text-[#2d666d] transition-colors">Terms of Service</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1c1b1b] mb-3">Account</h4>
              <div className="space-y-2">
                <Link href="/login" className="block text-sm text-[#45474b] hover:text-[#2d666d] transition-colors">Sign In</Link>
                <Link href="/register" className="block text-sm text-[#45474b] hover:text-[#2d666d] transition-colors">Sign Up</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-[#e5e2e1]/40 pt-6 text-center">
            <p className="text-sm text-[#76777b]">&copy; {new Date().getFullYear()} Dreamy Life. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
