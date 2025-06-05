-- Supabase Database Schema for Canefrost POS
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT REFERENCES categories(name) ON UPDATE CASCADE,
  price DECIMAL(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  size TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outlets table
CREATE TABLE IF NOT EXISTS outlets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  customer_id UUID REFERENCES customers(id),
  staff_id UUID REFERENCES staff(id),
  outlet_id UUID REFERENCES outlets(id),
  transactionId TEXT,
  cashAmount DECIMAL(10,2) DEFAULT 0,
  upiAmount DECIMAL(10,2) DEFAULT 0,
  changeAmount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access codes table
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  outlet_id UUID REFERENCES outlets(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backups table
CREATE TABLE IF NOT EXISTS backups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  file_path TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_type TEXT NOT NULL,
  data JSONB,
  generated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_visible ON products(visible);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_staff_id ON sales(staff_id);
CREATE INDEX IF NOT EXISTS idx_sales_outlet_id ON sales(outlet_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - customize based on your needs)

-- Categories policies
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON categories FOR DELETE USING (true);

-- Products policies
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON products FOR DELETE USING (true);

-- Customers policies
CREATE POLICY "Enable read access for all users" ON customers FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON customers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON customers FOR DELETE USING (true);

-- Staff policies
CREATE POLICY "Enable read access for all users" ON staff FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON staff FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON staff FOR DELETE USING (true);

-- Outlets policies
CREATE POLICY "Enable read access for all users" ON outlets FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON outlets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON outlets FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON outlets FOR DELETE USING (true);

-- Sales policies
CREATE POLICY "Enable read access for all users" ON sales FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON sales FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON sales FOR DELETE USING (true);

-- Access codes policies
CREATE POLICY "Enable read access for all users" ON access_codes FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON access_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON access_codes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON access_codes FOR DELETE USING (true);

-- Shifts policies
CREATE POLICY "Enable read access for all users" ON shifts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON shifts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON shifts FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON shifts FOR DELETE USING (true);

-- Security logs policies
CREATE POLICY "Enable read access for all users" ON security_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON security_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON security_logs FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON security_logs FOR DELETE USING (true);

-- Audit logs policies
CREATE POLICY "Enable read access for all users" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON audit_logs FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON audit_logs FOR DELETE USING (true);

-- Backups policies
CREATE POLICY "Enable read access for all users" ON backups FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON backups FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON backups FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON backups FOR DELETE USING (true);

-- Compliance reports policies
CREATE POLICY "Enable read access for all users" ON compliance_reports FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON compliance_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON compliance_reports FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON compliance_reports FOR DELETE USING (true);

-- Create functions for common operations

-- Function to get sales statistics
CREATE OR REPLACE FUNCTION get_sales_stats(start_date TIMESTAMP WITH TIME ZONE, end_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
  total_sales BIGINT,
  total_revenue DECIMAL,
  avg_sale_amount DECIMAL,
  top_selling_products JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_sales,
    COALESCE(SUM(s.total), 0) as total_revenue,
    COALESCE(AVG(s.total), 0) as avg_sale_amount,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'product_name', item->>'name',
            'quantity_sold', SUM((item->>'quantity')::INTEGER),
            'revenue', SUM((item->>'quantity')::INTEGER * (item->>'price')::DECIMAL)
          )
        )
        FROM sales s2,
             jsonb_array_elements(s2.items) as item
        WHERE s2.created_at >= start_date AND s2.created_at <= end_date
        GROUP BY item->>'name'
        ORDER BY SUM((item->>'quantity')::INTEGER) DESC
        LIMIT 10
      ),
      '[]'::jsonb
    ) as top_selling_products
  FROM sales s
  WHERE s.created_at >= start_date AND s.created_at <= end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock after sale
CREATE OR REPLACE FUNCTION update_product_stock_after_sale()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
BEGIN
  -- Loop through each item in the sale
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    -- Update product stock
    UPDATE products 
    SET 
      stock = stock - (item->>'quantity')::INTEGER,
      updated_at = NOW()
    WHERE name = item->>'name';
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update product stock after sale
CREATE TRIGGER trigger_update_stock_after_sale
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_after_sale();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Berries', 'Fresh berry products'),
  ('Citrus', 'Citrus fruit products'),
  ('Tropical', 'Tropical fruit products'),
  ('Spiced/Herbal/Others', 'Spiced, herbal and other specialty products')
ON CONFLICT (name) DO NOTHING;

-- Insert default outlet
INSERT INTO outlets (name, address) VALUES
  ('Main Store', 'Primary retail location')
ON CONFLICT DO NOTHING;

-- Insert default access codes
INSERT INTO access_codes (code, role) VALUES
  ('ADMIN2024', 'admin'),
  ('MANAGER2024', 'manager'),
  ('STAFF2024', 'staff')
ON CONFLICT (code) DO NOTHING;

-- Create a view for product inventory summary
CREATE OR REPLACE VIEW product_inventory_summary AS
SELECT 
  p.id,
  p.name,
  p.category,
  p.price,
  p.stock,
  p.visible,
  p.size,
  CASE 
    WHEN p.stock <= 0 THEN 'Out of Stock'
    WHEN p.stock <= 10 THEN 'Low Stock'
    ELSE 'In Stock'
  END as stock_status,
  p.created_at,
  p.updated_at
FROM products p
ORDER BY p.name;

-- Create a view for sales summary
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
  s.id,
  s.total,
  s.payment_method,
  s.created_at,
  c.name as customer_name,
  st.name as staff_name,
  o.name as outlet_name,
  jsonb_array_length(s.items) as item_count
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN staff st ON s.staff_id = st.id
LEFT JOIN outlets o ON s.outlet_id = o.id
ORDER BY s.created_at DESC;

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security for user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON user_profiles 
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings 
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for user tables
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Grant necessary permissions (adjust based on your needs)
-- These are basic permissions - customize based on your security requirements

COMMENT ON TABLE products IS 'Product inventory table';
COMMENT ON TABLE sales IS 'Sales transactions table';
COMMENT ON TABLE customers IS 'Customer information table';
COMMENT ON TABLE categories IS 'Product categories table';
COMMENT ON TABLE staff IS 'Staff members table';
COMMENT ON TABLE outlets IS 'Store outlets table';
COMMENT ON TABLE access_codes IS 'Access codes for different roles';
COMMENT ON TABLE shifts IS 'Staff work shifts table';
COMMENT ON TABLE security_logs IS 'Security event logs';
COMMENT ON TABLE audit_logs IS 'Data change audit logs';
COMMENT ON TABLE backups IS 'Database backup records';
COMMENT ON TABLE compliance_reports IS 'Compliance and regulatory reports';
COMMENT ON TABLE user_profiles IS 'User business profile information';
COMMENT ON TABLE user_settings IS 'User application settings and preferences';

-- Success message
SELECT 'Supabase schema setup completed successfully!' as message;