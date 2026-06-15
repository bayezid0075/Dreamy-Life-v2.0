'use client';

export default function PostList() {
  return (
    <div className="max-w-container-max mx-auto space-y-lg">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Content Moderation</h2>
        <p className="font-body-sm text-on-surface-variant mt-xs">Review and moderate user content</p>
      </div>

      <div className="glass-panel rounded-xl p-lg text-center">
        <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-4">shield</span>
        <h3 className="font-title-md text-title-md text-on-surface font-bold mb-2">No Pending Reports</h3>
        <p className="text-on-surface-variant">All content has been reviewed. Check back later.</p>
      </div>
    </div>
  );
}
