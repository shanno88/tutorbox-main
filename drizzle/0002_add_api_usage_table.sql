-- Add api_usage table for quota tracking
CREATE TABLE IF NOT EXISTS "api_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"api_key_id" integer NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"used" integer NOT NULL DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_usage_unique_key" UNIQUE("user_id","api_key_id","year","month"),
	CONSTRAINT "api_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade,
	CONSTRAINT "api_usage_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE cascade
);
