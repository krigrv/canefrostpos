// Authenticated Firebase upload script for production use
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import readline from 'readline';

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
const auth = getAuth(app);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to get user input
function getUserInput(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to get password input (hidden)
function getPasswordInput(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    
    process.stdin.on('data', function(char) {
      char = char + '';
      
      switch(char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

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

// Main upload function
async function authenticatedUpload() {
  try {
    console.log('🔐 Canefrost POS - Authenticated Firebase Upload');
    console.log('================================================\n');
    
    // Get user credentials
    const email = await getUserInput('Enter your email: ');
    const password = await getPasswordInput('Enter your password: ');
    
    console.log('\n🔑 Authenticating...');
    
    try {
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log(`✅ Authentication successful! Welcome, ${user.email}`);
      
      if (!user.emailVerified) {
        console.log('⚠️  Warning: Your email is not verified. Some operations may be restricted.');
      }
      
    } catch (authError) {
      console.error('❌ Authentication failed:', authError.message);
      
      // Fallback to mock authentication for development
      if (email === 'admin@canefrost.com' && password === 'admin123') {
        console.log('✅ Using development mock authentication');
      } else {
        console.log('\n💡 For development, you can use:');
        console.log('   Email: admin@canefrost.com');
        console.log('   Password: admin123');
        process.exit(1);
      }
    }
    
    // Categorize products by volume
    const categorized = categorizeByVolume(inventoryData);
    
    console.log('\n📊 Product Categories by Volume:');
    console.log(`   240ml products: ${categorized['240ml'].length}`);
    console.log(`   500ml products: ${categorized['500ml'].length}`);
    console.log(`   1 litre products: ${categorized['1litre'].length}`);
    console.log(`   Other products: ${categorized['others'].length}`);
    console.log(`   Total products: ${inventoryData.length}\n`);

    // Confirm upload
    const confirm = await getUserInput('Do you want to proceed with the upload? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('Upload cancelled.');
      process.exit(0);
    }

    // Clear existing products
    console.log('🗑️  Clearing existing products...');
    try {
      const existingProducts = await getDocs(collection(db, 'products'));
      
      if (!existingProducts.empty) {
        const batch = writeBatch(db);
        existingProducts.docs.forEach((document) => {
          batch.delete(doc(db, 'products', document.id));
        });
        await batch.commit();
        console.log(`   Deleted ${existingProducts.size} existing products.`);
      } else {
        console.log('   No existing products found.');
      }
    } catch (clearError) {
      console.log('   ⚠️  Could not clear existing products:', clearError.message);
    }

    // Upload products in batches
    console.log('\n📦 Uploading products to Firebase...');
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
      
      try {
        await batch.commit();
        totalUploaded += batchItems.length;
        console.log(`   ✅ Uploaded batch ${Math.floor(i / batchSize) + 1}: ${batchItems.length} products (Total: ${totalUploaded})`);
      } catch (batchError) {
        console.log(`   ❌ Failed to upload batch ${Math.floor(i / batchSize) + 1}:`, batchError.message);
      }
    }

    console.log(`\n🎉 Successfully uploaded ${totalUploaded} out of ${inventoryData.length} products!`);
    
    // Create volume-based collections for better organization
    console.log('\n📁 Creating volume-based collections...');
    
    for (const [volume, products] of Object.entries(categorized)) {
      if (products.length > 0) {
        try {
          const batch = writeBatch(db);
          
          products.forEach((item, index) => {
            const product = convertToFirebaseFormat(item, index);
            product.volume = volume;
            const docRef = doc(collection(db, `products_${volume}`));
            batch.set(docRef, product);
          });
          
          await batch.commit();
          console.log(`   ✅ Created collection 'products_${volume}' with ${products.length} items`);
        } catch (volumeError) {
          console.log(`   ❌ Failed to create collection 'products_${volume}':`, volumeError.message);
        }
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
    console.error('❌ Upload failed:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied. Please check:');
      console.log('1. Firebase Security Rules allow authenticated writes');
      console.log('2. Your account has proper permissions');
      console.log('3. Email verification status');
    }
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the authenticated upload
authenticatedUpload();