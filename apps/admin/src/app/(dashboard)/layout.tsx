import Sidebar from '@/shared/components/Sidebar';
import Topbar from '@/shared/components/Topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <Topbar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
