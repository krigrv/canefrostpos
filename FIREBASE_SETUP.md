# Firebase Setup Guide for Canefrost POS

## 🔥 Firebase Configuration Steps

### Step 1: Configure Firebase Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **canefrostpos**
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all products
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow read access to volume-categorized products
    match /products_{volume}/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to manage sales
    match /sales/{saleId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Click **Publish** to deploy the rules

### Step 2: Get Firebase Service Account Key (Optional)

**For automatic upload with authentication:**

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to **Service Accounts** tab
3. Click **Generate new private key**
4. Save the downloaded file as `serviceAccountKey.json` in your project root
5. **⚠️ IMPORTANT**: Add `serviceAccountKey.json` to your `.gitignore` file

**For testing without service account:**
- The script will attempt to use default credentials
- You can also temporarily set rules to `allow read, write: if true;` for testing

### Step 3: Upload Products to Firebase

Run the upload script:

```bash
npm run upload-firebase
```

This will:
- ✅ Clear existing products
- ✅ Upload all 94 products from your cleaned inventory
- ✅ Categorize products by volume (240ml, 500ml, 1 litre, others)
- ✅ Create volume-based collections for better organization

### Step 4: Verify Upload

1. Check Firebase Console → Firestore Database
2. You should see:
   - `products` collection with all items
   - `products_240ml` collection
   - `products_500ml` collection
   - `products_1litre` collection
   - `products_others` collection

### Step 5: Test Live Data

1. Open your POS app: http://localhost:3000/
2. Login to the system
3. Navigate to Dashboard
4. Products should now load from Firebase in real-time
5. Try adding/editing products in Product Management

## 🔧 Troubleshooting

### If upload fails:
1. Check Firebase project ID in `firebase-upload.js`
2. Verify internet connection
3. Ensure Firebase rules allow write access
4. Check console for specific error messages

### If products don't appear in POS:
1. Check browser console for errors
2. Verify Firebase configuration in `src/firebase/config.js`
3. Ensure security rules allow read access
4. Check network tab for failed requests

### For production deployment:
1. Set stricter security rules requiring authentication
2. Enable Firebase Authentication
3. Remove any `allow write: if true` rules
4. Use environment variables for sensitive config

## 📊 Product Categories by Volume

After upload, your products will be organized as:
- **240ml**: Cane blend products in 240ml bottles
- **500ml**: Cane blend products in 500ml bottles
- **Fusion**: Cane fusion drinks
- **Others**: Cane pops, fusion drinks, coconut, water bottles, etc.

## 🎉 Success!

Once completed, your POS system will have:
- ✅ Live Firebase integration
- ✅ Real-time product updates
- ✅ Volume-based categorization
- ✅ All 94 products from your inventory
- ✅ Proper tax and pricing information