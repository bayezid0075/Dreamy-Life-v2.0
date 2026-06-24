import { useRouter } from 'next/router';

interface DesktopHeaderProps {
  title: string;
  onMenuClick: () => void;
  avatarUrl?: string;
  unreadNotifCount?: number;
  onSearchClick?: () => void;
}

export default function DesktopHeader({ title, onMenuClick, avatarUrl, unreadNotifCount = 0, onSearchClick }: DesktopHeaderProps) {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-[30px] border-b border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.06)] px-6 py-4 hidden md:flex justify-between items-center">
      {/* Left: Hamburger Menu */}
      <button
        onClick={onMenuClick}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b] hover:bg-white/60 transition-colors"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Center: Title */}
      <div className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">
        {title}
      </div>

      {/* Right: Search, Notification, Profile Pic */}
      <div className="flex items-center gap-3">
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b]"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
        )}
        <button
          onClick={() => router.push('/notifications')}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b] relative"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#ba1a1a] text-white text-[11px] font-bold flex items-center justify-center">
              {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
            </span>
          )}
        </button>
        <button
          onClick={() => router.push('/profile')}
          className="w-10 h-10 rounded-full bg-[#e5e2e1] overflow-hidden border border-white/50 hover:ring-2 hover:ring-[#e5e2e1] transition-all cursor-pointer"
        >
          {avatarUrl ? (
            <img alt="User Avatar" className="w-full h-full object-cover" src={avatarUrl} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[#5d5e64]">person</span>
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
