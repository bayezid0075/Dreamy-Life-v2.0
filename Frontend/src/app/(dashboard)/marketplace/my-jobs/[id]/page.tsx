"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { marketplaceApi, type Job, type JobSubmission } from "@/lib/api/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Briefcase, Check, X } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  submitted: "Submitted",
};

export default function MyJobDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const id = Number(params.id);
  const { data: job, isLoading } = useQuery({
    queryKey: ["marketplace-my-job", id],
    queryFn: () => marketplaceApi.getJob(id),
    enabled: !!id && !isNaN(id),
  });

  const handleReview = async (submissionId: number, action: "approve" | "reject") => {
    try {
      await marketplaceApi.reviewSubmission(submissionId, action);
      queryClient.invalidateQueries({ queryKey: ["marketplace-my-job", id] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-my-jobs"] });
      toast.success(action === "approve" ? "Submission approved" : "Submission rejected");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      toast.error(String(ax?.response?.data?.detail ?? "Action failed"));
    }
  };

  if (isLoading || !job) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const pendingSubmissions = job.submissions?.filter((s) => s.status === "submitted") ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/marketplace/my-jobs" className="text-sm text-muted-foreground hover:text-foreground">
        ← My Jobs
      </Link>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <div className="aspect-video bg-muted/50 relative">
          {job.images?.[0]?.url ? (
            <img src={job.images[0].url} alt="" className="object-cover w-full h-full" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Briefcase className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <Badge className="absolute top-2 right-2 rounded-lg" variant="secondary">
            {statusLabels[job.status] ?? job.status}
          </Badge>
        </div>
        <CardHeader>
          <CardTitle>{job.title}</CardTitle>
          <p className="text-muted-foreground">
            {job.work_type === "multi"
              ? `৳${parseFloat(job.price).toLocaleString()}/unit · ${job.remaining_quantity} left`
              : `৳${parseFloat(job.price).toLocaleString()} fixed`}
          </p>
          <p className="text-sm text-muted-foreground">
            Reserved: ৳{parseFloat(job.reserved_amount || "0").toLocaleString()}
          </p>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{job.description.replace(/<[^>]*>/g, "")}</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Submissions ({job.submissions?.length ?? 0})</CardTitle>
          <p className="text-sm text-muted-foreground">Approve or reject worker submissions</p>
        </CardHeader>
        <CardContent>
          {!job.submissions?.length ? (
            <p className="text-center py-8 text-muted-foreground">No submissions yet.</p>
          ) : (
            <ul className="space-y-4">
              {(job.submissions ?? []).map((s: JobSubmission) => (
                <li
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-card"
                >
                  <div>
                    <p className="font-medium">{s.user_username}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {s.quantity} · ৳{parseFloat(s.amount).toLocaleString()} · {statusLabels[s.status] ?? s.status}
                    </p>
                    {s.submission_text && (
                      <p className="text-sm text-muted-foreground mt-1">{s.submission_text}</p>
                    )}
                  </div>
                  {s.status === "submitted" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="rounded-lg"
                        onClick={() => handleReview(s.id, "approve")}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-lg"
                        onClick={() => handleReview(s.id, "reject")}
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
    </div>
  );
}
