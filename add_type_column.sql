-- SQL script to add type column to products table

-- Add type column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'products' AND column_name = 'type') THEN
    ALTER TABLE products ADD COLUMN type TEXT;
  END IF;
END $$;

-- Ensure RLS policies allow the column to be updated
CREATE OR REPLACE POLICY "Enable update for authenticated users" ON "public"."products"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure categories exist
INSERT INTO categories (name, description)
VALUES 
  ('Cane Blend', 'Regular blended cane products'),
  ('Cane Fusion', 'Premium fusion cane products'),
  ('Cane Pops', 'Small bottle cane products'),
  ('Special', 'Special and seasonal products'),
  ('Other', 'Other miscellaneous products')
ON CONFLICT (name) DO NOTHING;