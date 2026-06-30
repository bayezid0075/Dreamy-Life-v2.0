export type JobType = 'single' | 'multiple';

export type JobStatus =
  | 'pending_approval'
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export type AssignmentStatus =
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'rejected';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export type EscrowStatus = 'held' | 'released' | 'refunded';

export interface JobPost {
  id: string;
  posterId: string;
  title: string;
  description: string;
  type: JobType;
  amount: number;
  unitPay: number;
  totalUnits: number;
  filledUnits: number;
  status: JobStatus;
  adminApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobPostWithPoster extends JobPost {
  posterUsername: string;
  posterFullName?: string;
  posterAvatarUrl?: string;
}

export interface JobBid {
  id: string;
  jobId: string;
  bidderId: string;
  amount: number;
  status: BidStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobBidWithBidder extends JobBid {
  bidderUsername: string;
  bidderFullName?: string;
  bidderAvatarUrl?: string;
}

export interface JobAssignment {
  id: string;
  jobId: string;
  workerId: string;
  units: number;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface JobAssignmentWithWorker extends JobAssignment {
  workerUsername: string;
  workerFullName?: string;
  workerAvatarUrl?: string;
}

export interface JobSubmission {
  id: string;
  jobId: string;
  assignmentId?: string;
  bidId?: string;
  workerId: string;
  proof: string;
  proofMediaUrls: string[];
  status: SubmissionStatus;
  posterComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobSubmissionWithWorker extends JobSubmission {
  workerUsername: string;
  workerFullName?: string;
  workerAvatarUrl?: string;
}

export interface JobEscrow {
  id: string;
  jobId: string;
  posterId: string;
  amount: number;
  status: EscrowStatus;
  releasedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobDashboard {
  posted: JobPostWithPoster[];
  activeBids: number;
  pendingSubmissions: number;
  totalEarnings: number;
}
