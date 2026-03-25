'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Users,
  Copy,
  CheckCircle,
  Share2,
  UserPlus,
  Link as LinkIcon,
  ChevronLeft,
  TrendingUp,
  Crown,
  Phone,
  BadgeCheck,
  XCircle,
  User,
  Network,
  Layers,
  Activity,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { useAuthStore } from '@/store';
import { usersApi } from '@/lib/api';
import type { Downline, LevelStats } from '@/types';

// Level colors for the graph
const levelColors = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-cyan-500 to-blue-600',
  'from-teal-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-green-500 to-emerald-600',
  'from-lime-500 to-green-600',
  'from-yellow-500 to-lime-600',
  'from-amber-500 to-yellow-600',
  'from-orange-500 to-amber-600',
];

const levelBgColors = [
  'bg-violet-500/10 border-violet-500/30',
  'bg-blue-500/10 border-blue-500/30',
  'bg-cyan-500/10 border-cyan-500/30',
  'bg-teal-500/10 border-teal-500/30',
  'bg-emerald-500/10 border-emerald-500/30',
  'bg-green-500/10 border-green-500/30',
  'bg-lime-500/10 border-lime-500/30',
  'bg-yellow-500/10 border-yellow-500/30',
  'bg-amber-500/10 border-amber-500/30',
  'bg-orange-500/10 border-orange-500/30',
];

// Referral Card Component
function ReferralCard({ downline }: { downline: Downline }) {
  const [copiedCode, setCopiedCode] = useState(false);

  const copyReferCode = async () => {
    await navigator.clipboard.writeText(downline.own_refercode);
    setCopiedCode(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="group bg-white dark:bg-slate-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-violet-100 dark:border-violet-900/30 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-violet-100 dark:ring-violet-900/50">
            <AvatarImage src={downline.profile_picture || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-bold">
              {downline.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {downline.is_verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
              <BadgeCheck className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate">
              {downline.username}
            </h4>
            <Badge
              className={`text-[10px] sm:text-xs px-1.5 py-0 ${
                downline.is_verified
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
              }`}
            >
              {downline.is_verified ? 'Verified' : 'Unverified'}
            </Badge>
            {downline.member_status !== 'user' && (
              <Badge className="text-[10px] sm:text-xs px-1.5 py-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                <Crown className="h-2.5 w-2.5 mr-0.5" />
                {downline.member_status}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              <span className="truncate">{downline.phone_number || 'No phone'}</span>
            </div>
            <div
              className="flex items-center gap-1.5 cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              onClick={copyReferCode}
            >
              <span className="text-slate-400">Code:</span>
              <span className="font-mono font-medium text-violet-600 dark:text-violet-400">
                {downline.own_refercode}
              </span>
              {copiedCode ? (
                <CheckCircle className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </div>

          {downline.joined_at && (
            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1.5">
              Joined {new Date(downline.joined_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Level Badge */}
        <Badge
          className={`shrink-0 bg-gradient-to-r ${levelColors[(downline.level - 1) % 10]} text-white border-0 text-xs px-2 py-0.5`}
        >
          L{downline.level}
        </Badge>
      </div>
    </div>
  );
}

// Level Graph Bar Component
function LevelGraphBar({
  level,
  count,
  maxCount,
  verified,
  unverified,
}: {
  level: number;
  count: number;
  maxCount: number;
  verified: number;
  unverified: number;
}) {
  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const verifiedPercentage = count > 0 ? (verified / count) * 100 : 0;

  return (
    <div className="group relative">
      <div className="flex items-center gap-2 sm:gap-3 mb-1">
        <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 w-8 sm:w-10">
          L{level}
        </span>
        <div className="flex-1 h-6 sm:h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
          {/* Background bar */}
          <div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${levelColors[(level - 1) % 10]} transition-all duration-500 rounded-lg`}
            style={{ width: `${percentage}%` }}
          >
            {/* Verified portion */}
            <div
              className="absolute inset-y-0 left-0 bg-white/20"
              style={{ width: `${verifiedPercentage}%` }}
            />
            {/* Animated shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
          {/* Count label */}
          <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-3">
            <span className="text-[10px] sm:text-xs font-bold text-white drop-shadow-sm">
              {count > 0 ? count : ''}
            </span>
            {count > 0 && (
              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
                {verified}V / {unverified}U
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReferralsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: downlines, isLoading } = useQuery({
    queryKey: ['downlines'],
    queryFn: usersApi.getDownlines,
  });

  const referralCode = user?.own_refercode || '';
  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/signup?ref=${referralCode}`
      : '';

  const copyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Dreamy Life',
          text: `Join Dreamy Life using my referral code: ${referralCode}`,
          url: referralLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyLink();
    }
  };

  // Compute statistics
  const stats = useMemo(() => {
    const allDownlines = downlines?.downlines || [];
    const total = allDownlines.length;
    const direct = allDownlines.filter((d) => d.level === 1).length;
    const verified = allDownlines.filter((d) => d.is_verified).length;
    const unverified = total - verified;
    const maxLevel = Math.max(...allDownlines.map((d) => d.level), 0);

    // Level stats for graph (1-10)
    const levelStats: LevelStats[] = [];
    for (let i = 1; i <= 10; i++) {
      const levelMembers = allDownlines.filter((d) => d.level === i);
      levelStats.push({
        level: i,
        count: levelMembers.length,
        verified: levelMembers.filter((d) => d.is_verified).length,
        unverified: levelMembers.filter((d) => !d.is_verified).length,
      });
    }

    // Recent referrals (sorted by join date)
    const recent = [...allDownlines]
      .filter((d) => d.joined_at)
      .sort((a, b) => new Date(b.joined_at!).getTime() - new Date(a.joined_at!).getTime())
      .slice(0, 10);

    const recentVerified = recent.filter((d) => d.is_verified);
    const recentUnverified = recent.filter((d) => !d.is_verified);

    // Group by level for accordion
    const byLevel: Record<number, Downline[]> = {};
    allDownlines.forEach((d) => {
      if (!byLevel[d.level]) byLevel[d.level] = [];
      byLevel[d.level].push(d);
    });

    return {
      total,
      direct,
      verified,
      unverified,
      maxLevel,
      levelStats,
      recent,
      recentVerified,
      recentUnverified,
      byLevel,
    };
  }, [downlines]);

  const maxLevelCount = Math.max(...stats.levelStats.map((l) => l.count), 1);

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 md:px-0 md:py-0 space-y-4 sm:space-y-5 md:space-y-6 pb-4 md:pb-0">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-800/50 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all active:scale-95"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 bg-clip-text text-transparent">
            Referral Network
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5">
            Grow your network and earn commissions
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {/* Total Referrals */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 opacity-90" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:16px_16px] opacity-30" />
          <CardContent className="relative p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Network className="h-4 w-4 sm:h-5 sm:w-5 opacity-70" />
            </div>
            {isLoading ? (
              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 bg-white/20" />
            ) : (
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.total}</div>
            )}
            <p className="text-[10px] sm:text-xs text-white/70">Total Referrals</p>
          </CardContent>
        </Card>

        {/* Direct Referrals */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 opacity-90" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:16px_16px] opacity-30" />
          <CardContent className="relative p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 opacity-70" />
            </div>
            {isLoading ? (
              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 bg-white/20" />
            ) : (
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.direct}</div>
            )}
            <p className="text-[10px] sm:text-xs text-white/70">Direct (L1)</p>
          </CardContent>
        </Card>

        {/* Verified */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 opacity-90" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:16px_16px] opacity-30" />
          <CardContent className="relative p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5 opacity-70" />
            </div>
            {isLoading ? (
              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 bg-white/20" />
            ) : (
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.verified}</div>
            )}
            <p className="text-[10px] sm:text-xs text-white/70">Verified</p>
          </CardContent>
        </Card>

        {/* Network Depth */}
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 opacity-90" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:16px_16px] opacity-30" />
          <CardContent className="relative p-3 sm:p-4 text-white">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <Layers className="h-4 w-4 sm:h-5 sm:w-5 opacity-70" />
            </div>
            {isLoading ? (
              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 bg-white/20" />
            ) : (
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                {stats.maxLevel > 0 ? `L${stats.maxLevel}` : '-'}
              </div>
            )}
            <p className="text-[10px] sm:text-xs text-white/70">Max Depth</p>
          </CardContent>
        </Card>
      </div>

      {/* Share Referral */}
      <Card className="relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent flex items-center gap-2">
            <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
            Share Your Referral
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs md:text-sm">
            Share your code or link to invite new members
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">Referral Code</label>
              <div className="flex gap-2">
                <Input
                  value={referralCode}
                  readOnly
                  className="font-mono text-sm sm:text-lg font-bold text-violet-600 dark:text-violet-400 h-9 sm:h-10"
                />
                <Button variant="outline" size="icon" onClick={copyCode} className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">Referral Link</label>
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="text-xs sm:text-sm h-9 sm:h-10" />
                <Button variant="outline" size="icon" onClick={copyLink} className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                  {copiedLink ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="icon" onClick={shareLink} className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Graph */}
      <Card className="relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            Network Distribution (10 Levels)
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs md:text-sm">
            Referrals by level with verification status
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-1 sm:space-y-2">
              {stats.levelStats.map((level) => (
                <LevelGraphBar
                  key={level.level}
                  level={level.level}
                  count={level.count}
                  maxCount={maxLevelCount}
                  verified={level.verified}
                  unverified={level.unverified}
                />
              ))}
            </div>
          )}
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gradient-to-r from-violet-500 to-purple-500" />
              <span className="text-[10px] sm:text-xs text-slate-500">Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white/50 border border-slate-300" />
              <span className="text-[10px] sm:text-xs text-slate-500">Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs text-slate-400">V = Verified, U = Unverified</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals with Tabs */}
      <Card className="relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
            Recent Referrals
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs md:text-sm">
            Latest members who joined your network
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <Tabs defaultValue="all">
            <TabsList className="mb-3 sm:mb-4 bg-violet-100/50 dark:bg-violet-900/20 p-1 sm:p-1 rounded-lg sm:rounded-xl w-full grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-0 h-auto min-h-0">
              <TabsTrigger
                value="all"
                className="rounded-md sm:rounded-lg px-3 py-2.5 sm:px-3 sm:py-2 text-xs sm:text-xs md:text-sm font-medium whitespace-normal sm:whitespace-nowrap justify-center text-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 sm:mr-1.5" />
                <span className="leading-tight">All ({stats.recent.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="verified"
                className="rounded-md sm:rounded-lg px-3 py-2.5 sm:px-3 sm:py-2 text-xs sm:text-xs md:text-sm font-medium whitespace-normal sm:whitespace-nowrap justify-center text-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 sm:mr-1.5" />
                <span className="leading-tight">Verified ({stats.recentVerified.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="unverified"
                className="rounded-md sm:rounded-lg px-3 py-2.5 sm:px-3 sm:py-2 text-xs sm:text-xs md:text-sm font-medium whitespace-normal sm:whitespace-nowrap justify-center text-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 sm:mr-1.5" />
                <span className="leading-tight">Unverified ({stats.recentUnverified.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {isLoading ? (
                <div className="space-y-2 sm:space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : stats.recent.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {stats.recent.map((downline) => (
                    <ReferralCard key={downline.user_id} downline={downline} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-xs sm:text-sm text-muted-foreground">No recent referrals</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="verified">
              {isLoading ? (
                <div className="space-y-2 sm:space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : stats.recentVerified.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {stats.recentVerified.map((downline) => (
                    <ReferralCard key={downline.user_id} downline={downline} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <BadgeCheck className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-xs sm:text-sm text-muted-foreground">No verified referrals yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="unverified">
              {isLoading ? (
                <div className="space-y-2 sm:space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : stats.recentUnverified.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {stats.recentUnverified.map((downline) => (
                    <ReferralCard key={downline.user_id} downline={downline} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <XCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-xs sm:text-sm text-muted-foreground">No unverified referrals</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* All Referrals by Level */}
      <Card className="relative overflow-hidden border-0 bg-white dark:bg-slate-900 shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
        <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base md:text-lg bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
            <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            All Referrals by Level
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs md:text-sm">
            Complete network organized by level (up to 10 levels)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : Object.keys(stats.byLevel).length > 0 ? (
            <Accordion type="multiple" className="space-y-2">
              {Object.entries(stats.byLevel)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([level, members]) => {
                  const levelNum = parseInt(level);
                  const verified = members.filter((m) => m.is_verified).length;
                  return (
                    <AccordionItem
                      key={level}
                      value={level}
                      className={`border rounded-xl sm:rounded-2xl overflow-hidden ${levelBgColors[(levelNum - 1) % 10]}`}
                    >
                      <AccordionTrigger className="px-3 sm:px-4 py-2 sm:py-3 hover:no-underline">
                        <div className="flex items-center gap-2 sm:gap-3 w-full">
                          <Badge
                            className={`bg-gradient-to-r ${levelColors[(levelNum - 1) % 10]} text-white border-0 text-xs sm:text-sm px-2 sm:px-3 py-0.5`}
                          >
                            Level {level}
                          </Badge>
                          <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                            {members.length} members
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-500 ml-auto mr-2">
                            {verified} verified
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                        <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {members.map((downline) => (
                            <ReferralCard key={downline.user_id} downline={downline} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
            </Accordion>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-sm sm:text-base mb-1">No referrals yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Share your referral code to start building your network
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
