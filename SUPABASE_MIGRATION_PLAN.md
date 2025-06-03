# Firebase to Supabase Migration Plan

## Overview
Migrate from Firebase to Supabase while keeping Firebase Auth for authentication only.

## Phase 1: Supabase Setup

### 1.1 Install Supabase Dependencies
```bash
npm install @supabase/supabase-js
```

### 1.2 Create Supabase Configuration
Create `src/supabase/config.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 1.3 Environment Variables
Add to `.env`:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Phase 2: Database Schema Creation

### 2.1 Core Tables
Create these tables in Supabase:

```sql
-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  size TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  customer_id UUID,
  staff_id UUID,
  outlet_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff table
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'staff',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outlets table
CREATE TABLE outlets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access codes table
CREATE TABLE access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shifts table
CREATE TABLE shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  outlet_id UUID REFERENCES outlets(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security logs table
CREATE TABLE security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backups table
CREATE TABLE backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  file_path TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance reports table
CREATE TABLE compliance_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL,
  data JSONB,
  generated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

-- Create policies (example for products)
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON products FOR DELETE USING (true);
```

## Phase 3: Context Migration

### 3.1 Update InventoryContext.jsx
Replace Firebase operations with Supabase:

```javascript
import { supabase } from '../supabase/config'

// Replace Firestore operations
const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

const addProduct = async (product) => {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
  
  if (error) throw error
  return data[0]
}

const updateProduct = async (id, updates) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0]
}

const deleteProduct = async (id) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Real-time subscriptions
const subscribeToProducts = (callback) => {
  const subscription = supabase
    .channel('products')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'products'
    }, callback)
    .subscribe()
  
  return () => subscription.unsubscribe()
}
```

### 3.2 Keep AuthContext.jsx with Firebase
Keep Firebase Auth as is - no changes needed.

### 3.3 Update Other Contexts
- CustomerContext.jsx → Supabase customers table
- StaffContext.jsx → Supabase staff table
- SettingsContext.jsx → Supabase configuration

## Phase 4: Utility Migration

### 4.1 Create Supabase Utilities
Create `src/utils/supabaseOperations.js`:

```javascript
import { supabase } from '../supabase/config'

export const supabaseOperations = {
  // Products
  products: {
    getAll: () => supabase.from('products').select('*'),
    getById: (id) => supabase.from('products').select('*').eq('id', id).single(),
    create: (product) => supabase.from('products').insert([product]).select(),
    update: (id, updates) => supabase.from('products').update(updates).eq('id', id).select(),
    delete: (id) => supabase.from('products').delete().eq('id', id),
    bulkUpdate: (updates) => supabase.from('products').upsert(updates)
  },
  
  // Sales
  sales: {
    getAll: () => supabase.from('sales').select('*').order('created_at', { ascending: false }),
    create: (sale) => supabase.from('sales').insert([sale]).select(),
    getByDateRange: (startDate, endDate) => 
      supabase.from('sales')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
  },
  
  // Categories
  categories: {
    getAll: () => supabase.from('categories').select('*'),
    create: (category) => supabase.from('categories').insert([category]).select(),
    update: (id, updates) => supabase.from('categories').update(updates).eq('id', id).select(),
    delete: (id) => supabase.from('categories').delete().eq('id', id)
  }
}
```

### 4.2 Update CSV Upload Utility
Update `src/utils/simpleCSVUpload.js` to use Supabase:

```javascript
import { supabase } from '../supabase/config'

export const uploadCSVProducts = async (file, onProgress) => {
  // ... existing CSV parsing logic ...
  
  // Replace Firebase batch with Supabase batch insert
  const { data, error } = await supabase
    .from('products')
    .insert(productsToAdd)
  
  if (error) throw error
  return data
}
```

## Phase 5: Component Updates

### 5.1 Update ProductManagement Component
- Replace Firebase operations with Supabase
- Update real-time subscriptions
- Maintain existing UI/UX

### 5.2 Update Sales Components
- Migrate sales recording to Supabase
- Update sales history queries
- Maintain reporting functionality

### 5.3 Update Settings Component
- Remove Firebase-specific cleanup operations
- Add Supabase-specific maintenance tools
- Keep CSV import functionality

## Phase 6: Data Migration

### 6.1 Export Firebase Data
Create migration script `scripts/exportFirebaseData.js`:

```javascript
const admin = require('firebase-admin')
const fs = require('fs')

// Export all collections
const exportCollection = async (collectionName) => {
  const snapshot = await admin.firestore().collection(collectionName).get()
  const data = []
  
  snapshot.forEach(doc => {
    data.push({ id: doc.id, ...doc.data() })
  })
  
  fs.writeFileSync(`./exports/${collectionName}.json`, JSON.stringify(data, null, 2))
}

// Export all collections
const collections = ['products', 'sales', 'customers', 'categories', 'staff', 'outlets']
collections.forEach(exportCollection)
```

### 6.2 Import to Supabase
Create migration script `scripts/importToSupabase.js`:

```javascript
import { supabase } from '../src/supabase/config'
import fs from 'fs'

const importCollection = async (tableName) => {
  const data = JSON.parse(fs.readFileSync(`./exports/${tableName}.json`, 'utf8'))
  
  // Transform data if needed (Firebase ID to UUID, timestamps, etc.)
  const transformedData = data.map(item => ({
    ...item,
    // Convert Firebase timestamps to ISO strings
    created_at: item.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
  }))
  
  const { error } = await supabase.from(tableName).insert(transformedData)
  if (error) console.error(`Error importing ${tableName}:`, error)
  else console.log(`Successfully imported ${tableName}`)
}
```

## Phase 7: Testing & Deployment

### 7.1 Testing Checklist
- [ ] Authentication still works with Firebase
- [ ] All CRUD operations work with Supabase
- [ ] Real-time updates function correctly
- [ ] CSV import works with new system
- [ ] Sales recording and reporting work
- [ ] Data integrity maintained

### 7.2 Deployment Strategy
1. Deploy Supabase schema
2. Run data migration scripts
3. Deploy updated application
4. Monitor for issues
5. Cleanup Firebase collections (keep Auth)

## Phase 8: Cleanup

### 8.1 Remove Firebase Dependencies
```bash
npm uninstall firebase-admin
# Keep firebase for auth only
```

### 8.2 Update Package.json
Remove unused Firebase packages, keep only:
```json
{
  "dependencies": {
    "firebase": "^10.x.x",
    "@supabase/supabase-js": "^2.x.x"
  }
}
```

### 8.3 Clean Up Files
- Remove `src/utils/databaseCleanup.js`
- Remove Firebase-specific utilities
- Update documentation

## Benefits of This Migration

1. **Cost Efficiency**: Supabase often more cost-effective than Firestore
2. **SQL Power**: Full PostgreSQL capabilities
3. **Better Performance**: Optimized queries and indexing
4. **Real-time**: Built-in real-time subscriptions
5. **Simplified Auth**: Keep familiar Firebase Auth
6. **Better Tooling**: PostgreSQL ecosystem and tools

## Estimated Timeline

- **Phase 1-2**: 2-3 days (Setup & Schema)
- **Phase 3-4**: 3-4 days (Context & Utility Migration)
- **Phase 5**: 2-3 days (Component Updates)
- **Phase 6**: 1-2 days (Data Migration)
- **Phase 7**: 2-3 days (Testing)
- **Phase 8**: 1 day (Cleanup)

**Total: 11-16 days**

## Next Steps

1. Set up Supabase project
2. Create database schema
3. Start with InventoryContext migration
4. Test thoroughly before proceeding

This plan maintains Firebase Auth while moving all data operations to Supabase, providing the best of both worlds.