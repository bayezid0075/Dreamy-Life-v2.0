'use client';

export default function Topbar() {
  return (
    <header className="h-16 bg-surface-container-lowest border-b border-outline/10 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-on-surface-variant">menu</span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center ml-2">
          <span className="material-symbols-outlined text-sm text-primary">person</span>
        </div>
      </div>
    </header>
  );
}
