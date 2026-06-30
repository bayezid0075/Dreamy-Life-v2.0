-- Add category column to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(20) NOT NULL DEFAULT 'app';

-- Create job_posts table
CREATE TABLE IF NOT EXISTS job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  unit_pay NUMERIC(12,2) NOT NULL,
  total_units INTEGER NOT NULL DEFAULT 1,
  filled_units INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending_approval',
  admin_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS job_poster_idx ON job_posts (poster_id);
CREATE INDEX IF NOT EXISTS job_status_idx ON job_posts (status);

-- Create job_bids table
CREATE TABLE IF NOT EXISTS job_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_posts(id),
  bidder_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bid_job_idx ON job_bids (job_id);
CREATE INDEX IF NOT EXISTS bid_bidder_idx ON job_bids (bidder_id);
CREATE UNIQUE INDEX IF NOT EXISTS bid_job_bidder_idx ON job_bids (job_id, bidder_id);

-- Create job_assignments table
CREATE TABLE IF NOT EXISTS job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_posts(id),
  worker_id UUID NOT NULL REFERENCES users(id),
  units INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'assigned',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assignment_job_idx ON job_assignments (job_id);
CREATE INDEX IF NOT EXISTS assignment_worker_idx ON job_assignments (worker_id);

-- Create job_submissions table
CREATE TABLE IF NOT EXISTS job_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_posts(id),
  assignment_id UUID REFERENCES job_assignments(id),
  bid_id UUID REFERENCES job_bids(id),
  worker_id UUID NOT NULL REFERENCES users(id),
  proof TEXT NOT NULL,
  proof_media_urls TEXT[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  poster_comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS submission_job_idx ON job_submissions (job_id);
CREATE INDEX IF NOT EXISTS submission_worker_idx ON job_submissions (worker_id);

-- Create job_escrow table
CREATE TABLE IF NOT EXISTS job_escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE REFERENCES job_posts(id),
  poster_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'held',
  released_to UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS escrow_job_idx ON job_escrow (job_id);
