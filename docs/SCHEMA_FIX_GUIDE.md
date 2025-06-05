# Database Schema Fix Guide

## Issue: Missing Columns in Sales Table

The application was encountering errors when trying to create sales records due to missing columns in the Supabase database schema:

```
Error checking for duplicate sales:  
{code: '42703', details: null, hint: null, message: 'column sales.transactionId does not exist'}

Supabase create sale error:  
{code: 'PGRST204', details: null, hint: null, message: "Could not find the 'cashAmount' column of 'sales' in the schema cache"}
```

### Root Cause

The application code was expecting the following columns in the `sales` table that were missing from the database schema:

- `transactionId` - Unique transaction identifier
- `cashAmount` - Amount paid in cash
- `upiAmount` - Amount paid via UPI
- `changeAmount` - Change given back to customer
- `updated_at` - Last update timestamp

## Solution

A SQL migration script has been created to add the missing columns to the `sales` table:

```sql
-- Add transactionId column
ALTER TABLE sales ADD COLUMN IF NOT EXISTS transactionId TEXT;

-- Add cashAmount column
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cashAmount DECIMAL(10,2) DEFAULT 0;

-- Add upiAmount column
ALTER TABLE sales ADD COLUMN IF NOT EXISTS upiAmount DECIMAL(10,2) DEFAULT 0;

-- Add changeAmount column
ALTER TABLE sales ADD COLUMN IF NOT EXISTS changeAmount DECIMAL(10,2) DEFAULT 0;

-- Add updated_at column for consistency
ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on transactionId for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_transaction_id ON sales(transactionId);
```

### How to Apply the Fix

#### Option 1: Using the Node.js Script

1. Ensure you have the Supabase service role key in your environment variables:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the migration script:
   ```bash
   node execute_sales_schema_fix.mjs
   ```

#### Option 2: Manual Execution in Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `fix_sales_table_schema.sql`
4. Execute the SQL commands

## Schema Verification

After applying the fix, you can verify the schema by running:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales';
```

You should see the following columns (among others):
- `id` (uuid)
- `items` (jsonb)
- `total` (numeric)
- `payment_method` (text)
- `customer_id` (uuid)
- `staff_id` (uuid)
- `outlet_id` (uuid)
- `transactionId` (text)
- `cashAmount` (numeric)
- `upiAmount` (numeric)
- `changeAmount` (numeric)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

## Preventing Future Schema Issues

1. Always update the schema definition files when adding new columns in the application code
2. Consider implementing database migrations using a tool like Prisma or TypeORM
3. Add schema validation in the application to detect mismatches early