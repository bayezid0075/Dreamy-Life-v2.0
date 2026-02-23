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

  const panelClass =
    "rounded-lg border border-[#eaecef] dark:border-[#2b3139] bg-[#fafafa] dark:bg-[#1e2329]";
  const cardClass =
    "rounded-lg border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139]";

  return (
    <div className="min-h-[60vh] px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10">
      {/* Main panel — Binance-style bordered container */}
      <div className={`${panelClass} overflow-hidden`}>
        {/* Hero strip — inside panel */}
        <section className="border-b border-[#eaecef] dark:border-[#2b3139] p-5 sm:p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-violet-500/10 dark:bg-violet-400/10 text-violet-700 dark:text-violet-300 px-2.5 py-1 text-xs font-medium mb-3 border border-violet-200/50 dark:border-violet-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                Live listings
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Discover work that pays
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Browse approved jobs, submit your work, and get paid. Or post a job and get it done.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              <Link href="/marketplace/my-jobs">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md gap-1.5 h-9 border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] hover:bg-slate-50 dark:hover:bg-[#333b45]"
                >
                  <ListTodo className="h-4 w-4" />
                  <span className="hidden sm:inline">My Jobs</span>
                </Button>
              </Link>
              <Link href="/marketplace/submissions">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md gap-1.5 h-9 border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] hover:bg-slate-50 dark:hover:bg-[#333b45]"
                >
                  <FileCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Submissions</span>
                </Button>
              </Link>
              <Link href="/marketplace/post">
                <Button
                  size="sm"
                  className="rounded-md gap-1.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium border border-primary/80"
                >
                  <PlusCircle className="h-4 w-4" />
                  Post Job
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Search + filters — inside panel, bordered bar */}
        <section className="border-b border-[#eaecef] dark:border-[#2b3139] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center">
            <div className="relative flex-1 min-w-0 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 h-10 rounded-md border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={workType || "all"} onValueChange={(v) => setWorkType(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-md border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] text-sm">
                  <SelectValue placeholder="Work type" />
                </SelectTrigger>
                <SelectContent align="start" className="rounded-md border border-[#2b3139]">
                  {WORK_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "all"} value={opt.value || "all"} className="rounded">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-md border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent align="start" className="rounded-md border border-[#2b3139]">
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="rounded">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Job listings — square boxes with border + radius */}
        <section className="p-4 sm:p-5">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-[320px] rounded-lg" />
              ))}
            </div>
          ) : !jobs?.length ? (
            <div
              className={`rounded-lg border border-dashed border-[#eaecef] dark:border-[#474d57] p-10 sm:p-14 text-center ${cardClass}`}
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-slate-200/80 dark:bg-[#333b45] mb-5">
                <Briefcase className="h-7 w-7 text-slate-500" />
              </div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No jobs right now
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Try different filters or be the first to post a job.
              </p>
              <Link href="/marketplace/post" className="mt-6 inline-block">
                <Button className="rounded-md gap-2 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                  <PlusCircle className="h-4 w-4" />
                  Post a job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {jobs.map((job: Job) => (
                <Link
                  key={job.id}
                  href={`/marketplace/${job.id}`}
                  className={`group block rounded-lg border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] overflow-hidden hover:border-primary/50 transition-colors ${cardClass}`}
                >
                  {/* Square image area */}
                  <div className="aspect-square max-h-[220px] w-full bg-slate-100 dark:bg-[#1e2329] relative overflow-hidden">
                    {job.images?.[0]?.url ? (
                      <img
                        src={job.images[0].url}
                        alt=""
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Briefcase className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                          job.work_type === "multi"
                            ? "bg-amber-500/90 text-white"
                            : "bg-emerald-500/90 text-white"
                        }`}
                      >
                        {job.work_type === "multi" ? "Multi" : "Single"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border-t border-[#eaecef] dark:border-[#474d57]">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 text-sm group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {stripHtml(job.description, 90)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-bold text-primary">
                        ৳{parseFloat(job.price).toLocaleString()}
                        {job.work_type === "multi" && (
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                            /unit · {job.remaining_quantity} left
                          </span>
                        )}
                      </p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        by {job.user_username}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-primary text-xs font-medium">
                      View details
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
