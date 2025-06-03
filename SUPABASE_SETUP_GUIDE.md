# Supabase Setup Guide

This guide will help you set up Supabase for your Canefrost POS application while keeping Firebase Auth.

## Prerequisites

- Node.js and npm installed
- Firebase project (for authentication)
- Supabase account

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `canefrost-pos`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be ready (2-3 minutes)

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `scripts/supabase_schema.sql`
3. Paste it in the SQL Editor
4. Click **Run** to execute the schema
5. Verify tables are created in **Table Editor**

## Step 3: Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - **service_role key** (for migration script only)

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your credentials:
   ```env
   # Firebase (keep existing values for auth)
   REACT_APP_FIREBASE_API_KEY=your_existing_firebase_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   
   # Supabase (add new)
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Step 5: Test Supabase Connection

1. Start your development server:
   ```bash
   npm start
   ```

2. Open browser console and test connection:
   ```javascript
   import { testSupabaseConnection } from './src/supabase/config'
   testSupabaseConnection()
   ```

## Step 6: Data Migration (Optional)

If you have existing Firebase data:

1. Set up Firebase Admin SDK:
   - Download service account key from Firebase Console
   - Update `scripts/migrateToSupabase.js` with your config

2. Set migration environment variables:
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_KEY="your_service_role_key"
   ```

3. Run migration:
   ```bash
   node scripts/migrateToSupabase.js
   ```

## Step 7: Update Application Code

### Phase 1: Update InventoryContext

1. Open `src/contexts/InventoryContext.jsx`
2. Replace Firebase imports with Supabase:
   ```javascript
   // Remove
   import { db } from '../firebase/config'
   import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
   
   // Add
   import { supabaseOperations } from '../utils/supabaseOperations'
   ```

3. Replace Firebase operations:
   ```javascript
   // Old Firebase way
   const fetchProducts = async () => {
     const snapshot = await getDocs(collection(db, 'products'))
     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
   }
   
   // New Supabase way
   const fetchProducts = async () => {
     return await supabaseOperations.products.getAll()
   }
   ```

### Phase 2: Update Real-time Subscriptions

```javascript
// Old Firebase way
const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  setProducts(products)
})

// New Supabase way
const unsubscribe = supabaseOperations.subscriptions.products((payload) => {
  console.log('Change received!', payload)
  // Refresh products
  fetchProducts()
})
```

### Phase 3: Update Other Contexts

Repeat similar process for:
- `CustomerContext.jsx`
- `StaffContext.jsx` 
- `SalesHistory.jsx`
- Other components using Firebase

## Step 8: Update CSV Upload

Update `src/utils/simpleCSVUpload.js`:

```javascript
// Replace Firebase operations
import { supabaseOperations } from './supabaseOperations'

export const uploadCSVProducts = async (file, onProgress) => {
  // ... existing parsing logic ...
  
  // Replace Firebase batch with Supabase
  const results = await supabaseOperations.products.bulkUpdate(productsToAdd)
  return results
}
```

## Step 9: Testing Checklist

- [ ] Authentication works (Firebase Auth)
- [ ] Products CRUD operations work
- [ ] Sales recording works
- [ ] Real-time updates work
- [ ] CSV import works
- [ ] Reports and analytics work
- [ ] Mobile responsiveness maintained

## Step 10: Deployment

### Vercel Deployment

1. Add environment variables to Vercel:
   - Go to your Vercel project settings
   - Add all environment variables from `.env`
   - Deploy

### Environment Variables for Production

```env
# Firebase (Production)
REACT_APP_FIREBASE_API_KEY=prod_firebase_key
REACT_APP_FIREBASE_AUTH_DOMAIN=prod_project.firebaseapp.com
# ... other Firebase vars

# Supabase (Production)
REACT_APP_SUPABASE_URL=https://prod-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=prod_supabase_anon_key
```

## Step 11: Cleanup (After Successful Migration)

1. Remove unused Firebase dependencies:
   ```bash
   npm uninstall firebase-admin
   ```

2. Remove Firebase-specific files:
   - `src/utils/databaseCleanup.js`
   - Firebase-specific utilities

3. Update documentation

## Troubleshooting

### Common Issues

1. **Connection Error**
   - Check environment variables
   - Verify Supabase project is active
   - Check network connectivity

2. **RLS Policy Error**
   - Verify RLS policies are set correctly
   - Check user permissions
   - Temporarily disable RLS for testing

3. **Migration Issues**
   - Check data format compatibility
   - Verify Firebase Admin SDK setup
   - Check Supabase service role key

4. **Real-time Not Working**
   - Check Supabase real-time settings
   - Verify subscription setup
   - Check browser console for errors

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Benefits After Migration

✅ **Cost Savings**: Supabase often more cost-effective than Firestore

✅ **SQL Power**: Full PostgreSQL capabilities for complex queries

✅ **Better Performance**: Optimized queries and indexing

✅ **Real-time**: Built-in real-time subscriptions

✅ **Familiar Auth**: Keep Firebase Auth you're already using

✅ **Better Tooling**: PostgreSQL ecosystem and tools

✅ **Scalability**: Better scaling options

## Next Steps

1. Set up Supabase project
2. Run database schema
3. Configure environment variables
4. Test connection
5. Start migrating contexts one by one
6. Test thoroughly
7. Deploy to production

Good luck with your migration! 🚀