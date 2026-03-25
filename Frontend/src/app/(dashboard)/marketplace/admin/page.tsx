"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { marketplaceApi, type Job } from "@/lib/api/marketplace";
import { useAuthStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Briefcase, Check, X, ShieldCheck } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export default function MarketplaceAdminPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isStaff = user?.user?.is_staff ?? false;

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["marketplace-admin-jobs"],
    queryFn: () => marketplaceApi.adminJobs(),
    enabled: isStaff,
  });

  const handleApprove = async (jobId: number, action: "approve" | "reject") => {
    try {
      await marketplaceApi.adminApproveJob(jobId, action);
      queryClient.invalidateQueries({ queryKey: ["marketplace-admin-jobs"] });
      toast.success(action === "approve" ? "Job approved" : "Job rejected");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      toast.error(String(ax?.response?.data?.detail ?? "Action failed"));
    }
  };

  if (!isStaff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <ShieldCheck className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Admin only.</p>
        <Link href="/marketplace"><Button variant="outline" className="rounded-xl">Back to Marketplace</Button></Link>
      </div>
    );
  }

  const pendingJobs = jobs?.filter((j: Job) => j.status === "pending") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-7 w-7" />
          Marketplace Admin
        </h1>
        <p className="text-muted-foreground mt-1">Approve or reject pending jobs</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>All jobs ({jobs?.length ?? 0})</CardTitle>
              <p className="text-sm text-muted-foreground">Pending: {pendingJobs.length}</p>
            </CardHeader>
            <CardContent>
              {!jobs?.length ? (
                <p className="text-center py-8 text-muted-foreground">No jobs.</p>
              ) : (
                <ul className="space-y-4">
                  {(jobs as Job[]).map((job) => (
                    <li
                      key={job.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-card"
                    >
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.user_username} · budget ৳{parseFloat(job.total_budget).toLocaleString()} · charges
                          ৳{Math.round(parseFloat(job.total_budget) * 1.05 * 100) / 100} on approve (+5%)
                        </p>
                        <Badge variant="secondary" className="rounded-lg mt-1">
                          {statusLabels[job.status] ?? job.status}
                        </Badge>
                      </div>
                      {job.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="rounded-lg"
                            onClick={() => handleApprove(job.id, "approve")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-lg"
                            onClick={() => handleApprove(job.id, "reject")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
