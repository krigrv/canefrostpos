-- Complete setup script for adding type column and ensuring categories
-- Run this in Supabase SQL Editor

-- 1. Add type column to products table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'products' AND column_name = 'type') THEN
    ALTER TABLE products ADD COLUMN type TEXT;
    RAISE NOTICE 'Added type column to products table';
  ELSE
    RAISE NOTICE 'Type column already exists in products table';
  END IF;
END $$;

-- 2. Update RLS policies for products table to allow type column updates
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."products";
CREATE POLICY "Enable update for authenticated users" ON "public"."products"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Temporarily disable RLS on categories table to insert required categories
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- 4. Insert required categories
INSERT INTO categories (name, description)
VALUES 
  ('Cane Blend', 'Regular blended cane products'),
  ('Cane Fusion', 'Premium fusion cane products'),
  ('Cane Pops', 'Small bottle cane products'),
  ('Special', 'Special and seasonal products'),
  ('Spiced/Herbal/Others', 'Spiced, herbal and other specialty products'),
  ('Other', 'Other miscellaneous products')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description;

-- 5. Re-enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 6. Ensure proper RLS policies for categories
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."categories";
CREATE POLICY "Enable read access for all users" ON "public"."categories"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."categories";
CREATE POLICY "Enable insert for authenticated users" ON "public"."categories"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."categories";
CREATE POLICY "Enable update for authenticated users" ON "public"."categories"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Verify the setup
SELECT 'Categories created:' as status;
SELECT name, description FROM categories ORDER BY name;

SELECT 'Type column added to products:' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'type';

-- Success message
SELECT 'Setup completed successfully! Type column added and categories ensured.' as result;