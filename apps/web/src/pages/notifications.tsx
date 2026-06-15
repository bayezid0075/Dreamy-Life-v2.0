import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: string;
  iconStyle?: string;
  iconBg: string;
  iconColor: string;
  unread: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'Order Confirmed',
    message: 'Your dreamy sleep set has been packaged and is ready to ship.',
    time: '2m',
    icon: 'local_shipping',
    iconStyle: "'FILL' 1",
    iconBg: '#e9fdff',
    iconColor: '#437b81',
    unread: true,
  },
  {
    id: '2',
    title: 'New Message',
    message: 'Support replied to your inquiry regarding the Silk Pillowcase sizing options.',
    time: '1h',
    icon: 'chat_bubble',
    iconStyle: "'FILL' 1",
    iconBg: '#ffd1dc',
    iconColor: '#7a5761',
    unread: true,
  },
  {
    id: '3',
    title: 'Flash Sale Ending Soon',
    message: 'Only 2 hours left to get 20% off the Ethereal Comfort Collection.',
    time: 'Yesterday',
    icon: 'percent',
    iconStyle: "'FILL' 1",
    iconBg: '#ffdad6',
    iconColor: '#93000a',
    unread: true,
  },
  {
    id: '4',
    title: 'Leave a Review',
    message: 'How are you enjoying your recent purchase? Leave a review.',
    time: 'Oct 12',
    icon: 'star',
    iconBg: '#e5e2e1',
    iconColor: '#45474b',
    unread: false,
  },
  {
    id: '5',
    title: 'Profile Updated',
    message: 'Your shipping address has been successfully updated in your profile.',
    time: 'Oct 05',
    icon: 'account_circle',
    iconBg: '#e5e2e1',
    iconColor: '#45474b',
    unread: false,
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.replace('/login');
      return;
    }
    setLoading(false);
  }, [isAuthenticated, accessToken, router]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleClearAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f8ff' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dreamy Life - Notifications</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        body {
          min-height: max(884px, 100dvh);
        }
        .aurora-bg {
          background-color: #F8F8FF;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          overflow: hidden;
        }
        .aurora-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          animation: float 20s infinite ease-in-out alternate;
        }
        .orb-1 {
          width: 600px;
          height: 600px;
          background: rgba(226, 226, 233, 0.6);
          top: -100px;
          left: -200px;
        }
        .orb-2 {
          width: 500px;
          height: 500px;
          background: rgba(179, 236, 243, 0.4);
          bottom: -50px;
          right: -100px;
          animation-delay: -5s;
        }
        .orb-3 {
          width: 400px;
          height: 400px;
          background: rgba(255, 217, 226, 0.5);
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -10s;
        }
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 30px) scale(1.1); }
          100% { transform: translate(-30px, 50px) scale(0.9); }
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04);
        }
      `}</style>

      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-orb orb-1"></div>
        <div className="aurora-orb orb-2"></div>
        <div className="aurora-orb orb-3"></div>
      </div>

      {/* Top Navigation - Desktop */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-[30px] border-b border-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.06)] px-6 py-4 hidden md:flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors text-[#45474b]"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
        <div className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">
          Notifications
        </div>
        <div className="w-10"></div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex justify-between items-center px-6 py-5 sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/30">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-white/40 shadow-sm text-[#45474b]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-extrabold tracking-tight text-[#1c1b1b]">Notifications</h1>
        <div className="w-10"></div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-20 md:pt-28 pb-10 md:pb-20 px-6 max-w-[1280px] mx-auto min-h-screen flex flex-col">
        {/* Header Actions */}
        <div className="flex justify-between items-end mb-8 w-full max-w-2xl mx-auto">
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#45474b' }}>
            You have {unreadCount} unread messages.
          </p>
          <button
            onClick={handleClearAll}
            className="uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#2d666d' }}
          >
            Clear All
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`glass-panel rounded-lg p-4 flex items-center gap-4 relative overflow-hidden group hover:bg-white/20 transition-all duration-300 ${
                !n.unread ? 'opacity-70' : ''
              }`}
            >
              {/* Unread Indicator */}
              {n.unread && (
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: '#2d666d' }}></div>
              )}

              {/* Icon */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: n.iconBg, color: n.iconColor }}
              >
                <span
                  className="material-symbols-outlined"
                  style={n.iconStyle ? { fontVariationSettings: n.iconStyle } : undefined}
                >
                  {n.icon}
                </span>
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="font-bold truncate" style={{ color: '#1c1b1b' }}>
                    {n.title}
                  </h2>
                  <span
                    className="flex-shrink-0 ml-2"
                    style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', color: '#76777b' }}
                  >
                    {n.time}
                  </span>
                </div>
                <p
                  className="line-clamp-1 text-sm"
                  style={{ color: '#45474b' }}
                >
                  {n.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
