-- Migration: Split transactions table into transactions and transfers
-- This migration separates transfer transactions from regular transactions

-- Step 1: Create the new transfers table
CREATE TABLE IF NOT EXISTS "transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_amount" numeric(10,2) NOT NULL,
	"to_amount" numeric(10,2) NOT NULL,
	"description" text NOT NULL,
	"date" timestamp NOT NULL,
	"user_id" text NOT NULL,
	"group_id" text NOT NULL,
	"from_account_id" integer NOT NULL,
	"to_account_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Step 2: Migrate transfer transactions to the new transfers table
INSERT INTO "transfers" (
    "from_amount",
    "to_amount", 
    "description",
    "date",
    "user_id",
    "group_id",
    "from_account_id",
    "to_account_id",
    "created_at"
)
SELECT 
    "amount" as "from_amount",
    "amount" as "to_amount", -- For now, we assume same amount, will be updated later
    "description",
    "date",
    "user_id",
    "group_id", 
    "account_id" as "from_account_id",
    "transfer_to_account_id" as "to_account_id",
    "created_at"
FROM "transactions" 
WHERE "type" = 'transfer' 
AND "transfer_to_account_id" IS NOT NULL;

-- Step 3: Delete transfer transactions from the old transactions table
DELETE FROM "transactions" WHERE "type" = 'transfer';

-- Step 4: Drop the transfer_to_account_id column from transactions table
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "transfer_to_account_id";

-- Step 5: Add foreign key constraints to transfers table
DO $$ BEGIN
 ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "transfers" ADD CONSTRAINT "transfers_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_account_id_accounts_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_account_id_accounts_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
