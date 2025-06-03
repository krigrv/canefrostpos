-- SQL script to restructure categories table with simplified names and separate barcode column

-- First, let's see the current structure
-- SELECT * FROM categories;

-- Drop the existing categories table if it exists
DROP TABLE IF EXISTS categories;

-- Create new categories table with simplified structure
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the simplified category data
INSERT INTO categories (name, barcode) VALUES
    ('Cane Fusion', 'CFRST56'),
    ('Cane Juice', 'CFRST01'),
    ('Cane Pops', 'CFRST68'),
    ('Others', 'CFRST89'),
    ('Special', 'CFRST87');

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow read access for anonymous users
CREATE POLICY "Allow read access for anonymous users" ON categories
    FOR SELECT USING (true);

-- Verify the data
SELECT * FROM categories ORDER BY name;