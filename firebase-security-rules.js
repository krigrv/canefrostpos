/*
Production-Ready Firebase Security Rules for Canefrost POS
Copy this content to Firebase Console > Firestore Database > Rules
*/

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Products Collection - Public read, authenticated write
    match /products/{productId} {
      // Anyone can read products (for displaying menu)
      allow read: if true;
      
      // Only authenticated users can create, update, delete products
      allow create, update, delete: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // Volume-based product collections
    match /products_240ml/{productId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    match /products_500ml/{productId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    match /products_1litre/{productId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    match /products_others/{productId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // Orders Collection - Authenticated users only
    match /orders/{orderId} {
      // Users can only access their own orders
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      // Allow creation of new orders
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
    
    // Sales History - Authenticated users only
    match /sales/{saleId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // User Profiles - Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
    
    // Admin Collection - Restricted to admin users
    match /admin/{document} {
      allow read, write: if request.auth != null 
        && request.auth.token.admin == true;
    }
    
    // Inventory Management - Authenticated users only
    match /inventory/{inventoryId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // Categories Collection - Public read, authenticated write
    match /categories/{categoryId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // Settings Collection - Admin only
    match /settings/{settingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && request.auth.token.admin == true;
    }
    
    // Analytics Collection - Authenticated users only
    match /analytics/{analyticsId} {
      allow read, write: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}