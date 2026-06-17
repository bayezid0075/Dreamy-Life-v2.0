-- Add parentCommentId and likesCount to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- Comment Likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS comment_user_idx ON comment_likes(comment_id, user_id);
