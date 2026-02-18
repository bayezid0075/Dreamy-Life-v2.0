"use client";

import { useQuery } from "@tanstack/react-query";
import { useMarketplaceSocket } from "@/hooks/use-marketplace-socket";
import Link from "next/link";
import { marketplaceApi, type Job } from "@/lib/api/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Search,
  PlusCircle,
  ListTodo,
  FileCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const SORT_OPTIONS: { value: "latest" | "price_asc" | "price_desc"; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

const WORK_TYPE_OPTIONS: { value: "" | "single" | "multi"; label: string }[] = [
  { value: "", label: "All" },
  { value: "single", label: "Single" },
  { value: "multi", label: "Multi" },
];

function stripHtml(html: string, maxLen: number): string {
  const text = html.replace(/<[^>]*>/g, "").trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + "…";
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [workType, setWorkType] = useState<"single" | "multi" | "">("");
  const [sort, setSort] = useState<"latest" | "price_asc" | "price_desc">("latest");

  useMarketplaceSocket(true);
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["marketplace-public", search, workType, sort],
    queryFn: () =>
      marketplaceApi.publicList({
        search: search || undefined,
        work_type: workType || undefined,
        sort,
      }),
  });

  return (
    <div className="min-h-[60vh] px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10">
      {/* 60%: Neutral base — hero strip (calm, spacious) */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-900/80 dark:to-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 p-5 sm:p-6 md:p-8 lg:p-10 mb-6 sm:mb-8">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6 lg:gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 dark:bg-violet-400/10 text-violet-700 dark:text-violet-300 px-3 py-1.5 text-xs font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Live listings
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Discover work that pays
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              Browse approved jobs, submit your work, and get paid. Or post a job and get it done.
            </p>
          </div>
          {/* 10%: Accent — primary CTAs */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
            <Link href="/marketplace/my-jobs">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 h-10 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80"
              >
                <ListTodo className="h-4 w-4" />
                <span className="hidden sm:inline">My Jobs</span>
              </Button>
            </Link>
            <Link href="/marketplace/submissions">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 h-10 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80"
              >
                <FileCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Submissions</span>
              </Button>
            </Link>
            <Link href="/marketplace/post">
              <Button
                size="sm"
                className="rounded-xl gap-1.5 h-10 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25"
              >
                <PlusCircle className="h-4 w-4" />
                Post Job
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 30%: Surface — search + filters */}
      <section className="mb-6 sm:mb-8 space-y-4 sm:space-y-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search jobs by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 pr-4 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base"
          />
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
          <Select value={workType || "all"} onValueChange={(v) => setWorkType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-[160px] h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Work type" />
            </SelectTrigger>
            <SelectContent align="start" className="rounded-xl">
              {WORK_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || "all"} value={opt.value || "all"} className="rounded-lg">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent align="start" className="rounded-xl">
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* 30%: Card surface — job listings */}
      {isLoading ? (
        <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[280px] sm:h-[300px] rounded-2xl" />
          ))}
        </div>
      ) : !jobs?.length ? (
        <div className="rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-10 sm:p-14 md:p-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/80 dark:bg-slate-700/50 mb-6">
            <Briefcase className="h-8 w-8 text-slate-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            No jobs right now
          </h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Try different filters or be the first to post a job.
          </p>
          <Link href="/marketplace/post" className="mt-8 inline-block">
            <Button className="rounded-xl gap-2 bg-violet-600 hover:bg-violet-700">
              <PlusCircle className="h-4 w-4" />
              Post a job
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job: Job) => (
            <Link
              key={job.id}
              href={`/marketplace/${job.id}`}
              className="group block rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-800/50 transition-all duration-300"
            >
              {/* Image / placeholder — 30% surface */}
              <div className="aspect-[16/10] sm:aspect-video bg-gradient-to-br from-slate-100 to-slate-200/80 dark:from-slate-800 dark:to-slate-700/80 relative overflow-hidden">
                {job.images?.[0]?.url ? (
                  <img
                    src={job.images[0].url}
                    alt=""
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Briefcase className="h-12 w-12 sm:h-14 sm:w-14 text-slate-300 dark:text-slate-600" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3">
                  <span
                    className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${
                      job.work_type === "multi"
                        ? "bg-amber-500/90 text-white"
                        : "bg-emerald-500/90 text-white"
                    }`}
                  >
                    {job.work_type === "multi" ? "Multi" : "Single"}
                  </span>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 text-base sm:text-lg group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
                  {job.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {stripHtml(job.description, 90)}
                </p>
                {/* 10% accent: price */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                    ৳{parseFloat(job.price).toLocaleString()}
                    {job.work_type === "multi" && (
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                        /unit · {job.remaining_quantity} left
                      </span>
                    )}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    by {job.user_username}
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-medium">
                  View details
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
