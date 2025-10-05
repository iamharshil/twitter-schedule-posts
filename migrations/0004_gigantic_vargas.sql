ALTER TABLE "users" ALTER COLUMN "xId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "xPostId" varchar(255);--> statement-breakpoint
CREATE INDEX "posts_userId_idx" ON "posts" USING btree ("userId");