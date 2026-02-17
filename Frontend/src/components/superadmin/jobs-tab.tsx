"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, Loader2, RefreshCw, Check, X } from "lucide-react";
import { marketplaceApi, type Job } from "@/lib/api/marketplace";
import { Button } from "@/components/ui/button";

type SuperadminTheme = "dark" | "light";

interface SuperadminJobsTabProps {
  theme?: SuperadminTheme;
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export function SuperadminJobsTab({ theme = "dark" }: SuperadminJobsTabProps) {
  const isLight = theme === "light";
  const queryClient = useQueryClient();

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ["marketplace-admin-jobs"],
    queryFn: () => marketplaceApi.adminJobs(),
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

  const pendingJobs = jobs?.filter((j: Job) => j.status === "pending") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2
          className={`text-lg font-semibold ${
            isLight ? "text-slate-800" : "text-slate-200"
          }`}
        >
          Marketplace jobs · Pending: {pendingJobs.length}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className={
            isLight
              ? "border-slate-300 text-slate-700 hover:bg-slate-100 font-mono"
              : "border-slate-600 text-slate-400 hover:bg-slate-800 font-mono"
          }
        >
          <RefreshCw
            className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div
        className={`rounded-lg border overflow-hidden ${
          isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-[#161b22]"
        }`}
      >
        {isLoading ? (
          <div
            className={`flex items-center justify-center py-16 ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !jobs?.length ? (
          <div
            className={`py-16 text-center ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No jobs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr
                  className={
                    isLight
                      ? "border-b border-slate-200 bg-slate-50 text-slate-600"
                      : "border-b border-slate-700 bg-slate-800/50 text-slate-400"
                  }
                >
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Posted by</th>
                  <th className="text-left px-4 py-3 font-medium">Budget</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {(jobs as Job[]).map((job) => (
                  <tr
                    key={job.id}
                    className={
                      isLight
                        ? "border-b border-slate-100 hover:bg-slate-50 text-slate-800"
                        : "border-b border-slate-700/50 hover:bg-slate-800/30 text-slate-200"
                    }
                  >
                    <td className="px-4 py-3 font-medium">{job.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs">
                        {job.user_username ?? `User #${job.user}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      ৳{parseFloat(job.total_budget).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          job.status === "rejected"
                            ? "bg-red-500/20 text-red-400"
                            : job.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : job.status === "pending"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-slate-500/20 text-slate-400"
                        }`}
                      >
                        {statusLabels[job.status] ?? job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {job.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="rounded-lg h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleApprove(job.id, "approve")}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-lg h-8 text-xs"
                            onClick={() => handleApprove(job.id, "reject")}
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
