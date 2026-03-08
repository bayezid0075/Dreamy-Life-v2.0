'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Wallet, ShoppingBag, Store } from 'lucide-react';

const leftItems = [
  { title: 'Home', href: '/dashboard', icon: Home },
  { title: 'Wallet', href: '/wallet', icon: Wallet },
];

const rightItems = [
  { title: 'Orders', href: '/orders', icon: ShoppingBag },
  { title: 'Profile', href: '/profile', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;
  const isResellingActive = isActive('/reseller');

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 overflow-visible"
      style={{
        background: 'var(--color-surface-1)',
        borderTop: '1px solid var(--color-border)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      }}
    >
      <div
        className="flex items-end px-2 overflow-visible"
        style={{
          height: '60px',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Left two items */}
        {leftItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 pb-2 active:scale-95 transition-transform"
          >
            <div
              className="p-1.5 rounded-xl"
              style={
                isActive(item.href)
                  ? { background: 'rgba(41,171,226,0.12)' }
                  : undefined
              }
            >
              <item.icon
                className="w-5 h-5"
                strokeWidth={isActive(item.href) ? 2.5 : 1.75}
                style={{
                  color: isActive(item.href)
                    ? 'var(--color-primary)'
                    : 'var(--color-text-3)',
                }}
              />
            </div>
            <span
              className="text-[9px] font-medium"
              style={{
                fontFamily: 'var(--font-mono)',
                color: isActive(item.href)
                  ? 'var(--color-primary)'
                  : 'var(--color-text-3)',
              }}
            >
              {item.title}
            </span>
          </Link>
        ))}

        {/* Center — Reselling elevated FAB */}
        <div className="flex flex-col items-center flex-1 relative overflow-visible" style={{ paddingBottom: '6px' }}>
          {/* Cutout circle — sits on the bar surface behind the FAB */}
          <div
            className="absolute rounded-full"
            style={{
              width: '68px',
              height: '68px',
              top: '-32px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
            }}
          />
          {/* Colored FAB — protrudes well above the bar */}
          <Link
            href="/reseller"
            className="absolute active:scale-90 transition-transform z-10"
            style={{ top: '-40px', left: '50%', transform: 'translateX(-50%)' }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: '58px',
                height: '58px',
                background: 'linear-gradient(135deg, #F97316 0%, #EF4444 50%, #EC4899 100%)',
                boxShadow: isResellingActive
                  ? '0 8px 28px rgba(239,68,68,0.60)'
                  : '0 6px 20px rgba(239,68,68,0.42)',
                border: '3px solid var(--color-surface-1)',
              }}
            >
              <Store className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
          </Link>
          <span
            className="text-[9px] font-medium mt-auto"
            style={{
              fontFamily: 'var(--font-mono)',
              color: isResellingActive ? '#EF4444' : 'var(--color-text-3)',
            }}
          >
            Reselling
          </span>
        </div>

        {/* Right two items */}
        {rightItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 pb-2 active:scale-95 transition-transform"
          >
            <div
              className="p-1.5 rounded-xl"
              style={
                isActive(item.href)
                  ? { background: 'rgba(41,171,226,0.12)' }
                  : undefined
              }
            >
              <item.icon
                className="w-5 h-5"
                strokeWidth={isActive(item.href) ? 2.5 : 1.75}
                style={{
                  color: isActive(item.href)
                    ? 'var(--color-primary)'
                    : 'var(--color-text-3)',
                }}
              />
            </div>
            <span
              className="text-[9px] font-medium"
              style={{
                fontFamily: 'var(--font-mono)',
                color: isActive(item.href)
                  ? 'var(--color-primary)'
                  : 'var(--color-text-3)',
              }}
            >
              {item.title}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
