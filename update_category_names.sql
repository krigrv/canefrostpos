-- Update script to change 'Spiced Herbal Others' to 'Spiced/Herbal/Others'
-- Run this in Supabase SQL Editor

-- Update categories table first (to satisfy foreign key constraint)
UPDATE categories 
SET name = 'Spiced/Herbal/Others' 
WHERE name = 'Spiced Herbal Others';

-- Update products table
UPDATE products 
SET type = 'Spiced/Herbal/Others' 
WHERE type = 'Spiced Herbal Others';

-- Verify the updates
SELECT 'Products updated:' as status;
SELECT COUNT(*) as count FROM products WHERE type = 'Spiced/Herbal/Others';

SELECT 'Categories updated:' as status;
SELECT name, description FROM categories WHERE name = 'Spiced/Herbal/Others';

SELECT 'Update completed successfully!' as result;