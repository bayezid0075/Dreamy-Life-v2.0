"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { marketplaceApi, type Job } from "@/lib/api/marketplace";
import { useAuthStore } from "@/store";
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
      <div className="max-w-4xl mx-auto px-4">
        <Skeleton className="h-6 w-32 rounded-md mb-6" />
        <div className="rounded-lg border border-[#eaecef] dark:border-[#2b3139] overflow-hidden">
          <Skeleton className="h-64 rounded-none" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const isOwner = isAuthenticated && user?.id === job.user;
  const canAccept = job.status === "approved" && job.remaining_quantity > 0 && !isOwner;

  const panelClass =
    "rounded-lg border border-[#eaecef] dark:border-[#2b3139] bg-[#fafafa] dark:bg-[#1e2329]";
  const cardClass =
    "rounded-lg border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139]";

  return (
    <div className="max-w-4xl mx-auto px-4 pb-8">
      <Link
        href="/marketplace"
        className="inline-block text-sm text-slate-500 dark:text-slate-400 hover:text-primary mb-6 transition-colors"
      >
        ← Marketplace
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Job detail card — same style as marketplace listing */}
        <div className="lg:col-span-2">
          <div
            className={`${cardClass} overflow-hidden`}
          >
            <div className="aspect-video bg-slate-100 dark:bg-[#1e2329] relative">
              {job.images?.[0]?.url ? (
                <img src={job.images[0].url} alt="" className="object-cover w-full h-full" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Briefcase className="h-16 w-16 text-slate-300 dark:text-slate-600" />
                </div>
              )}
            </div>
            <div className="border-t border-[#eaecef] dark:border-[#474d57] p-5 sm:p-6">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {job.title}
              </h1>
              <p className="mt-2 text-primary font-semibold">
                {job.work_type === "multi"
                  ? `৳${parseFloat(job.price).toLocaleString()} per unit · ${job.remaining_quantity} of ${job.total_quantity} available`
                  : `Fixed ৳${parseFloat(job.price).toLocaleString()}`}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                by {job.user_username}
              </p>
              <div className="mt-4 pt-4 border-t border-[#eaecef] dark:border-[#474d57]">
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {job.description.replace(/<[^>]*>/g, "")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Accept job panel — same bordered panel style */}
        <div>
          <div
            className={`${panelClass} sticky top-4 overflow-hidden`}
          >
            <div className="border-b border-[#eaecef] dark:border-[#2b3139] p-4">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Accept job</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {job.remaining_quantity} unit(s) available
              </p>
            </div>
            <div className="p-4">
              {isOwner ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This is your job. Manage submissions in My Jobs.
                </p>
              ) : canAccept ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {job.work_type === "multi" && (
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-700 dark:text-slate-300">Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        max={job.remaining_quantity}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                        className="rounded-md border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] h-10"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-700 dark:text-slate-300">
                      Submission notes (optional)
                    </Label>
                    <Textarea
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Describe your work..."
                      rows={3}
                      className="rounded-md border border-[#eaecef] dark:border-[#474d57] bg-white dark:bg-[#2b3139] resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-md h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium border border-primary/80"
                    size="lg"
                    disabled={submitting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Submitting..." : "Submit work"}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {job.remaining_quantity === 0 ? "No units left." : "Job not available."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
