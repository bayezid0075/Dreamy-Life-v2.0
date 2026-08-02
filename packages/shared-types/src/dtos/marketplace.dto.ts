export interface CreateJobDto {
  title: string;
  description: string;
  type: 'single' | 'multiple';
  amount: number;
  unitPay: number;
  totalUnits?: number;
  mediaUrls?: string[];
}

export interface PlaceBidDto {
  amount: number;
  message?: string;
}

export interface SubmitWorkDto {
  proof: string;
  proofMediaUrls?: string[];
}

export interface JobListQuery {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
}

export interface AdminUpdateUnitsDto {
  workerId: string;
  units: number;
}

export interface JobPostResponse {
  job: any;
  escrow: any;
}

export interface JobListResponse {
  jobs: any[];
  total: number;
  page: number;
  limit: number;
}

export interface BidListResponse {
  bids: any[];
  total: number;
}

export interface SubmissionListResponse {
  submissions: any[];
  total: number;
}
