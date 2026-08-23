import Head from 'next/head';
import { useState } from 'react';
import PublicPageLayout from '@/shared/components/PublicPageLayout';

const faqData = [
  {
    category: 'Getting Started',
    items: [
      { q: 'What is Dreamy Life?', a: 'Dreamy Life is a digital wellness and earning platform for Bangladesh, combining a marketplace, social feed, cloud storage, and earning opportunities in one app.' },
      { q: 'How do I create an account?', a: 'Tap Sign Up, enter your email or phone number, set a password, and verify your account. It takes less than a minute.' },
      { q: 'Is Dreamy Life free to use?', a: 'Yes! Creating an account and using core features is completely free. Some premium features may require a membership.' },
    ],
  },
  {
    category: 'Account & Verification',
    items: [
      { q: 'How do I verify my account?', a: 'Go to Settings > Verification and follow the on-screen instructions. You may need to submit a valid ID.' },
      { q: 'I forgot my password. What do I do?', a: 'Tap Forgot Password on the login screen, enter your email or phone, and follow the reset link sent to you.' },
      { q: 'Can I change my email or phone number?', a: 'Yes. Go to Settings > Profile and update your contact information. You will need to verify the new one.' },
    ],
  },
  {
    category: 'Wallet & Payments',
    items: [
      { q: 'How does the wallet work?', a: 'Your wallet stores your earnings and balance. You can use it to make purchases, send money, or withdraw funds.' },
      { q: 'How do I withdraw money?', a: 'Go to Wallet > Withdraw, enter the amount, and choose your preferred withdrawal method. Processing takes 1-3 business days.' },
      { q: 'What payment methods are supported?', a: 'We support bKash, Nagad, Rocket, and bank transfers for deposits and withdrawals in Bangladesh.' },
    ],
  },
  {
    category: 'Marketplace',
    items: [
      { q: 'How do I start selling?', a: 'Apply as a vendor from your profile, get approved, and then list your products from the Vendor Dashboard.' },
      { q: 'Is there a fee for selling?', a: 'Dreamy Life charges a small commission on each sale. There are no upfront fees or listing charges.' },
      { q: 'How do returns work?', a: 'Buyers can request a return within 7 days of delivery. Vendors must respond within 48 hours. Our support team mediates disputes.' },
    ],
  },
  {
    category: 'Referral Program',
    items: [
      { q: 'How does the referral program work?', a: 'Share your unique referral code with friends. When they sign up and complete their first task, you both earn rewards.' },
      { q: 'Is there a limit to referrals?', a: 'No limit! You can refer as many people as you want and earn rewards for each successful referral.' },
    ],
  },
  {
    category: 'Support',
    items: [
      { q: 'How do I contact support?', a: 'Email us at support@dreamy-life.com or use the in-app help center. We typically respond within 24 hours.' },
      { q: 'How do I report a problem?', a: 'Go to Settings > Help > Report a Problem, describe the issue, and our team will look into it promptly.' },
    ],
  },
];

function AccordionItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/30 transition-colors"
      >
        <span className="text-sm font-semibold text-[#1c1b1b] pr-4">{q}</span>
        <span className={`material-symbols-outlined text-[#45474b] text-xl transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      {isOpen && (
        <div className="px-5 pb-5">
          <p className="text-sm text-[#45474b] leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <Head>
        <title>FAQ - Dreamy Life</title>
        <meta name="description" content="Frequently asked questions about Dreamy Life - the digital wellness and earning platform for Bangladesh." />
      </Head>

      <PublicPageLayout title="FAQ - Dreamy Life" description="Frequently asked questions about Dreamy Life.">
        <div className="space-y-10">
          {/* Hero */}
          <section className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#2d666d]/10 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[#2d666d] text-3xl">help</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1c1b1b] mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-[#45474b] max-w-lg mx-auto">
              Find quick answers to the most common questions about Dreamy Life.
            </p>
          </section>

          {/* FAQ Sections */}
          {faqData.map((section) => (
            <section key={section.category}>
              <h2 className="text-xl font-bold text-[#1c1b1b] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2d666d] text-lg">category</span>
                {section.category}
              </h2>
              <div className="space-y-3">
                {section.items.map((item) => {
                  const key = `${section.category}-${item.q}`;
                  return (
                    <AccordionItem
                      key={key}
                      q={item.q}
                      a={item.a}
                      isOpen={!!openItems[key]}
                      onToggle={() => toggleItem(key)}
                    />
                  );
                })}
              </div>
            </section>
          ))}

          {/* Still need help */}
          <section className="bg-white/50 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-sm text-center">
            <span className="material-symbols-outlined text-[#2d666d] text-3xl mb-3">support_agent</span>
            <h2 className="text-xl font-bold text-[#1c1b1b] mb-2">Still have questions?</h2>
            <p className="text-[#45474b]">
              Contact us at{' '}
              <a href="mailto:support@dreamy-life.com" className="text-[#2d666d] font-semibold hover:underline">
                support@dreamy-life.com
              </a>
            </p>
          </section>
        </div>
      </PublicPageLayout>
    </>
  );
}
