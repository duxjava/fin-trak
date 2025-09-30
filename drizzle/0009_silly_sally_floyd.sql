CREATE TABLE IF NOT EXISTS "operations_view" (
	"operation_type" text NOT NULL,
	"operation_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"category" text,
	"type" text NOT NULL,
	"date" timestamp NOT NULL,
	"user_id" text NOT NULL,
	"group_id" text NOT NULL,
	"primary_account_id" integer NOT NULL,
	"secondary_account_id" integer NOT NULL,
	"secondary_amount" numeric(10, 2),
	"created_at" timestamp NOT NULL,
	"sort_date" timestamp NOT NULL,
	"sort_created_at" timestamp NOT NULL
);
