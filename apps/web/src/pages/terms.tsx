import Head from 'next/head';
import PublicPageLayout from '@/shared/components/PublicPageLayout';

const sections = [
  {
    title: 'Acceptance of Terms',
    content: `By accessing or using Dreamy Life, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of any changes.`,
  },
  {
    title: 'User Accounts',
    content: `You must be at least 13 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating your account and to keep it up to date.`,
  },
  {
    title: 'Acceptable Use',
    content: `You agree not to use Dreamy Life to: post illegal, harmful, or offensive content; harass, threaten, or defame others; distribute spam or unauthorized advertisements; attempt to gain unauthorized access to other accounts or systems; interfere with the platform's functionality; or violate any applicable laws or regulations.`,
  },
  {
    title: 'Intellectual Property',
    content: `All content, trademarks, and intellectual property on Dreamy Life are owned by us or our licensors. You retain ownership of content you create and share on the platform, but you grant us a non-exclusive, worldwide license to use, display, and distribute your content in connection with our services.`,
  },
  {
    title: 'Marketplace Rules',
    content: `Vendors are responsible for the accuracy of their product listings, fulfilling orders promptly, and handling returns fairly. Dreamy Life acts as a marketplace facilitator and is not a party to transactions between buyers and vendors. We reserve the right to remove listings and suspend vendors who violate our marketplace policies.`,
  },
  {
    title: 'Payments & Wallet',
    content: `All transactions are processed through our secure payment system. Wallet balances are non-transferable between accounts except through supported peer-to-peer transfer features. Dreamy Life reserves the right to hold or reverse transactions that appear fraudulent or violate our terms. Withdrawal requests are subject to verification and processing times.`,
  },
  {
    title: 'Limitation of Liability',
    content: `Dreamy Life is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform. Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim.`,
  },
  {
    title: 'Termination',
    content: `We may suspend or terminate your account at any time for violation of these terms or for any other reason at our discretion. You may also delete your account at any time through your account settings. Upon termination, your right to use the platform ceases immediately, though certain provisions of these terms survive termination.`,
  },
  {
    title: 'Changes to Terms',
    content: `We may update these Terms of Service from time to time. We will notify you of material changes by posting the updated terms on this page and, where appropriate, by email. Your continued use after changes are posted constitutes acceptance of the revised terms.`,
  },
  {
    title: 'Contact',
    content: `If you have any questions about these Terms of Service, please contact us at support@dreamy-life.com.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service - Dreamy Life</title>
        <meta name="description" content="Terms of Service for Dreamy Life - the rules and guidelines governing use of our platform." />
      </Head>

      <PublicPageLayout title="Terms of Service - Dreamy Life" description="Rules and guidelines for using Dreamy Life.">
        <div className="space-y-8">
          {/* Header */}
          <section className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#2d666d]/10 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[#2d666d] text-3xl">gavel</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1c1b1b] mb-4">Terms of Service</h1>
            <p className="text-sm text-[#45474b]">Effective date: January 1, 2026</p>
          </section>

          {/* Introduction */}
          <div className="bg-white/50 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-sm">
            <p className="text-[#45474b] leading-relaxed text-sm">
              Welcome to Dreamy Life. These Terms of Service govern your use of our platform and services.
              Please read them carefully before using Dreamy Life.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.title} className="bg-white/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/60 shadow-sm">
                <h2 className="text-lg font-bold text-[#1c1b1b] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2d666d] text-lg">chevron_right</span>
                  {section.title}
                </h2>
                <p className="text-sm text-[#45474b] leading-relaxed pl-7">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <section className="bg-white/50 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-sm text-center">
            <span className="material-symbols-outlined text-[#2d666d] text-3xl mb-3">mail</span>
            <h2 className="text-xl font-bold text-[#1c1b1b] mb-2">Questions?</h2>
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
