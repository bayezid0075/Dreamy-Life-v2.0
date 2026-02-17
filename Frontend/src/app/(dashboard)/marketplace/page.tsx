"use client";

import { useQuery } from "@tanstack/react-query";
import { useMarketplaceSocket } from "@/hooks/use-marketplace-socket";
import Link from "next/link";
import { marketplaceApi, type Job } from "@/lib/api/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Search, PlusCircle, ListTodo } from "lucide-react";
import { useState } from "react";

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7" />
            Marketplace
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse and accept jobs. Post your own from My Jobs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/marketplace/my-jobs">
            <Button variant="outline" size="sm" className="rounded-xl gap-1">
              <ListTodo className="h-4 w-4" />
              My Jobs
            </Button>
          </Link>
          <Link href="/marketplace/submissions">
            <Button variant="outline" size="sm" className="rounded-xl gap-1">
              My Submissions
            </Button>
          </Link>
          <Link href="/marketplace/post">
            <Button size="sm" className="rounded-xl gap-1">
              <PlusCircle className="h-4 w-4" />
              Post Job
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <select
          value={workType}
          onChange={(e) => setWorkType(e.target.value as "single" | "multi" | "")}
          className="rounded-xl border border-input bg-background px-4 py-2 text-sm h-9"
        >
          <option value="">All types</option>
          <option value="single">Single unit</option>
          <option value="multi">Multi unit</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "latest" | "price_asc" | "price_desc")}
          className="rounded-xl border border-input bg-background px-4 py-2 text-sm h-9"
        >
          <option value="latest">Latest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : !jobs?.length ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No jobs available. Try different filters or post a job.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job: Job) => (
            <Link key={job.id} href={`/marketplace/${job.id}`}>
              <Card className="rounded-2xl border-border/50 shadow-sm h-full overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-muted/50 relative">
                  {job.images?.[0]?.url ? (
                    <img
                      src={job.images[0].url}
                      alt=""
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Briefcase className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base line-clamp-2">{job.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {job.description.replace(/<[^>]*>/g, "").slice(0, 100)}…
                  </p>
                  <p className="text-sm font-medium">
                    {job.work_type === "multi"
                      ? `৳${parseFloat(job.price).toLocaleString()}/unit · ${job.remaining_quantity} left`
                      : `৳${parseFloat(job.price).toLocaleString()} fixed`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {job.user_username}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button size="sm" variant="secondary" className="rounded-xl w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
