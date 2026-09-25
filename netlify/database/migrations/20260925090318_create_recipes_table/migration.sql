CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"cuisine" text DEFAULT '' NOT NULL,
	"prep_time_minutes" integer DEFAULT 0 NOT NULL,
	"cook_time_minutes" integer DEFAULT 0 NOT NULL,
	"servings" integer DEFAULT 1 NOT NULL,
	"difficulty" text DEFAULT '' NOT NULL,
	"tags" jsonb NOT NULL,
	"image_path" text DEFAULT '' NOT NULL,
	"ingredients" jsonb NOT NULL,
	"instructions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
