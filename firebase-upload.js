const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Note: You'll need to download your service account key from Firebase Console
// and place it in the project root as 'serviceAccountKey.json'
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'canefrostpos'
  });
} catch (error) {
  console.log('Service account key not found. Using default credentials.');
  admin.initializeApp({
    projectId: 'canefrostpos'
  });
}

const db = admin.firestore();

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
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

// Function to upload products to Firebase
async function uploadProductsToFirebase() {
  try {
    console.log('Starting Firebase upload...');
    
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
    const existingProducts = await db.collection('products').get();
    const deletePromises = existingProducts.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    console.log(`Deleted ${existingProducts.size} existing products.\n`);

    // Upload products in batches (Firestore batch limit is 500)
    const batchSize = 500;
    let totalUploaded = 0;

    for (let i = 0; i < inventoryData.length; i += batchSize) {
      const batch = db.batch();
      const batchItems = inventoryData.slice(i, i + batchSize);
      
      batchItems.forEach((item, index) => {
        const product = convertToFirebaseFormat(item, i + index);
        const docRef = db.collection('products').doc();
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
        const batch = db.batch();
        
        products.forEach((item, index) => {
          const product = convertToFirebaseFormat(item, index);
          product.volume = volume;
          const docRef = db.collection(`products_${volume}`).doc();
          batch.set(docRef, product);
        });
        
        await batch.commit();
        console.log(`✅ Created collection 'products_${volume}' with ${products.length} items`);
      }
    }

    console.log('\n🔥 Firebase upload completed successfully!');
    console.log('\n📱 Your POS system will now show live data from Firebase!');
    console.log('\n🌐 Access your app at: http://localhost:3000/');
    
  } catch (error) {
    console.error('❌ Error uploading to Firebase:', error);
    
    if (error.code === 'app/invalid-credential') {
      console.log('\n💡 Setup Instructions:');
      console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
      console.log('2. Click "Generate new private key"');
      console.log('3. Save the file as "serviceAccountKey.json" in your project root');
      console.log('4. Run this script again');
    }
  } finally {
    process.exit(0);
  }
}

// Run the upload
uploadProductsToFirebase();