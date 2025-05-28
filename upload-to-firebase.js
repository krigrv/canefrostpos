// Simple Firebase upload script using web SDK
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import fs from 'fs';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate environment variables
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Missing required Firebase environment variables. Please check your .env file.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Read the cleaned inventory data
const inventoryData = JSON.parse(fs.readFileSync('./Canefrost_Inventory_Upload.json', 'utf8'));

// Function to categorize products by volume
function categorizeByVolume(products) {
  const categorized = {
    '240ml': [],
    '500ml': [],
    '1litre': [],
    'others': []
  };

  products.forEach(product => {
    const itemName = product['Item Name'].toLowerCase();
    
    if (itemName.includes('240ml') || itemName.includes('240 ml')) {
      categorized['240ml'].push(product);
    } else if (itemName.includes('500ml') || itemName.includes('500 ml')) {
      categorized['500ml'].push(product);
    } else if (itemName.includes('1 litre') || itemName.includes('1litre') || itemName.includes('1000ml')) {
      categorized['1litre'].push(product);
    } else {
      categorized['others'].push(product);
    }
  });

  return categorized;
}

// Function to convert inventory item to Firebase product format
function convertToFirebaseFormat(item, index) {
  return {
    id: item.Barcode || `CFRST${String(index + 1).padStart(3, '0')}`,
    name: item['Item Name'],
    category: item.Category,
    price: parseFloat(item.MRP) || 0,
    barcode: item.Barcode || `CFRST${String(index + 1).padStart(3, '0')}`,
    taxPercentage: parseFloat(item['Tax percentage']) || 12,
    taxType: item['Tax type'] || 'GST',
    stock: 50, // Default stock
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Function to upload products to Firebase
async function uploadProductsToFirebase() {
  try {
    console.log('🔐 Signing in anonymously...');
    await signInAnonymously(auth);
    console.log('✅ Authentication successful!');
    
    console.log('\n🚀 Starting Firebase upload...');
    
    // Categorize products by volume
    const categorized = categorizeByVolume(inventoryData);
    
    console.log('\n📊 Product Categories by Volume:');
    console.log(`240ml products: ${categorized['240ml'].length}`);
    console.log(`500ml products: ${categorized['500ml'].length}`);
    console.log(`1 litre products: ${categorized['1litre'].length}`);
    console.log(`Other products: ${categorized['others'].length}`);
    console.log(`Total products: ${inventoryData.length}\n`);

    // Clear existing products
    console.log('🗑️  Clearing existing products...');
    const existingProducts = await getDocs(collection(db, 'products'));
    
    if (!existingProducts.empty) {
      const batch = writeBatch(db);
      existingProducts.docs.forEach((document) => {
        batch.delete(doc(db, 'products', document.id));
      });
      await batch.commit();
      console.log(`Deleted ${existingProducts.size} existing products.\n`);
    } else {
      console.log('No existing products found.\n');
    }

    // Upload products in batches (Firestore batch limit is 500)
    console.log('📦 Uploading products to Firebase...');
    let totalUploaded = 0;
    const batchSize = 500;

    for (let i = 0; i < inventoryData.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchItems = inventoryData.slice(i, i + batchSize);
      
      batchItems.forEach((item, index) => {
        const product = convertToFirebaseFormat(item, i + index);
        const docRef = doc(collection(db, 'products'));
        batch.set(docRef, product);
      });
      
      await batch.commit();
      totalUploaded += batchItems.length;
      console.log(`✅ Uploaded batch ${Math.floor(i / batchSize) + 1}: ${batchItems.length} products (Total: ${totalUploaded})`);
    }

    console.log(`\n🎉 Successfully uploaded ${totalUploaded} products to Firebase!`);
    
    // Create volume-based collections for better organization
    console.log('\n📁 Creating volume-based collections...');
    
    for (const [volume, products] of Object.entries(categorized)) {
      if (products.length > 0) {
        const batch = writeBatch(db);
        
        products.forEach((item, index) => {
          const product = convertToFirebaseFormat(item, index);
          product.volume = volume;
          const docRef = doc(collection(db, `products_${volume}`));
          batch.set(docRef, product);
        });
        
        await batch.commit();
        console.log(`✅ Created collection 'products_${volume}' with ${products.length} items`);
      }
    }

    console.log('\n🔥 Firebase upload completed successfully!');
    console.log('\n📱 Your POS system will now show live data from Firebase!');
    console.log('\n🌐 Access your app at: http://localhost:3000/');
    console.log('\n📋 Volume Categories Created:');
    console.log('   • products_240ml - Small bottles (27 items)');
    console.log('   • products_500ml - Medium bottles (29 items)');
    console.log('   • products_1litre - Large bottles (1 item)');
    console.log('   • products_others - Cane pops, fusion, etc. (37 items)');
    
  } catch (error) {
    console.error('❌ Error uploading to Firebase:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied. Please update Firebase Security Rules:');
      console.log('1. Go to Firebase Console > Firestore Database > Rules');
      console.log('2. Set rules to allow read/write access');
      console.log('3. For testing, you can use: allow read, write: if true;');
    }
  } finally {
    process.exit(0);
  }
}

// Run the upload
uploadProductsToFirebase();