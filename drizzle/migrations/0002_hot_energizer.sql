CREATE TABLE "list_item_progress" (
	"list_id" uuid NOT NULL,
	"media_item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "list_item_progress_list_id_media_item_id_user_id_pk" PRIMARY KEY("list_id","media_item_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"media_item_id" uuid NOT NULL,
	"added_by" uuid NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "list_items_list_id_media_item_id_unique" UNIQUE("list_id","media_item_id")
);
--> statement-breakpoint
CREATE TABLE "list_members" (
	"list_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(10) NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "list_members_list_id_user_id_pk" PRIMARY KEY("list_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "shared_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "list_item_progress" ADD CONSTRAINT "list_item_progress_list_id_shared_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."shared_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_item_progress" ADD CONSTRAINT "list_item_progress_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_list_id_shared_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."shared_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_members" ADD CONSTRAINT "list_members_list_id_shared_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."shared_lists"("id") ON DELETE cascade ON UPDATE no action;