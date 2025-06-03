// Utility to check for duplicate products in the current state
export const checkForDuplicateProducts = (products) => {
  console.log('🔍 Checking for duplicate products...');
  
  const duplicates = [];
  const seen = new Map();
  
  products.forEach((product, index) => {
    const key = `${product.name}_${product.barcode}`;
    
    if (seen.has(key)) {
      const originalIndex = seen.get(key);
      duplicates.push({
        duplicate: { index, ...product },
        original: { index: originalIndex, ...products[originalIndex] }
      });
      console.log(`🔄 Duplicate found: "${product.name}" (${product.barcode})`);
      console.log(`   Original ID: ${products[originalIndex].id}`);
      console.log(`   Duplicate ID: ${product.id}`);
    } else {
      seen.set(key, index);
    }
  });
  
  console.log(`📊 Duplicate check results:`);
  console.log(`   • Total products: ${products.length}`);
  console.log(`   • Unique products: ${seen.size}`);
  console.log(`   • Duplicates found: ${duplicates.length}`);
  
  if (duplicates.length > 0) {
    console.table(duplicates.map(d => ({
      'Original ID': d.original.id,
      'Duplicate ID': d.duplicate.id,
      'Product Name': d.original.name,
      'Barcode': d.original.barcode
    })));
  }
  
  return duplicates;
};

// Check for products with same ID but different data
export const checkForIdDuplicates = (products) => {
  console.log('🔍 Checking for ID duplicates...');
  
  const idMap = new Map();
  const idDuplicates = [];
  
  products.forEach((product, index) => {
    if (idMap.has(product.id)) {
      const originalIndex = idMap.get(product.id);
      idDuplicates.push({
        duplicate: { index, ...product },
        original: { index: originalIndex, ...products[originalIndex] }
      });
      console.log(`🆔 ID duplicate found: ${product.id}`);
    } else {
      idMap.set(product.id, index);
    }
  });
  
  console.log(`📊 ID duplicate check results:`);
  console.log(`   • ID duplicates found: ${idDuplicates.length}`);
  
  return idDuplicates;
};