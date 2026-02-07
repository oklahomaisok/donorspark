ALTER TABLE "decks" ADD COLUMN "is_customized" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "decks" ADD COLUMN "customized_at" timestamp;