-- Migration 0004: fix posts.userId index and add xPostId
-- Drop the old unique index if it exists and create a non-unique index
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'userId_idx') THEN
        EXECUTE 'DROP INDEX IF EXISTS "userId_idx"';
    END IF;
END$$;

-- Create a non-unique index for userId
CREATE INDEX IF NOT EXISTS posts_userId_idx ON posts ("userId");

-- Add xPostId column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='"xPostId"') THEN
        ALTER TABLE posts ADD COLUMN "xPostId" varchar(255);
    END IF;
END$$;
