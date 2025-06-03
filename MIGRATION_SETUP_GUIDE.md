# Firebase to Supabase Data Migration Guide

This guide will help you migrate your existing Firebase data to Supabase using the migration script.

## Prerequisites

### 1. Supabase Setup
- ✅ Supabase project created
- ✅ Database schema applied (`scripts/supabase_schema.sql`)
- ✅ Environment variables configured

### 2. Firebase Admin SDK Setup
You need Firebase Admin SDK credentials to read data from Firebase.

## Step 1: Get Firebase Admin SDK Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`canefrostpos`)
3. Go to **Project Settings** (gear icon)
4. Click on **Service Accounts** tab
5. Click **Generate new private key**
6. Download the JSON file

## Step 2: Get Supabase Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Service Role Key** (starts with `eyJ...`)
   - ⚠️ **Important**: This is different from the anon key and has admin privileges

## Step 3: Configure Environment Variables

Add these variables to your `.env` file:

```env
# Firebase Admin SDK (from the downloaded JSON file)
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@canefrostpos.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40canefrostpos.iam.gserviceaccount.com

# Supabase Service Role Key (for admin operations)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Environment Variable Mapping

From your Firebase Admin SDK JSON file, map these values:

| JSON Field | Environment Variable |
|------------|---------------------|
| `private_key_id` | `FIREBASE_PRIVATE_KEY_ID` |
| `private_key` | `FIREBASE_PRIVATE_KEY` |
| `client_email` | `FIREBASE_CLIENT_EMAIL` |
| `client_id` | `FIREBASE_CLIENT_ID` |
| `client_x509_cert_url` | `FIREBASE_CLIENT_X509_CERT_URL` |

## Step 4: Install Dependencies

The migration script requires `firebase-admin`:

```bash
npm install firebase-admin
```

## Step 5: Run the Migration

```bash
node scripts/migrateToSupabase.js
```

### What the Script Does

1. **Export Phase**: Reads data from Firebase collections and saves to `scripts/exports/` folder
2. **Transform Phase**: Converts Firebase data format to Supabase format
3. **Import Phase**: Uploads data to Supabase tables
4. **Verify Phase**: Compares record counts between Firebase and Supabase

### Collections Migrated

- `products`
- `categories`
- `sales`
- `customers`
- `staff`
- `outlets`
- `accessCodes`
- `shifts`
- `security_logs`
- `audit_logs`
- `backups`
- `compliance_reports`

## Step 6: Verify Migration

After migration completes:

1. Check the console output for any errors
2. Verify record counts match between Firebase and Supabase
3. Test your application with the migrated data
4. Check Supabase dashboard to confirm data is present

## Troubleshooting

### Common Issues

**1. Firebase Admin SDK Authentication Error**
```
Error: Could not load the default credentials
```
**Solution**: Ensure all Firebase environment variables are correctly set

**2. Supabase Connection Error**
```
Error: Invalid API key
```
**Solution**: Verify `SUPABASE_SERVICE_KEY` is the service role key, not anon key

**3. Permission Denied**
```
Error: Row Level Security policy violation
```
**Solution**: The service role key bypasses RLS, ensure you're using the correct key

**4. Data Transformation Errors**
- Check the `scripts/exports/` folder for exported JSON files
- Verify data structure matches expected format
- Check console logs for specific transformation errors

### Manual Verification

You can manually check the exported data:

```bash
# View exported products
cat scripts/exports/products.json | jq '.[0]'

# Count exported records
cat scripts/exports/products.json | jq 'length'
```

## Security Notes

- ⚠️ **Never commit** the Firebase Admin SDK JSON file to version control
- ⚠️ **Never commit** the service role key to version control
- ✅ Use environment variables for all sensitive credentials
- ✅ Add `.env` to your `.gitignore` file

## Post-Migration Steps

1. **Test Application**: Ensure all features work with Supabase
2. **Update Contexts**: Switch from Firebase to Supabase contexts
3. **Deploy**: Update production environment variables
4. **Cleanup**: Optionally remove Firebase collections (keep Auth)

## Rollback Plan

If you need to rollback:

1. Switch back to `InventoryContextFirebase.jsx`
2. Revert environment variables
3. Your Firebase data remains unchanged

---

**Need Help?** Check the other migration guides:
- `SUPABASE_SETUP_GUIDE.md` - Initial Supabase setup
- `CONTEXT_MIGRATION_GUIDE.md` - Context switching guide
- `SUPABASE_MIGRATION_PLAN.md` - Overall migration strategy