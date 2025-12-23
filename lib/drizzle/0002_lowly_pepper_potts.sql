CREATE TABLE IF NOT EXISTS "MessageFeedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid,
	"userId" uuid NOT NULL,
	"messageId" varchar(255),
	"rating" integer NOT NULL,
	"comment" text,
	"userQuery" text,
	"assistantResponse" text,
	"toolsUsed" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "MessageFeedback" ADD CONSTRAINT "MessageFeedback_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "MessageFeedback" ADD CONSTRAINT "MessageFeedback_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_chatId_idx" ON "MessageFeedback" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_userId_idx" ON "MessageFeedback" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_rating_idx" ON "MessageFeedback" USING btree ("rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_createdAt_idx" ON "MessageFeedback" USING btree ("createdAt");