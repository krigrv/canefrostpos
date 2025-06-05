-- Fix sales table schema by adding missing columns
-- This addresses the errors: column sales.transactionId does not exist
-- and Could not find the 'cashAmount' column of 'sales' in the schema cache

-- Add transactionId column
ALTER TABLE sales ADD COLUMN IF NOT EXISTS transactionId TEXT;

-- Add cashAmount column
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cashAmount DECIMAL(10,2) DEFAULT 0;

-- Add upiAmount column (also used in the application)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS upiAmount DECIMAL(10,2) DEFAULT 0;

-- Add changeAmount column (also used in the application)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS changeAmount DECIMAL(10,2) DEFAULT 0;

-- Add updated_at column for consistency
ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on transactionId for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_transaction_id ON sales(transactionId);

-- Update existing records to have a transactionId if they don't have one
UPDATE sales 
SET transactionId = 'INVCFN' || LPAD(EXTRACT(EPOCH FROM created_at)::TEXT, 8, '0')
WHERE transactionId IS NULL OR transactionId = '';