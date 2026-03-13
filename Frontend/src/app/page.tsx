"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  Users,
  Crown,
  Store,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  Star,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BrandLogo } from "@/components/layout/brand-logo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <BrandLogo
              size={40}
              className="shadow-lg shadow-fuchsia-500/30 group-hover:shadow-fuchsia-500/50 transition-transform group-hover:scale-105"
            />
            <span className="font-bold text-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Dreamy Life
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/shop" className="text-sm font-medium hover:text-fuchsia-600 transition-colors hidden sm:block">
              Shop
            </Link>
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/30">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-600 shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 border-0">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Vibrant Gradient */}
      <section className="relative pt-16 min-h-screen flex items-center">
        {/* Multi-layer Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-500"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 via-transparent to-amber-500/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent"></div>

          {/* Animated Mesh Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.1)_2px,transparent_2px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
          </div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-96 h-96 bg-gradient-to-br from-yellow-400/40 to-orange-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-[5%] w-[500px] h-[500px] bg-gradient-to-br from-cyan-400/30 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/30 to-rose-500/20 rounded-full blur-3xl animate-pulse delay-500" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-teal-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto text-center text-white">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 mb-8 shadow-xl">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-white/50"></div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 ring-2 ring-white/50"></div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 ring-2 ring-white/50"></div>
              </div>
              <span className="text-sm font-medium ml-1">Join 10,000+ members worldwide</span>
              <Sparkles className="h-4 w-4 text-yellow-300" />
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1] tracking-tight">
              Build Your{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-yellow-200 via-amber-200 to-orange-200 bg-clip-text text-transparent">Dream</span>
                <span className="absolute bottom-2 md:bottom-4 left-0 right-0 h-3 md:h-4 bg-yellow-400/40 -rotate-1 rounded"></span>
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-200 via-teal-200 to-emerald-200 bg-clip-text text-transparent">
                Life Today
              </span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              Your all-in-one platform for referral rewards, memberships, and e-commerce.
              <span className="text-yellow-200 font-medium"> Grow your network, </span>
              <span className="text-cyan-200 font-medium">earn commissions, </span>
              and shop premium products.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/register">
                <Button size="lg" className="gap-2 w-full sm:w-auto bg-white text-fuchsia-700 hover:bg-white/90 shadow-2xl shadow-black/20 font-bold text-lg h-14 px-10 rounded-2xl hover:scale-105 transition-all">
                  Get Started Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/shop">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 w-full sm:w-auto bg-white/10 border-2 border-white/40 text-white hover:bg-white/20 backdrop-blur-sm h-14 px-10 rounded-2xl hover:scale-105 transition-all"
                >
                  <ShoppingBag className="h-5 w-5" /> Explore Shop
                </Button>
              </Link>
            </div>

            {/* Floating Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl hover:bg-white/15 transition-all hover:scale-105 hover:-translate-y-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-orange-500/30">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="text-4xl font-bold mb-1">10K+</div>
                <div className="text-sm text-white/70">Active Members</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl hover:bg-white/15 transition-all hover:scale-105 hover:-translate-y-2 md:-translate-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-teal-500/30">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div className="text-4xl font-bold mb-1">৳50M+</div>
                <div className="text-sm text-white/70">Commissions Paid</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl hover:bg-white/15 transition-all hover:scale-105 hover:-translate-y-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-purple-500/30">
                  <ShoppingBag className="h-7 w-7 text-white" />
                </div>
                <div className="text-4xl font-bold mb-1">1000+</div>
                <div className="text-sm text-white/70">Products</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" className="fill-background"/>
          </svg>
        </div>
      </section>

      {/* Features Section - Colorful Cards */}
      <section className="py-24 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-900/40 dark:to-fuchsia-900/40 text-violet-700 dark:text-violet-300 mb-6 shadow-lg">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-semibold">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Succeed</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our platform provides all the tools you need to build your network and grow your income
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Users}
              title="Referral Network"
              description="Build your network up to 10 levels deep and earn commissions on every tier."
              gradient="from-violet-500 via-purple-500 to-indigo-600"
              iconGradient="from-violet-400 to-purple-600"
            />
            <FeatureCard
              icon={Crown}
              title="Membership Tiers"
              description="Unlock exclusive benefits with our Basic, Standard, Smart, and VVIP memberships."
              gradient="from-amber-500 via-orange-500 to-red-500"
              iconGradient="from-amber-400 to-orange-600"
            />
            <FeatureCard
              icon={ShoppingBag}
              title="E-Commerce"
              description="Shop from our curated products or become a vendor and sell your own."
              gradient="from-emerald-500 via-teal-500 to-cyan-600"
              iconGradient="from-emerald-400 to-teal-600"
            />
            <FeatureCard
              icon={Store}
              title="Vendor Platform"
              description="Launch your own shop, manage products, and reach thousands of customers."
              gradient="from-pink-500 via-rose-500 to-red-500"
              iconGradient="from-pink-400 to-rose-600"
            />
          </div>
        </div>
      </section>

      {/* How It Works - Gradient Background */}
      <section className="py-24 relative overflow-hidden">
        {/* Multi-color Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/30 via-transparent to-amber-500/20"></div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl"></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16 text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              How It <span className="text-yellow-300">Works</span>
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Get started in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard
              number="01"
              title="Create Account"
              description="Sign up for free and set up your profile in minutes"
              color="from-yellow-400 to-orange-500"
            />
            <StepCard
              number="02"
              title="Choose Membership"
              description="Select a plan that matches your goals and unlock benefits"
              color="from-cyan-400 to-blue-500"
            />
            <StepCard
              number="03"
              title="Start Earning"
              description="Share your referral code and earn commissions"
              color="from-emerald-400 to-teal-500"
            />
          </div>
        </div>
      </section>

      {/* Membership Plans Section */}
      <section className="py-24 bg-gradient-to-b from-background via-violet-50/50 to-background dark:from-background dark:via-violet-950/20 dark:to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-700 dark:text-amber-300 mb-6 shadow-lg">
              <Crown className="h-4 w-4" />
              <span className="text-sm font-semibold">Membership Plans</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Choose Your{' '}
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">Plan</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Invest in yourself and unlock unlimited earning potential
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <MembershipCard
              name="Basic"
              price="999"
              gradient="from-slate-600 via-slate-500 to-zinc-600"
              features={['Commission up to Level 3', 'Standard support', 'Basic features', 'Email notifications']}
            />
            <MembershipCard
              name="Standard"
              price="2,999"
              gradient="from-blue-600 via-cyan-500 to-teal-500"
              features={['Commission up to Level 5', 'Priority support', 'Exclusive deals', 'SMS notifications']}
            />
            <MembershipCard
              name="Smart"
              price="4,999"
              gradient="from-violet-600 via-fuchsia-500 to-pink-500"
              features={['Commission up to Level 7', 'Premium support', 'Early access', 'Personal dashboard']}
              popular
            />
            <MembershipCard
              name="VVIP"
              price="9,999"
              gradient="from-amber-500 via-orange-500 to-red-500"
              features={['Commission up to Level 10', 'VIP support 24/7', 'Maximum rewards', 'Account manager']}
            />
          </div>
        </div>
      </section>

      {/* Trust Section - Modern Glass Cards */}
      <section className="py-24 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/40 via-transparent to-purple-500/30"></div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Trusted by <span className="text-yellow-300">Thousands</span>
            </h2>
            <p className="text-xl text-white/80 mb-16 max-w-2xl mx-auto">
              Join our growing community of successful members who are building their dream lifestyle every day.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl hover:bg-white/20 transition-all hover:scale-105 hover:-translate-y-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Secure Payments</h3>
                <p className="text-white/70">All transactions are protected with bank-level security</p>
              </div>
              <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl hover:bg-white/20 transition-all hover:scale-105 hover:-translate-y-2 md:-translate-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Instant Payouts</h3>
                <p className="text-white/70">Get your commissions directly to your wallet instantly</p>
              </div>
              <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl hover:bg-white/20 transition-all hover:scale-105 hover:-translate-y-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">24/7 Support</h3>
                <p className="text-white/70">Our team is always here to help you succeed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto relative">
            {/* Gradient Card Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 rounded-[40px] shadow-2xl shadow-fuchsia-500/30"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-amber-500/20 via-transparent to-cyan-500/20 rounded-[40px]"></div>

            {/* Decorative Orbs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/30 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-400/30 rounded-full blur-2xl"></div>

            {/* Content */}
            <div className="relative text-center text-white p-12 md:p-16">
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Join thousands of members who are already building their dream lifestyle with us.
                Sign up now and get started for free!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-fuchsia-700 hover:bg-white/90 shadow-2xl shadow-black/20 font-bold h-14 px-10 text-lg rounded-2xl hover:scale-105 transition-all">
                    Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="bg-white/10 border-2 border-white/40 text-white hover:bg-white/20 h-14 px-10 text-lg rounded-2xl hover:scale-105 transition-all">
                    Sign In <ChevronRight className="ml-1 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <div className="container mx-auto px-4 relative">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
            <div className="flex items-center gap-2 mb-6">
              <BrandLogo size={48} className="shadow-lg shadow-fuchsia-500/30" />
                <span className="font-bold text-2xl">Dreamy Life</span>
              </div>
              <p className="text-slate-400 mb-6">
                Your all-in-one platform for building a successful lifestyle business.
              </p>
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg shadow-blue-500/20">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg shadow-cyan-500/20">
                  <span className="text-sm font-bold">t</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg shadow-pink-500/20">
                  <span className="text-sm font-bold">in</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg text-white">Quick Links</h4>
              <ul className="space-y-4 text-slate-400">
                <li>
                  <Link href="/shop" className="hover:text-fuchsia-400 transition-colors flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" /> Shop
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-fuchsia-400 transition-colors flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" /> Register
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-fuchsia-400 transition-colors flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" /> Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg text-white">Memberships</h4>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-gradient-to-r from-slate-400 to-slate-500 shadow"></span>Basic
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 shadow"></span>Standard
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 shadow"></span>Smart
                </li>
                <li className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow"></span>VVIP
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-lg text-white">Support</h4>
              <p className="text-slate-400 mb-6">
                Need help? Our support team is available 24/7 to assist you.
              </p>
              <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-fuchsia-500/20">
                Contact Support
              </Button>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-500">
            <p>&copy; {new Date().getFullYear()} Dreamy Life. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  iconGradient,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  iconGradient: string;
}) {
  return (
    <div className="group relative">
      {/* Gradient Background on Hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl scale-90 group-hover:scale-100`}></div>

      <div className="relative p-8 rounded-3xl border border-violet-200/50 dark:border-violet-800/30 bg-white dark:bg-slate-900 group-hover:border-transparent transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${iconGradient} mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">{title}</h3>
        <p className="text-muted-foreground group-hover:text-white/80 transition-colors">{description}</p>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  color,
}: {
  number: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl hover:bg-white/20 transition-all hover:scale-105 hover:-translate-y-2">
      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center font-bold text-2xl mb-6 mx-auto shadow-xl text-white group-hover:scale-110 transition-transform`}>
        {number}
      </div>
      <h3 className="text-2xl font-bold mb-3 text-white text-center">{title}</h3>
      <p className="text-white/70 text-center">{description}</p>
    </div>
  );
}

function MembershipCard({
  name,
  price,
  gradient,
  features,
  popular,
}: {
  name: string;
  price: string;
  gradient: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div className={`relative group`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-fuchsia-500/30">
            Most Popular
          </span>
        </div>
      )}

      <div className={`h-full p-8 rounded-3xl border-2 ${popular ? 'border-fuchsia-500 bg-gradient-to-b from-fuchsia-50 to-violet-50 dark:from-fuchsia-950/30 dark:to-violet-950/30' : 'border-violet-200/50 dark:border-violet-800/30 bg-white dark:bg-slate-900'} transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl`}>
        {/* Header Badge */}
        <div className={`inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r ${gradient} px-5 py-2.5 text-white font-bold mb-6 shadow-lg`}>
          <Crown className="h-5 w-5" />
          {name}
        </div>

        {/* Price */}
        <div className="mb-6">
          <span className={`text-5xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>৳{price}</span>
          <span className="text-muted-foreground text-sm"> /one-time</span>
        </div>

        {/* Features */}
        <ul className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3 text-sm">
              <div className={`h-6 w-6 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center shadow`}>
                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <Link href="/register" className="block">
          <Button
            className={`w-full h-12 rounded-xl font-bold ${popular ? `bg-gradient-to-r ${gradient} hover:opacity-90 shadow-lg shadow-fuchsia-500/30` : ''}`}
            variant={popular ? 'default' : 'outline'}
          >
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  );
}
