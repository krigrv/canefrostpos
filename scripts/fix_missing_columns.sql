-- Fix missing columns in sales, staff, and customers tables
-- Run this in your Supabase SQL Editor to fix schema mismatches

-- Fix Sales table columns
ALTER TABLE sales ADD COLUMN IF NOT EXISTS transactionId TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cashAmount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS upiAmount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS changeAmount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix Staff table columns
ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS joinDate TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE staff ADD COLUMN IF NOT EXISTS join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE staff ADD COLUMN IF NOT EXISTS totalSales DECIMAL(10,2) DEFAULT 0;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS shiftsThisWeek INTEGER DEFAULT 0;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS currentShift TEXT DEFAULT 'Not Assigned';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix Customers table columns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS joinDate TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE customers ADD COLUMN IF NOT EXISTS join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE customers ADD COLUMN IF NOT EXISTS totalPurchases DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS visitCount INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS visits INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lastVisit TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_visit TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyaltyPoints INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Bronze';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS favoriteItems JSONB DEFAULT '[]';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_transaction_id ON sales(transactionId);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Update existing records to have transactionId if they don't have one
UPDATE sales 
SET transactionId = 'INVCFN' || LPAD(EXTRACT(EPOCH FROM created_at)::TEXT, 8, '0')
WHERE transactionId IS NULL OR transactionId = '';

-- Sync joinDate with join_date for existing records
UPDATE staff SET joinDate = join_date WHERE joinDate IS NULL AND join_date IS NOT NULL;
UPDATE staff SET join_date = joinDate WHERE join_date IS NULL AND joinDate IS NOT NULL;
UPDATE staff SET createdAt = created_at WHERE createdAt IS NULL AND created_at IS NOT NULL;

UPDATE customers SET joinDate = join_date WHERE joinDate IS NULL AND join_date IS NOT NULL;
UPDATE customers SET join_date = joinDate WHERE join_date IS NULL AND joinDate IS NOT NULL;
UPDATE customers SET createdAt = created_at WHERE createdAt IS NULL AND created_at IS NOT NULL;
UPDATE customers SET lastVisit = last_visit WHERE lastVisit IS NULL AND last_visit IS NOT NULL;
UPDATE customers SET last_visit = lastVisit WHERE last_visit IS NULL AND lastVisit IS NOT NULL;
UPDATE customers SET totalPurchases = total_spent WHERE totalPurchases = 0 AND total_spent > 0;
UPDATE customers SET total_spent = totalPurchases WHERE total_spent = 0 AND totalPurchases > 0;
UPDATE customers SET visitCount = visits WHERE visitCount = 0 AND visits > 0;
UPDATE customers SET visits = visitCount WHERE visits = 0 AND visitCount > 0;
UPDATE customers SET loyaltyPoints = loyalty_points WHERE loyaltyPoints = 0 AND loyalty_points > 0;
UPDATE customers SET loyalty_points = loyaltyPoints WHERE loyalty_points = 0 AND loyaltyPoints > 0;