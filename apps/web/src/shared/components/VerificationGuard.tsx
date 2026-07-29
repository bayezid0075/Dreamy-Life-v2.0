import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import VerificationModal from './VerificationModal';

interface VerificationGuardProps {
  children: React.ReactNode;
}

export default function VerificationGuard({ children }: VerificationGuardProps) {
  const { accessToken } = useAuthStore();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${apiUrl}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.user) {
          const verified = data.data.user.isVerified;
          setIsVerified(verified);
          if (!verified) {
            setShowModal(true);
          }
        }
      })
      .catch(() => {});
  }, [accessToken]);

  if (isVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f8ff' }}>
        <div className="animate-spin h-10 w-10 border-2 border-[#5d5e64] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <VerificationModal isOpen={showModal} />
      {showModal && (
        <div className="pointer-events-none opacity-30">
          {children}
        </div>
      )}
      {!showModal && children}
    </>
  );
}
