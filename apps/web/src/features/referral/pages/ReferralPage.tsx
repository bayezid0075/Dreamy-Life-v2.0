import Head from 'next/head';

export default function ReferralPage() {
  return (
    <>
      <Head>
        <title>Dreamy Life - Referrals</title>
      </Head>
      <div className="min-h-screen bg-surface p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-on-surface mb-6">Referrals</h1>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/80 shadow-sm text-center">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-on-surface-variant">Referral system coming soon...</p>
          </div>
        </div>
      </div>
    </>
  );
}
