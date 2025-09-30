-- Create currencies table
CREATE TABLE IF NOT EXISTS "currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"is_active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);

-- Insert common currencies
INSERT INTO "currencies" ("code", "name", "symbol", "is_active") VALUES
('USD', 'US Dollar', '$', 'true'),
('EUR', 'Euro', '€', 'true'),
('GBP', 'British Pound', '£', 'true'),
('RUB', 'Russian Ruble', '₽', 'true'),
('JPY', 'Japanese Yen', '¥', 'true'),
('CNY', 'Chinese Yuan', '¥', 'true'),
('CAD', 'Canadian Dollar', 'C$', 'true'),
('AUD', 'Australian Dollar', 'A$', 'true'),
('CHF', 'Swiss Franc', 'CHF', 'true'),
('SEK', 'Swedish Krona', 'kr', 'true'),
('NOK', 'Norwegian Krone', 'kr', 'true'),
('DKK', 'Danish Krone', 'kr', 'true'),
('PLN', 'Polish Zloty', 'zł', 'true'),
('CZK', 'Czech Koruna', 'Kč', 'true'),
('HUF', 'Hungarian Forint', 'Ft', 'true'),
('BRL', 'Brazilian Real', 'R$', 'true'),
('MXN', 'Mexican Peso', '$', 'true'),
('INR', 'Indian Rupee', '₹', 'true'),
('KRW', 'South Korean Won', '₩', 'true'),
('SGD', 'Singapore Dollar', 'S$', 'true'),
('HKD', 'Hong Kong Dollar', 'HK$', 'true'),
('NZD', 'New Zealand Dollar', 'NZ$', 'true'),
('TRY', 'Turkish Lira', '₺', 'true'),
('ZAR', 'South African Rand', 'R', 'true'),
('AED', 'UAE Dirham', 'د.إ', 'true'),
('SAR', 'Saudi Riyal', '﷼', 'true'),
('QAR', 'Qatari Riyal', '﷼', 'true'),
('KWD', 'Kuwaiti Dinar', 'د.ك', 'true'),
('BHD', 'Bahraini Dinar', 'د.ب', 'true'),
('OMR', 'Omani Rial', '﷼', 'true'),
('JOD', 'Jordanian Dinar', 'د.ا', 'true'),
('LBP', 'Lebanese Pound', 'ل.ل', 'true'),
('EGP', 'Egyptian Pound', '£', 'true'),
('ILS', 'Israeli Shekel', '₪', 'true'),
('THB', 'Thai Baht', '฿', 'true'),
('VND', 'Vietnamese Dong', '₫', 'true'),
('PHP', 'Philippine Peso', '₱', 'true'),
('IDR', 'Indonesian Rupiah', 'Rp', 'true'),
('MYR', 'Malaysian Ringgit', 'RM', 'true'),
('TWD', 'Taiwan Dollar', 'NT$', 'true'),
('PKR', 'Pakistani Rupee', '₨', 'true'),
('BDT', 'Bangladeshi Taka', '৳', 'true'),
('LKR', 'Sri Lankan Rupee', '₨', 'true'),
('NPR', 'Nepalese Rupee', '₨', 'true'),
('AFN', 'Afghan Afghani', '؋', 'true'),
('AMD', 'Armenian Dram', '֏', 'true'),
('AZN', 'Azerbaijani Manat', '₼', 'true'),
('GEL', 'Georgian Lari', '₾', 'true'),
('KZT', 'Kazakhstani Tenge', '₸', 'true'),
('KGS', 'Kyrgyzstani Som', 'с', 'true'),
('TJS', 'Tajikistani Somoni', 'SM', 'true'),
('TMT', 'Turkmenistani Manat', 'T', 'true'),
('UZS', 'Uzbekistani Som', 'сўм', 'true'),
('MNT', 'Mongolian Tugrik', '₮', 'true'),
('LAK', 'Lao Kip', '₭', 'true'),
('KHR', 'Cambodian Riel', '៛', 'true'),
('MMK', 'Myanmar Kyat', 'K', 'true'),
('BND', 'Brunei Dollar', 'B$', 'true'),
('FJD', 'Fijian Dollar', 'FJ$', 'true'),
('PGK', 'Papua New Guinea Kina', 'K', 'true'),
('SBD', 'Solomon Islands Dollar', 'SI$', 'true'),
('VUV', 'Vanuatu Vatu', 'Vt', 'true'),
('WST', 'Samoan Tala', 'WS$', 'true'),
('TOP', 'Tongan Paʻanga', 'T$', 'true'),
('XPF', 'CFP Franc', '₣', 'true'),
('NZD', 'New Zealand Dollar', 'NZ$', 'true'),
('AUD', 'Australian Dollar', 'A$', 'true');

-- Add currency_id column to accounts table
ALTER TABLE "accounts" ADD COLUMN "currency_id" integer;

-- Update existing accounts to use USD currency (assuming they were all USD before)
UPDATE "accounts" SET "currency_id" = (SELECT id FROM "currencies" WHERE code = 'USD');

-- Make currency_id NOT NULL after updating existing records
ALTER TABLE "accounts" ALTER COLUMN "currency_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE no action ON UPDATE no action;

-- Drop the old currency column
ALTER TABLE "accounts" DROP COLUMN "currency";
