import { collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './src/firebase/config.js';

async function cleanupDatabase() {
  console.log('🔍 Starting database cleanup...');
  
  try {
    // Get all products from the main collection
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    console.log(`📊 Found ${snapshot.size} total documents in products collection`);
    
    // Track products by name to identify duplicates
    const productMap = new Map();
    const duplicates = [];
    const errors = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;
      
      // Check for data integrity issues
      if (!data.name || !data.price) {
        errors.push({ id: docId, data, issue: 'Missing required fields (name or price)' });
        return;
      }
      
      // Check for duplicates by name
      const productName = data.name.toLowerCase().trim();
      
      if (productMap.has(productName)) {
        // This is a duplicate
        const existing = productMap.get(productName);
        duplicates.push({
          duplicate: { id: docId, data },
          original: existing
        });
        console.log(`🔄 Found duplicate: "${data.name}" (IDs: ${existing.id}, ${docId})`);
      } else {
        // First occurrence of this product
        productMap.set(productName, { id: docId, data });
      }
    });
    
    console.log(`\n📋 Cleanup Summary:`);
    console.log(`   • Total products: ${snapshot.size}`);
    console.log(`   • Unique products: ${productMap.size}`);
    console.log(`   • Duplicates found: ${duplicates.length}`);
    console.log(`   • Data errors found: ${errors.length}`);
    
    if (duplicates.length === 0 && errors.length === 0) {
      console.log('✅ Database is clean! No duplicates or errors found.');
      return;
    }
    
    // Show details of issues found
    if (errors.length > 0) {
      console.log('\n❌ Data Errors Found:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ID: ${error.id}`);
        console.log(`      Issue: ${error.issue}`);
        console.log(`      Data: ${JSON.stringify(error.data, null, 2)}`);
      });
    }
    
    if (duplicates.length > 0) {
      console.log('\n🔄 Duplicates Found:');
      duplicates.forEach((dup, index) => {
        console.log(`   ${index + 1}. "${dup.duplicate.data.name}"`);
        console.log(`      Original ID: ${dup.original.id}`);
        console.log(`      Duplicate ID: ${dup.duplicate.id}`);
      });
    }
    
    // Ask for confirmation before cleanup
    console.log('\n⚠️  Ready to clean up database:');
    console.log(`   • Will delete ${duplicates.length} duplicate entries`);
    console.log(`   • Will delete ${errors.length} entries with errors`);
    console.log('\n🚀 Starting cleanup in 3 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Delete duplicates and errors
    const batch = writeBatch(db);
    let deleteCount = 0;
    
    // Delete duplicate entries (keep the first occurrence)
    duplicates.forEach((dup) => {
      const docRef = doc(db, 'products', dup.duplicate.id);
      batch.delete(docRef);
      deleteCount++;
      console.log(`🗑️  Queued for deletion: "${dup.duplicate.data.name}" (ID: ${dup.duplicate.id})`);
    });
    
    // Delete entries with errors
    errors.forEach((error) => {
      const docRef = doc(db, 'products', error.id);
      batch.delete(docRef);
      deleteCount++;
      console.log(`🗑️  Queued for deletion (error): ID ${error.id}`);
    });
    
    if (deleteCount > 0) {
      await batch.commit();
      console.log(`\n✅ Successfully deleted ${deleteCount} problematic entries!`);
    }
    
    // Final verification
    const finalSnapshot = await getDocs(productsRef);
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`   • Products before cleanup: ${snapshot.size}`);
    console.log(`   • Products after cleanup: ${finalSnapshot.size}`);
    console.log(`   • Entries removed: ${snapshot.size - finalSnapshot.size}`);
    
    // Also clean up volume-specific collections if they exist
    const volumeCollections = ['products_240ml', 'products_500ml', 'products_1litre', 'products_others'];
    
    for (const collectionName of volumeCollections) {
      try {
        const volumeRef = collection(db, collectionName);
        const volumeSnapshot = await getDocs(volumeRef);
        
        if (volumeSnapshot.size > 0) {
          console.log(`\n🔍 Checking ${collectionName}: ${volumeSnapshot.size} documents`);
          
          const volumeBatch = writeBatch(db);
          let volumeDeleteCount = 0;
          
          volumeSnapshot.forEach((doc) => {
            const docRef = doc.ref;
            volumeBatch.delete(docRef);
            volumeDeleteCount++;
          });
          
          if (volumeDeleteCount > 0) {
            await volumeBatch.commit();
            console.log(`✅ Cleared ${volumeDeleteCount} documents from ${collectionName}`);
          }
        }
      } catch (error) {
        console.log(`ℹ️  Collection ${collectionName} doesn't exist or is empty`);
      }
    }
    
    console.log('\n🎯 Database cleanup completed successfully!');
    console.log('💡 Tip: Run the upload script again to ensure clean, organized data.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupDatabase()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });