// Simple Firebase upload script without authentication
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import fs from 'fs';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqa15sDD7JuNOxY85O7fhMXD8DfYwvUWk",
  authDomain: "canefrostpos.firebaseapp.com",
  projectId: "canefrostpos",
  storageBucket: "canefrostpos.firebasestorage.app",
  messagingSenderId: "113733653005",
  appId: "1:113733653005:web:a67061a992f1e843cafb44",
  measurementId: "G-P772WL4CTB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    console.log('🚀 Starting Firebase upload (no authentication)...');
    
    // Categorize products by volume
    const categorized = categorizeByVolume(inventoryData);
    
    console.log('\n📊 Product Categories by Volume:');
    console.log(`240ml products: ${categorized['240ml'].length}`);
    console.log(`500ml products: ${categorized['500ml'].length}`);
    console.log(`1 litre products: ${categorized['1litre'].length}`);
    console.log(`Other products: ${categorized['others'].length}`);
    console.log(`Total products: ${inventoryData.length}\n`);

    // Try to upload a single test product first
    console.log('🧪 Testing Firebase connection with a single product...');
    const testProduct = convertToFirebaseFormat(inventoryData[0], 0);
    
    try {
      const docRef = await addDoc(collection(db, 'products'), testProduct);
      console.log('✅ Test product uploaded successfully! Document ID:', docRef.id);
      
      // If test succeeds, proceed with full upload
      console.log('\n📦 Uploading all products to Firebase...');
      
      let uploadCount = 0;
      
      // Upload products one by one to avoid batch issues
      for (let i = 0; i < inventoryData.length; i++) {
        const product = convertToFirebaseFormat(inventoryData[i], i);
        
        try {
          await addDoc(collection(db, 'products'), product);
          uploadCount++;
          
          if (uploadCount % 10 === 0) {
            console.log(`✅ Uploaded ${uploadCount}/${inventoryData.length} products...`);
          }
        } catch (error) {
          console.log(`⚠️  Failed to upload product ${i + 1}: ${product.name}`);
        }
      }
      
      console.log(`\n🎉 Successfully uploaded ${uploadCount} out of ${inventoryData.length} products to Firebase!`);
      
      // Create summary by volume
      console.log('\n📋 Upload Summary by Volume:');
      for (const [volume, products] of Object.entries(categorized)) {
        console.log(`   • ${volume}: ${products.length} items`);
      }
      
      console.log('\n🔥 Firebase upload completed!');
      console.log('\n📱 Your POS system will now show live data from Firebase!');
      console.log('\n🌐 Access your app at: http://localhost:3000/');
      
    } catch (testError) {
      console.error('❌ Test upload failed:', testError.message);
      
      if (testError.code === 'permission-denied') {
        console.log('\n💡 Permission denied. You need to update Firebase Security Rules:');
        console.log('\n📝 Steps to fix:');
        console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
        console.log('2. Select your project: canefrostpos');
        console.log('3. Go to Firestore Database > Rules');
        console.log('4. Replace the rules with:');
        console.log('\n   rules_version = \'2\';');
        console.log('   service cloud.firestore {');
        console.log('     match /databases/{database}/documents {');
        console.log('       match /{document=**} {');
        console.log('         allow read, write: if true;');
        console.log('       }');
        console.log('     }');
        console.log('   }');
        console.log('\n5. Click "Publish"');
        console.log('\n⚠️  Note: This allows all access. For production, use proper authentication.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during Firebase upload:', error);
  } finally {
    process.exit(0);
  }
}

// Run the upload
uploadProductsToFirebase();