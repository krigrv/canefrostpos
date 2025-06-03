# Context Migration Guide: Firebase to Supabase

This guide helps you migrate from Firebase InventoryContext to Supabase InventoryContext.

## Files Created

✅ **New Supabase Context**: `src/contexts/InventoryContextSupabase.jsx`
✅ **Updated CSV Upload**: `src/utils/simpleCSVUpload.js` (now uses Supabase)
✅ **Supabase Operations**: `src/utils/supabaseOperations.js`
✅ **Supabase Config**: `src/supabase/config.js`

## Migration Steps

### Step 1: Set Up Environment Variables

Add to your `.env` file:
```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 2: Test Supabase Connection

1. Start your development server:
   ```bash
   npm start
   ```

2. Open browser console and test:
   ```javascript
   import { testSupabaseConnection } from './src/supabase/config'
   testSupabaseConnection()
   ```

### Step 3: Switch to Supabase Context

**Option A: Gradual Migration (Recommended)**

1. Rename current context:
   ```bash
   mv src/contexts/InventoryContext.jsx src/contexts/InventoryContextFirebase.jsx
   ```

2. Rename Supabase context:
   ```bash
   mv src/contexts/InventoryContextSupabase.jsx src/contexts/InventoryContext.jsx
   ```

3. Update imports in components that use InventoryContext

**Option B: Side-by-Side Testing**

Keep both contexts and test individually:

```javascript
// In your test component
import { InventoryProvider as FirebaseProvider } from './contexts/InventoryContextFirebase'
import { InventoryProvider as SupabaseProvider } from './contexts/InventoryContextSupabase'

// Test with Supabase
<SupabaseProvider>
  <YourComponent />
</SupabaseProvider>
```

### Step 4: Update Components

Components using InventoryContext should work without changes, but verify:

1. **ProductManagement.jsx** - CSV upload should work
2. **POS components** - Cart operations should work
3. **Reports** - Product data should load

### Step 5: Data Migration (If Needed)

If you have existing Firebase data:

1. Set up migration script:
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_KEY="your_service_role_key"
   ```

2. Run migration:
   ```bash
   node scripts/migrateToSupabase.js
   ```

## Key Differences

### Data Structure Changes

| Firebase | Supabase | Notes |
|----------|----------|-------|
| `createdAt` | `created_at` | Snake case |
| `updatedAt` | `updated_at` | Snake case |
| `isVisible` | `is_visible` | Snake case |
| `taxPercentage` | `tax_percentage` | Snake case |
| Firestore Timestamp | ISO String | Date format |

### API Changes

| Operation | Firebase | Supabase |
|-----------|----------|----------|
| Create | `addDoc(collection, data)` | `supabaseOperations.products.create(data)` |
| Read | `getDocs(collection)` | `supabaseOperations.products.getAll()` |
| Update | `updateDoc(doc, data)` | `supabaseOperations.products.update(id, data)` |
| Delete | `deleteDoc(doc)` | `supabaseOperations.products.delete(id)` |
| Real-time | `onSnapshot()` | `supabaseOperations.subscriptions.products()` |

### Real-time Updates

**Firebase:**
```javascript
const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  setProducts(products)
})
```

**Supabase:**
```javascript
const unsubscribe = supabaseOperations.subscriptions.products((payload) => {
  switch (payload.eventType) {
    case 'INSERT':
      setProducts(prev => [...prev, payload.new])
      break
    case 'UPDATE':
      setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
      break
    case 'DELETE':
      setProducts(prev => prev.filter(p => p.id !== payload.old.id))
      break
  }
})
```

## Testing Checklist

### Basic Operations
- [ ] Load products on app start
- [ ] Add new product
- [ ] Edit existing product
- [ ] Delete product
- [ ] Search products
- [ ] Filter by category

### Cart Operations
- [ ] Add product to cart
- [ ] Update cart quantity
- [ ] Remove from cart
- [ ] Clear cart

### Bulk Operations
- [ ] Bulk delete products
- [ ] Bulk update visibility
- [ ] CSV import

### Real-time Features
- [ ] Real-time product updates
- [ ] Multiple browser tabs sync
- [ ] Network reconnection

### Advanced Features
- [ ] Stock management
- [ ] Low stock alerts
- [ ] Inventory statistics
- [ ] Category management

## Troubleshooting

### Common Issues

1. **"Cannot read properties of undefined"**
   - Check environment variables are set
   - Verify Supabase project is active

2. **"Row Level Security policy violation"**
   - Check RLS policies in Supabase
   - Verify user authentication

3. **"Real-time not working"**
   - Check Supabase real-time settings
   - Verify subscription setup

4. **"Data format errors"**
   - Check snake_case vs camelCase
   - Verify date formats (ISO strings)

### Debug Mode

Enable debug logging:
```javascript
// In supabase/config.js
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
})
```

### Rollback Plan

If issues occur:

1. **Quick Rollback:**
   ```bash
   mv src/contexts/InventoryContext.jsx src/contexts/InventoryContextSupabase.jsx
   mv src/contexts/InventoryContextFirebase.jsx src/contexts/InventoryContext.jsx
   ```

2. **Restore CSV Upload:**
   ```bash
   git checkout HEAD -- src/utils/simpleCSVUpload.js
   ```

## Performance Comparison

### Expected Improvements

✅ **Faster Queries**: PostgreSQL with proper indexing
✅ **Better Real-time**: More efficient subscriptions
✅ **Reduced Costs**: Supabase pricing vs Firestore
✅ **SQL Power**: Complex queries and joins
✅ **Better Tooling**: PostgreSQL ecosystem

### Monitoring

Monitor performance:
- Query execution times
- Real-time subscription latency
- Database connection pool usage
- Memory usage

## Next Steps

1. ✅ Set up Supabase project and environment
2. ✅ Test basic CRUD operations
3. ✅ Verify real-time subscriptions
4. ✅ Test CSV import functionality
5. ⏳ Migrate other contexts (Customer, Sales, etc.)
6. ⏳ Update remaining components
7. ⏳ Deploy to production
8. ⏳ Monitor and optimize

## Support

If you encounter issues:
1. Check this guide first
2. Review Supabase documentation
3. Check browser console for errors
4. Test with simplified data
5. Verify environment variables

Good luck with your migration! 🚀