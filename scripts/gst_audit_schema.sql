-- GST Audit System Database Schema
-- This file contains all the necessary tables for comprehensive GST audit functionality

-- HSN/SAC Codes Table
CREATE TABLE IF NOT EXISTS hsn_sac_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(8) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    type VARCHAR(3) NOT NULL CHECK (type IN ('HSN', 'SAC')),
    category VARCHAR(100),
    unit VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_hsn_sac_codes_code ON hsn_sac_codes(code);
CREATE INDEX IF NOT EXISTS idx_hsn_sac_codes_type ON hsn_sac_codes(type);

-- GSTIN Master Table
CREATE TABLE IF NOT EXISTS gstin_master (
    id SERIAL PRIMARY KEY,
    gstin VARCHAR(15) NOT NULL UNIQUE,
    business_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    address TEXT,
    state_code VARCHAR(2),
    pincode VARCHAR(6),
    business_type VARCHAR(50),
    registration_date DATE,
    status VARCHAR(20) DEFAULT 'Active',
    last_verified TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for GSTIN lookups
CREATE INDEX IF NOT EXISTS idx_gstin_master_gstin ON gstin_master(gstin);
CREATE INDEX IF NOT EXISTS idx_gstin_master_state ON gstin_master(state_code);

-- Tax Rates Configuration
CREATE TABLE IF NOT EXISTS tax_rates (
    id SERIAL PRIMARY KEY,
    hsn_sac_code VARCHAR(8) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    cgst_rate DECIMAL(5,2) NOT NULL,
    sgst_rate DECIMAL(5,2) NOT NULL,
    igst_rate DECIMAL(5,2) NOT NULL,
    cess_rate DECIMAL(5,2) DEFAULT 0.00,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (hsn_sac_code) REFERENCES hsn_sac_codes(code)
);

-- GSTR Filings Table
CREATE TABLE IF NOT EXISTS gstr_filings (
    id SERIAL PRIMARY KEY,
    gstr_type VARCHAR(10) NOT NULL CHECK (gstr_type IN ('GSTR-1', 'GSTR-2', 'GSTR-3B', 'GSTR-4', 'GSTR-9')),
    period VARCHAR(6) NOT NULL, -- MMYYYY format
    gstin VARCHAR(15) NOT NULL,
    filing_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Filed', 'Revised', 'Cancelled')),
    filed_at TIMESTAMP WITH TIME ZONE,
    acknowledgment_number VARCHAR(50),
    reference_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for GSTR filings
CREATE INDEX IF NOT EXISTS idx_gstr_filings_type_period ON gstr_filings(gstr_type, period);
CREATE INDEX IF NOT EXISTS idx_gstr_filings_gstin ON gstr_filings(gstin);
CREATE INDEX IF NOT EXISTS idx_gstr_filings_status ON gstr_filings(status);

-- E-way Bills Table
CREATE TABLE IF NOT EXISTS eway_bills (
    id SERIAL PRIMARY KEY,
    eway_bill_number VARCHAR(20) NOT NULL UNIQUE,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    seller_gstin VARCHAR(15) NOT NULL,
    buyer_gstin VARCHAR(15),
    total_value DECIMAL(15,2) NOT NULL,
    transport_mode VARCHAR(10) DEFAULT 'Road',
    vehicle_number VARCHAR(20),
    transporter_id VARCHAR(15),
    distance INTEGER DEFAULT 0,
    eway_bill_data JSONB,
    status VARCHAR(20) DEFAULT 'Generated' CHECK (status IN ('Generated', 'Cancelled', 'Expired')),
    valid_upto TIMESTAMP WITH TIME ZONE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

-- Create indexes for e-way bills
CREATE INDEX IF NOT EXISTS idx_eway_bills_number ON eway_bills(eway_bill_number);
CREATE INDEX IF NOT EXISTS idx_eway_bills_invoice ON eway_bills(invoice_number);
CREATE INDEX IF NOT EXISTS idx_eway_bills_status ON eway_bills(status);

-- Audit Trail Table (Enhanced for GST compliance)
CREATE TABLE IF NOT EXISTS audit_trail (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(50),
    reference_number VARCHAR(50),
    description TEXT NOT NULL,
    amount DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    cgst_amount DECIMAL(15,2) DEFAULT 0.00,
    sgst_amount DECIMAL(15,2) DEFAULT 0.00,
    igst_amount DECIMAL(15,2) DEFAULT 0.00,
    cess_amount DECIMAL(15,2) DEFAULT 0.00,
    hsn_sac_code VARCHAR(8),
    gstin VARCHAR(15),
    place_of_supply VARCHAR(2),
    user_id VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit trail
CREATE INDEX IF NOT EXISTS idx_audit_trail_type ON audit_trail(transaction_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_date ON audit_trail(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_gstin ON audit_trail(gstin);

-- Purchases Table (for ITC calculation)
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    purchase_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_gstin VARCHAR(15),
    supplier_name VARCHAR(200) NOT NULL,
    purchase_date DATE NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    taxable_value DECIMAL(15,2) NOT NULL,
    cgst DECIMAL(15,2) DEFAULT 0.00,
    sgst DECIMAL(15,2) DEFAULT 0.00,
    igst DECIMAL(15,2) DEFAULT 0.00,
    cess DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    place_of_supply VARCHAR(2),
    reverse_charge BOOLEAN DEFAULT false,
    itc_eligible BOOLEAN DEFAULT true,
    itc_availed DECIMAL(15,2) DEFAULT 0.00,
    purchase_type VARCHAR(20) DEFAULT 'Goods',
    hsn_sac_code VARCHAR(8),
    description TEXT,
    quantity DECIMAL(10,3),
    unit VARCHAR(20),
    rate DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (hsn_sac_code) REFERENCES hsn_sac_codes(code)
);

-- Create indexes for purchases
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_gstin);
CREATE INDEX IF NOT EXISTS idx_purchases_invoice ON purchases(invoice_number);

-- GST Reconciliation Table
CREATE TABLE IF NOT EXISTS gst_reconciliation (
    id SERIAL PRIMARY KEY,
    period VARCHAR(6) NOT NULL, -- MMYYYY format
    gstin VARCHAR(15) NOT NULL,
    gstr1_total_sales DECIMAL(15,2) DEFAULT 0.00,
    gstr3b_total_sales DECIMAL(15,2) DEFAULT 0.00,
    gstr1_total_tax DECIMAL(15,2) DEFAULT 0.00,
    gstr3b_total_tax DECIMAL(15,2) DEFAULT 0.00,
    sales_difference DECIMAL(15,2) DEFAULT 0.00,
    tax_difference DECIMAL(15,2) DEFAULT 0.00,
    itc_availed DECIMAL(15,2) DEFAULT 0.00,
    itc_reversed DECIMAL(15,2) DEFAULT 0.00,
    net_tax_liability DECIMAL(15,2) DEFAULT 0.00,
    reconciliation_status VARCHAR(20) DEFAULT 'Pending',
    discrepancies JSONB,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for reconciliation
CREATE INDEX IF NOT EXISTS idx_gst_reconciliation_period ON gst_reconciliation(period);
CREATE INDEX IF NOT EXISTS idx_gst_reconciliation_gstin ON gst_reconciliation(gstin);

-- Compliance Alerts Table
CREATE TABLE IF NOT EXISTS compliance_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    due_date DATE,
    gstin VARCHAR(15),
    period VARCHAR(6),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Resolved', 'Dismissed')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for compliance alerts
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_type ON compliance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_status ON compliance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_due_date ON compliance_alerts(due_date);

-- Update existing sales table to include GST fields
ALTER TABLE sales ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(8);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_gstin VARCHAR(15);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_date DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS taxable_value DECIMAL(15,2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cgst DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sgst DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS igst DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cess DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS reverse_charge BOOLEAN DEFAULT false;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS supply_type VARCHAR(10) DEFAULT 'B2C';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS eway_bill_number VARCHAR(20);

-- Update existing products table to include HSN/SAC codes
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(8);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_type VARCHAR(10) DEFAULT 'GST';
ALTER TABLE products ADD COLUMN IF NOT EXISTS exempted BOOLEAN DEFAULT false;

-- Add foreign key constraints
ALTER TABLE sales ADD CONSTRAINT fk_sales_hsn_sac 
    FOREIGN KEY (hsn_sac_code) REFERENCES hsn_sac_codes(code) ON DELETE SET NULL;

ALTER TABLE products ADD CONSTRAINT fk_products_hsn_sac 
    FOREIGN KEY (hsn_sac_code) REFERENCES hsn_sac_codes(code) ON DELETE SET NULL;

-- Insert default HSN/SAC codes for common items
INSERT INTO hsn_sac_codes (code, description, tax_rate, type, category) VALUES
('2106', 'Food preparations not elsewhere specified', 12.00, 'HSN', 'Food Products'),
('2202', 'Waters, including mineral and aerated waters', 18.00, 'HSN', 'Beverages'),
('2009', 'Fruit juices and vegetable juices', 12.00, 'HSN', 'Beverages'),
('1704', 'Sugar confectionery', 18.00, 'HSN', 'Confectionery'),
('2105', 'Ice cream and other edible ice', 18.00, 'HSN', 'Dairy Products'),
('0813', 'Dried fruits and nuts', 5.00, 'HSN', 'Dry Fruits'),
('2008', 'Fruits and nuts prepared or preserved', 12.00, 'HSN', 'Preserved Foods'),
('996511', 'Retail trade services', 18.00, 'SAC', 'Services'),
('996512', 'Wholesale trade services', 18.00, 'SAC', 'Services'),
('997212', 'Food and beverage serving services', 5.00, 'SAC', 'Restaurant Services')
ON CONFLICT (code) DO NOTHING;

-- Insert default tax rates
INSERT INTO tax_rates (hsn_sac_code, tax_rate, cgst_rate, sgst_rate, igst_rate, effective_from) 
SELECT code, tax_rate, tax_rate/2, tax_rate/2, tax_rate, '2017-07-01'
FROM hsn_sac_codes
ON CONFLICT DO NOTHING;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_hsn_sac_codes_updated_at BEFORE UPDATE ON hsn_sac_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gstin_master_updated_at BEFORE UPDATE ON gstin_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gstr_filings_updated_at BEFORE UPDATE ON gstr_filings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gst_reconciliation_updated_at BEFORE UPDATE ON gst_reconciliation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_alerts_updated_at BEFORE UPDATE ON compliance_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW v_monthly_gst_summary AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    SUM(taxable_value) as total_taxable_value,
    SUM(cgst) as total_cgst,
    SUM(sgst) as total_sgst,
    SUM(igst) as total_igst,
    SUM(cess) as total_cess,
    SUM(cgst + sgst + igst + cess) as total_tax,
    COUNT(*) as transaction_count
FROM sales
WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

CREATE OR REPLACE VIEW v_hsn_wise_sales AS
SELECT 
    s.hsn_sac_code,
    h.description,
    h.tax_rate,
    SUM(s.taxable_value) as total_taxable_value,
    SUM(s.cgst + s.sgst + s.igst) as total_tax,
    COUNT(*) as transaction_count
FROM sales s
LEFT JOIN hsn_sac_codes h ON s.hsn_sac_code = h.code
WHERE s.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY s.hsn_sac_code, h.description, h.tax_rate
ORDER BY total_taxable_value DESC;

CREATE OR REPLACE VIEW v_compliance_dashboard AS
SELECT 
    'GSTR-1' as return_type,
    TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), 'MMYYYY') as period,
    CASE WHEN EXISTS (
        SELECT 1 FROM gstr_filings 
        WHERE gstr_type = 'GSTR-1' 
        AND period = TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), 'MMYYYY')
        AND status = 'Filed'
    ) THEN 'Filed' ELSE 'Pending' END as status,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '10 days' as due_date
UNION ALL
SELECT 
    'GSTR-3B' as return_type,
    TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), 'MMYYYY') as period,
    CASE WHEN EXISTS (
        SELECT 1 FROM gstr_filings 
        WHERE gstr_type = 'GSTR-3B' 
        AND period = TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), 'MMYYYY')
        AND status = 'Filed'
    ) THEN 'Filed' ELSE 'Pending' END as status,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '20 days' as due_date;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_hsn_sac_code ON sales(hsn_sac_code);
CREATE INDEX IF NOT EXISTS idx_sales_customer_gstin ON sales(customer_gstin);
CREATE INDEX IF NOT EXISTS idx_products_hsn_sac_code ON products(hsn_sac_code);

COMMIT;