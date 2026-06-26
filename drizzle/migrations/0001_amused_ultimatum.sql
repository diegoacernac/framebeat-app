CREATE TABLE "media_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(10) NOT NULL,
	"external_id" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"poster_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_items_type_external_id_unique" UNIQUE("type","external_id")
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"media_item_id" uuid NOT NULL,
	"stars" smallint NOT NULL,
	"review" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_user_id_media_item_id_unique" UNIQUE("user_id","media_item_id")
);
--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE no action ON UPDATE no action;