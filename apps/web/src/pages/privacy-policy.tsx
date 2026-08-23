import Head from 'next/head';
import PublicPageLayout from '@/shared/components/PublicPageLayout';

const sections = [
  {
    title: 'Information We Collect',
    content: `We collect information you provide directly, such as when you create an account, make a purchase, or contact us. This may include your name, email address, phone number, payment information, and profile details. We also collect usage data such as your browsing activity, device information, and IP address to improve our services.`,
  },
  {
    title: 'How We Use Information',
    content: `We use the information we collect to provide, maintain, and improve our services; process transactions and send related information; send technical notices and support messages; communicate with you about products, services, and promotions; and monitor and analyze trends and usage patterns.`,
  },
  {
    title: 'Information Sharing',
    content: `We do not sell your personal information. We may share information with vendors to fulfill orders, with service providers who assist in our operations, and when required by law or to protect our rights. We may also share aggregated or de-identified information that cannot reasonably be used to identify you.`,
  },
  {
    title: 'Data Security',
    content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: 'Cookies',
    content: `We use cookies and similar technologies to maintain your session, remember your preferences, and analyze usage patterns. You can control cookies through your browser settings, but disabling cookies may affect the functionality of certain features.`,
  },
  {
    title: 'User Rights',
    content: `You have the right to access, correct, or delete your personal information. You can update most information directly through your account settings. To request deletion of your account or data, please contact us at support@dreamy-life.com.`,
  },
  {
    title: "Children's Privacy",
    content: `Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.`,
  },
  {
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the effective date. Your continued use of our services after any changes constitutes acceptance of the updated policy.`,
  },
  {
    title: 'Contact Us',
    content: `If you have any questions about this Privacy Policy, please contact us at support@dreamy-life.com.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Dreamy Life</title>
        <meta name="description" content="Privacy Policy for Dreamy Life - learn how we collect, use, and protect your personal information." />
      </Head>

      <PublicPageLayout title="Privacy Policy - Dreamy Life" description="How we handle your data.">
        <div className="space-y-8">
          {/* Header */}
          <section className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#2d666d]/10 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[#2d666d] text-3xl">policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1c1b1b] mb-4">Privacy Policy</h1>
            <p className="text-sm text-[#45474b]">Effective date: January 1, 2026</p>
          </section>

          {/* Introduction */}
          <div className="bg-white/50 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-sm">
            <p className="text-[#45474b] leading-relaxed text-sm">
              At Dreamy Life, we value your privacy and are committed to protecting your personal information.
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform
              and services.
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
