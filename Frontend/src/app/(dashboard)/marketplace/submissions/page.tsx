"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { marketplaceApi, type JobSubmission } from "@/lib/api/marketplace";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase } from "lucide-react";

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

export default function MarketplaceSubmissionsPage() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["marketplace-submissions"],
    queryFn: () => marketplaceApi.mySubmissions(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Submissions</h1>
        <p className="text-muted-foreground mt-1">Work you submitted for jobs</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !submissions?.length ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No submissions yet</p>
            <Link href="/marketplace">
              <span className="text-primary font-medium mt-2 hover:underline">Browse marketplace</span>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {(submissions as JobSubmission[]).map((s) => (
            <Card key={s.id} className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Submission #{s.id}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {s.quantity} · ৳{parseFloat(s.amount).toLocaleString()} · {s.created_at.slice(0, 10)}
                  </p>
                  {s.submission_text && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.submission_text}</p>
                  )}
                </div>
                <Badge variant="secondary" className="rounded-lg self-start sm:self-center">
                  {statusLabels[s.status] ?? s.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
