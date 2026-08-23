import Head from 'next/head';
import PublicPageLayout from '@/shared/components/PublicPageLayout';

const features = [
  { icon: 'storefront', title: 'Marketplace', desc: 'Buy, sell, and resell digital and physical products with ease.' },
  { icon: 'dynamic_feed', title: 'Social Feed', desc: 'Connect, share moments, and engage with a vibrant community.' },
  { icon: 'cloud_upload', title: 'Drive Pack', desc: 'Secure cloud storage for your files, photos, and documents.' },
  { icon: 'sell', title: 'Reselling', desc: 'Start your reselling business with zero upfront investment.' },
];

const steps = [
  { icon: 'person_add', title: 'Sign Up', desc: 'Create your free account in seconds and complete your profile.' },
  { icon: 'explore', title: 'Explore & Earn', desc: 'Discover features, complete tasks, and start earning rewards.' },
  { icon: 'trending_up', title: 'Grow', desc: 'Build your network, grow your wallet, and unlock new opportunities.' },
];

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About - Dreamy Life</title>
        <meta name="description" content="Learn about Dreamy Life - the digital wellness and earning platform for Bangladesh." />
      </Head>

      <PublicPageLayout title="About - Dreamy Life" description="Learn about Dreamy Life - the digital wellness and earning platform for Bangladesh.">
        <div className="space-y-12">
          {/* Hero */}
          <section className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#2d666d]/10 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[#2d666d] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1c1b1b] mb-4">About Dreamy Life</h1>
            <p className="text-lg text-[#45474b] max-w-xl mx-auto leading-relaxed">
              Your personal wellness and earning platform, designed to empower your digital lifestyle in Bangladesh.
            </p>
          </section>

          {/* What is Dreamy Life */}
          <section className="bg-white/50 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#2d666d] text-2xl">info</span>
              <h2 className="text-2xl font-bold text-[#1c1b1b]">What is Dreamy Life?</h2>
            </div>
            <p className="text-[#45474b] leading-relaxed text-base">
              Dreamy Life is a comprehensive digital wellness and earning platform built for the people of Bangladesh.
              We combine a marketplace, social networking, cloud storage, and earning opportunities into one seamless
              experience. Whether you want to shop, sell, connect with friends, or earn money, Dreamy Life is your
              all-in-one digital companion.
            </p>
          </section>

          {/* Key Features */}
          <section>
            <h2 className="text-2xl font-bold text-[#1c1b1b] text-center mb-8">Key Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.title} className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-[#2d666d]/10 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[#2d666d] text-xl">{f.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1c1b1b] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#45474b] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Our Mission */}
          <section className="bg-white/50 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#2d666d] text-2xl">rocket_launch</span>
              <h2 className="text-2xl font-bold text-[#1c1b1b]">Our Mission</h2>
            </div>
            <p className="text-[#45474b] leading-relaxed text-base">
              To empower every individual in Bangladesh with the tools and opportunities they need to thrive in the
              digital world. We believe that everyone deserves access to a platform where they can connect, earn,
              and build a better digital life — all in one place.
            </p>
          </section>

          {/* How it Works */}
          <section>
            <h2 className="text-2xl font-bold text-[#1c1b1b] text-center mb-8">How it Works</h2>
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div key={s.title} className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#2d666d] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[#2d666d] text-lg">{s.icon}</span>
                      <h3 className="text-lg font-bold text-[#1c1b1b]">{s.title}</h3>
                    </div>
                    <p className="text-sm text-[#45474b] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="bg-white/50 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-sm text-center">
            <span className="material-symbols-outlined text-[#2d666d] text-3xl mb-3">mail</span>
            <h2 className="text-xl font-bold text-[#1c1b1b] mb-2">Need help?</h2>
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
