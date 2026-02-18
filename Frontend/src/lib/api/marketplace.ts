import { apiClient, apiClientMultipart } from "./client";

export type WorkType = "single" | "multi";
export type JobStatus = "pending" | "approved" | "rejected" | "completed";
export type SubmissionStatus = "submitted" | "approved" | "rejected";

export interface JobImage {
  id: number;
  image?: string;
  image_url?: string;
  url: string;
  order: number;
}

export interface JobSubmissionFile {
  id: number;
  file?: string;
  name: string;
  url: string;
  created_at: string;
}

export interface JobSubmission {
  id: number;
  job: number;
  user: number;
  user_username: string;
  quantity: number;
  submission_text: string;
  status: SubmissionStatus;
  amount: string;
  files: JobSubmissionFile[];
  created_at: string;
  reviewed_at: string | null;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  work_type: WorkType;
  price: string;
  total_quantity: number;
  remaining_quantity: number;
  total_budget: string;
  reserved_amount: string;
  status: JobStatus;
  user: number;
  user_username: string;
  images: JobImage[];
  submissions_count?: number;
  submissions?: JobSubmission[];
  approved_by?: number | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletCheck {
  balance: string;
  reserved_balance: string;
  available_balance: string;
}

export interface JobCreatePayload {
  title: string;
  description: string;
  work_type: WorkType;
  price: number | string;
  total_quantity: number;
  images?: { image_url?: string; url?: string; order?: number }[];
}

export interface SubmissionCreatePayload {
  job: number;
  quantity: number;
  submission_text?: string;
}

const BASE = "/api/marketplace";

export const marketplaceApi = {
  walletCheck: (): Promise<WalletCheck> =>
    apiClient.get(`${BASE}/wallet-check/`).then((r) => r.data),

  myJobs: (params?: { status?: string }): Promise<Job[]> => {
    const p = new URLSearchParams();
    if (params?.status) p.set("status", params.status);
    const q = p.toString();
    return apiClient.get(`${BASE}/jobs/${q ? `?${q}` : ""}`).then((r) => r.data);
  },

  getJob: (id: number): Promise<Job> =>
    apiClient.get(`${BASE}/jobs/${id}/`).then((r) => r.data),

  createJob: (payload: JobCreatePayload): Promise<Job> =>
    apiClient.post(`${BASE}/jobs/`, payload).then((r) => r.data),

  /** Upload an image file for a job listing. Returns the public URL to use in createJob images. */
  uploadJobImage: (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append("image", file);
    return apiClientMultipart.post<{ url: string }>(`${BASE}/job-image-upload/`, form).then((r) => r.data);
  },

  publicList: (params?: {
    work_type?: WorkType;
    sort?: "latest" | "price_asc" | "price_desc";
    search?: string;
  }): Promise<Job[]> => {
    const p = new URLSearchParams();
    if (params?.work_type) p.set("work_type", params.work_type);
    if (params?.sort) p.set("sort", params.sort);
    if (params?.search) p.set("search", params.search);
    const q = p.toString();
    return apiClient.get(`${BASE}/public/${q ? `?${q}` : ""}`).then((r) => r.data);
  },

  getPublicJob: (id: number): Promise<Job> =>
    apiClient.get(`${BASE}/public/${id}/`).then((r) => r.data),

  mySubmissions: (): Promise<JobSubmission[]> =>
    apiClient.get(`${BASE}/submissions/`).then((r) => r.data),

  createSubmission: (payload: SubmissionCreatePayload): Promise<JobSubmission> =>
    apiClient.post(`${BASE}/submissions/`, payload).then((r) => r.data),

  reviewSubmission: (
    submissionId: number,
    action: "approve" | "reject"
  ): Promise<JobSubmission> =>
    apiClient
      .post(`${BASE}/submissions/${submissionId}/review/`, { action })
      .then((r) => r.data),

  adminJobs: (): Promise<Job[]> =>
    apiClient.get(`${BASE}/admin/jobs/`).then((r) => r.data),

  adminApproveJob: (
    jobId: number,
    action: "approve" | "reject"
  ): Promise<Job> =>
    apiClient
      .post(`${BASE}/admin/jobs/${jobId}/approve/`, { action })
      .then((r) => r.data),
};

export default marketplaceApi;
