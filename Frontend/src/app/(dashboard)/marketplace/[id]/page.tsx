"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { marketplaceApi, type Job } from "@/lib/api/marketplace";
import { useAuthStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Briefcase, Send } from "lucide-react";

export default function MarketplaceJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { user, isAuthenticated } = useAuthStore();
  const [quantity, setQuantity] = useState(1);
  const [submissionText, setSubmissionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["marketplace-public-job", id],
    queryFn: () => marketplaceApi.getPublicJob(id),
    enabled: !!id && !isNaN(id),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || job.status !== "approved") return;
    if (quantity > job.remaining_quantity) {
      toast.error(`Max ${job.remaining_quantity} units`);
      return;
    }
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    try {
      await marketplaceApi.createSubmission({
        job: job.id,
        quantity,
        submission_text: submissionText.trim() || undefined,
      });
      toast.success("Submission sent");
      router.push("/marketplace/submissions");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      toast.error(String(ax?.response?.data?.detail ?? "Submit failed"));
    } finally {
      setSubmitting(false);
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

  const isOwner = isAuthenticated && user?.id === job.user;
  const canAccept = job.status === "approved" && job.remaining_quantity > 0 && !isOwner;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">
        ← Marketplace
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <div className="aspect-video bg-muted/50 relative">
              {job.images?.[0]?.url ? (
                <img src={job.images[0].url} alt="" className="object-cover w-full h-full" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Briefcase className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="text-xl">{job.title}</CardTitle>
              <p className="text-muted-foreground">
                {job.work_type === "multi"
                  ? `৳${parseFloat(job.price).toLocaleString()} per unit · ${job.remaining_quantity} of ${job.total_quantity} available`
                  : `Fixed ৳${parseFloat(job.price).toLocaleString()}`}
              </p>
              <p className="text-sm text-muted-foreground">by {job.user_username}</p>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{job.description.replace(/<[^>]*>/g, "")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="rounded-2xl border-border/50 shadow-sm sticky top-4">
            <CardHeader>
              <CardTitle>Accept job</CardTitle>
              <p className="text-sm text-muted-foreground">
                {job.remaining_quantity} unit(s) available
              </p>
            </CardHeader>
            <CardContent>
              {isOwner ? (
                <p className="text-sm text-muted-foreground">
                  This is your job. Manage submissions in My Jobs.
                </p>
              ) : canAccept ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {job.work_type === "multi" && (
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        max={job.remaining_quantity}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                        className="rounded-xl"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Submission notes (optional)</Label>
                    <Textarea
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Describe your work..."
                      rows={3}
                      className="rounded-xl"
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl" size="lg" disabled={submitting}>
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Submitting..." : "Submit work"}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {job.remaining_quantity === 0 ? "No units left." : "Job not available."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
