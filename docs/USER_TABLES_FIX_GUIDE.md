# User Tables Fix Guide

## Issue Description

The application is encountering 404 Not Found errors when trying to fetch data from `user_settings` and `user_profiles` tables in Supabase:

```
GET https://zqmdjuqyljehirflbkge.supabase.co/rest/v1/user_settings?select=settings&user_id=eq.c7f44d96-5c43-4a7b-9019-9d88a566696c 404 (Not Found)
GET https://zqmdjuqyljehirflbkge.supabase.co/rest/v1/user_profiles?select=business_details&user_id=eq.c7f44d96-5c43-4a7b-9019-9d88a566696c 404 (Not Found)
```

## Root Cause

The `user_profiles` and `user_settings` tables are missing from the current Supabase database instance. These tables are required for:

- **user_profiles**: Storing business details like store name, address, phone, email, and GSTIN
- **user_settings**: Storing application settings like tax rates, currency, receipt headers/footers

## Tables Schema

### user_profiles Table
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### user_settings Table
```sql
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## Solution

### Option 1: Automated Script (Recommended)

1. **Run the automated fix script:**
   ```bash
   node execute_user_tables_fix.mjs
   ```

2. **Verify the script execution:**
   - Check console output for success messages
   - Verify tables are accessible in Supabase dashboard

### Option 2: Manual SQL Execution

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Execute the user tables creation script:**
   - Copy the contents of `scripts/create_user_tables.sql`
   - Paste and run in SQL Editor

3. **Verify table creation:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('user_profiles', 'user_settings');
   ```

## What the Fix Includes

### Tables Created
- `user_profiles` - Business profile information
- `user_settings` - Application settings and preferences

### Security Features
- **Row Level Security (RLS)** enabled on both tables
- **RLS Policies** ensuring users can only access their own data:
  - SELECT: Users can view their own records
  - INSERT: Users can create their own records
  - UPDATE: Users can modify their own records
  - DELETE: Users can delete their own records

### Performance Optimizations
- **Indexes** on `user_id` columns for faster queries
- **Unique constraints** to prevent duplicate user records

### Default Data
- **Default business details** for existing users:
  ```json
  {
    "storeName": "CaneFrost POS",
    "storeAddress": "",
    "storePhone": "",
    "storeEmail": "",
    "gstin": ""
  }
  ```

- **Default settings** for existing users:
  ```json
  {
    "storeName": "CaneFrost POS",
    "defaultTaxRate": 18,
    "enableTax": true,
    "currency": "INR",
    "currencySymbol": "₹",
    "receiptHeader": "Thank you for your purchase!",
    "receiptFooter": "Visit us again!"
  }
  ```

## Verification

After applying the fix, verify the tables are working:

1. **Check table existence:**
   ```sql
   SELECT COUNT(*) FROM user_profiles;
   SELECT COUNT(*) FROM user_settings;
   ```

2. **Test application:**
   - Refresh the application
   - Check browser console for 404 errors
   - Verify settings and profile pages load correctly

3. **Check logs:**
   - Should see "Settings loaded successfully" instead of "Settings table not found"
   - Should see business name loaded instead of "using default business name"

## Files Modified

- `execute_user_tables_fix.mjs` - Automated fix script
- `scripts/supabase_schema.sql` - Updated to include user tables
- `SUPABASE_MIGRATION_PLAN.md` - Updated migration plan
- `docs/USER_TABLES_FIX_GUIDE.md` - This documentation

## Environment Variables Required

Ensure these environment variables are set:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

## Troubleshooting

### Script Execution Fails
- Verify environment variables are set correctly
- Check Supabase project is accessible
- Ensure service role key has sufficient permissions

### Tables Created but Still Getting 404s
- Check RLS policies are correctly applied
- Verify user authentication is working
- Check if user_id matches authenticated user ID

### Permission Denied Errors
- Ensure RLS policies are correctly configured
- Check user is properly authenticated
- Verify auth.uid() returns correct user ID