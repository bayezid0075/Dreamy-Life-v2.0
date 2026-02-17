"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { marketplaceApi, type Job } from "@/lib/api/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, PlusCircle, Eye } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export default function MyJobsPage() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["marketplace-my-jobs"],
    queryFn: () => marketplaceApi.myJobs(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Jobs</h1>
          <p className="text-muted-foreground mt-1">Jobs you posted</p>
        </div>
        <Link href="/marketplace/post">
          <Button size="sm" className="rounded-xl gap-1">
            <PlusCircle className="h-4 w-4" />
            Post Job
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : !jobs?.length ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No jobs yet</p>
            <Link href="/marketplace/post">
              <Button className="mt-4 rounded-xl">Post your first job</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job: Job) => (
            <Card key={job.id} className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <div className="aspect-video bg-muted/50 relative">
                {job.images?.[0]?.url ? (
                  <img src={job.images[0].url} alt="" className="object-cover w-full h-full" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Briefcase className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2 rounded-lg" variant="secondary">
                  {statusLabels[job.status] ?? job.status}
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-1">{job.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {job.work_type === "multi"
                    ? `৳${parseFloat(job.price).toLocaleString()}/unit · ${job.remaining_quantity} left`
                    : `৳${parseFloat(job.price).toLocaleString()} fixed`}
                </p>
              </CardHeader>
              <CardContent className="pt-0 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {job.submissions_count ?? 0} submissions
                </span>
                <Link href={`/marketplace/my-jobs/${job.id}`}>
                  <Button size="sm" variant="ghost" className="rounded-lg">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
