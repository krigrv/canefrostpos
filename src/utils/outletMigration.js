/**
 * Outlet Migration Utility
 * Migrates existing single-outlet data to multi-outlet structure
 * Creates backup before migration and provides rollback functionality
 */
import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';

class OutletMigration {
  constructor() {
    this.MAIN_ACCOUNT_EMAIL = 'canefrostmv@gmail.com';
    this.BATCH_SIZE = 500; // Firestore batch limit
  }

  /**
   * Main migration function
   * Migrates all existing data to outlet-specific collections
   */
  async migrateToMultiOutlet(currentUser, defaultOutletData = null) {
    if (!currentUser) {
      throw new Error('User must be authenticated to perform migration');
    }

    console.log('Starting multi-outlet migration...');
    toast.loading('Starting migration process...');

    try {
      // Step 1: Create backup
      await this.createBackup(currentUser.uid);
      
      // Step 2: Create default outlet if needed
      const defaultOutlet = await this.createDefaultOutlet(currentUser, defaultOutletData);
      
      // Step 3: Migrate collections
      await this.migrateProducts(defaultOutlet.id);
      await this.migrateSales(defaultOutlet.id);
      await this.migrateCustomers(defaultOutlet.id);
      await this.migrateStaff(defaultOutlet.id);
      await this.migrateInventory(defaultOutlet.id);
      
      // Step 4: Update user document
      await this.updateUserDocument(currentUser.uid, defaultOutlet.id);
      
      // Step 5: Mark migration as complete
      await this.markMigrationComplete(currentUser.uid);
      
      console.log('Migration completed successfully');
      toast.success('Migration completed successfully!');
      
      return defaultOutlet;
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Migration failed. Please try again.');
      throw error;
    }
  }

  /**
   * Create backup of existing data
   */
  async createBackup(userId) {
    console.log('Creating backup...');
    
    const backupId = `backup_${userId}_${Date.now()}`;
    const backupRef = doc(db, 'backups', backupId);
    
    const backupData = {
      userId,
      createdAt: serverTimestamp(),
      status: 'in_progress',
      collections: []
    };
    
    await setDoc(backupRef, backupData);
    
    // Backup each collection
    const collectionsToBackup = [
      'products', 'sales', 'customers', 'staff', 'shifts', 
      'inventory_transactions', 'settings'
    ];
    
    for (const collectionName of collectionsToBackup) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (data.length > 0) {
          await setDoc(doc(db, `backups/${backupId}/collections`, collectionName), {
            data,
            count: data.length,
            backedUpAt: serverTimestamp()
          });
          
          backupData.collections.push({
            name: collectionName,
            count: data.length
          });
        }
      } catch (error) {
        console.warn(`Failed to backup collection ${collectionName}:`, error);
      }
    }
    
    // Update backup status
    await updateDoc(backupRef, {
      status: 'completed',
      collections: backupData.collections,
      completedAt: serverTimestamp()
    });
    
    console.log('Backup created successfully');
    return backupId;
  }

  /**
   * Create default outlet for user
   */
  async createDefaultOutlet(currentUser, outletData = null) {
    console.log('Creating default outlet...');
    
    const defaultOutletData = {
      name: outletData?.name || `${currentUser.displayName || currentUser.email}'s Outlet`,
      code: `OUT_${Date.now()}`,
      address: outletData?.address || '',
      phone: outletData?.phone || '',
      email: currentUser.email,
      managerId: currentUser.uid,
      managerName: currentUser.displayName || currentUser.email,
      status: 'active',
      settings: {
        businessName: outletData?.businessName || 'Canefrost POS',
        currency: 'INR',
        taxRate: 12,
        receiptFooter: 'Thank you for your business!',
        ...outletData?.settings
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUser.uid,
      isMigrated: true,
      migrationDate: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'outlets'), defaultOutletData);
    
    console.log('Default outlet created:', docRef.id);
    return {
      id: docRef.id,
      ...defaultOutletData
    };
  }

  /**
   * Migrate products to outlet-specific collection
   */
  async migrateProducts(outletId) {
    console.log('Migrating products...');
    
    const productCollections = [
      'products', 'products_240ml', 'products_500ml', 
      'products_1litre', 'products_others'
    ];
    
    let totalMigrated = 0;
    
    for (const collectionName of productCollections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        
        if (snapshot.docs.length > 0) {
          const batch = writeBatch(db);
          let batchCount = 0;
          
          for (const docSnapshot of snapshot.docs) {
            const productData = {
              ...docSnapshot.data(),
              migratedFrom: collectionName,
              migratedAt: serverTimestamp(),
              originalId: docSnapshot.id
            };
            
            const newDocRef = doc(db, `outlets/${outletId}/products`, docSnapshot.id);
            batch.set(newDocRef, productData);
            
            batchCount++;
            totalMigrated++;
            
            // Commit batch when it reaches the limit
            if (batchCount >= this.BATCH_SIZE) {
              await batch.commit();
              batchCount = 0;
            }
          }
          
          // Commit remaining items
          if (batchCount > 0) {
            await batch.commit();
          }
        }
      } catch (error) {
        console.warn(`Failed to migrate ${collectionName}:`, error);
      }
    }
    
    console.log(`Migrated ${totalMigrated} products`);
  }

  /**
   * Migrate sales to outlet-specific collection
   */
  async migrateSales(outletId) {
    console.log('Migrating sales...');
    
    try {
      const snapshot = await getDocs(query(
        collection(db, 'sales'),
        orderBy('timestamp', 'desc')
      ));
      
      if (snapshot.docs.length > 0) {
        const batch = writeBatch(db);
        let batchCount = 0;
        
        for (const docSnapshot of snapshot.docs) {
          const saleData = {
            ...docSnapshot.data(),
            outletId,
            migratedAt: serverTimestamp(),
            originalId: docSnapshot.id
          };
          
          const newDocRef = doc(db, `outlets/${outletId}/sales`, docSnapshot.id);
          batch.set(newDocRef, saleData);
          
          batchCount++;
          
          if (batchCount >= this.BATCH_SIZE) {
            await batch.commit();
            batchCount = 0;
          }
        }
        
        if (batchCount > 0) {
          await batch.commit();
        }
        
        console.log(`Migrated ${snapshot.docs.length} sales`);
      }
    } catch (error) {
      console.warn('Failed to migrate sales:', error);
    }
  }

  /**
   * Migrate customers to outlet-specific collection
   */
  async migrateCustomers(outletId) {
    console.log('Migrating customers...');
    
    try {
      const snapshot = await getDocs(collection(db, 'customers'));
      
      if (snapshot.docs.length > 0) {
        const batch = writeBatch(db);
        let batchCount = 0;
        
        for (const docSnapshot of snapshot.docs) {
          const customerData = {
            ...docSnapshot.data(),
            outletId,
            migratedAt: serverTimestamp(),
            originalId: docSnapshot.id
          };
          
          const newDocRef = doc(db, `outlets/${outletId}/customers`, docSnapshot.id);
          batch.set(newDocRef, customerData);
          
          batchCount++;
          
          if (batchCount >= this.BATCH_SIZE) {
            await batch.commit();
            batchCount = 0;
          }
        }
        
        if (batchCount > 0) {
          await batch.commit();
        }
        
        console.log(`Migrated ${snapshot.docs.length} customers`);
      }
    } catch (error) {
      console.warn('Failed to migrate customers:', error);
    }
  }

  /**
   * Migrate staff to outlet-specific collection
   */
  async migrateStaff(outletId) {
    console.log('Migrating staff...');
    
    try {
      const staffSnapshot = await getDocs(collection(db, 'staff'));
      const shiftsSnapshot = await getDocs(collection(db, 'shifts'));
      
      const batch = writeBatch(db);
      let batchCount = 0;
      
      // Migrate staff
      for (const docSnapshot of staffSnapshot.docs) {
        const staffData = {
          ...docSnapshot.data(),
          outletId,
          migratedAt: serverTimestamp(),
          originalId: docSnapshot.id
        };
        
        const newDocRef = doc(db, `outlets/${outletId}/staff`, docSnapshot.id);
        batch.set(newDocRef, staffData);
        batchCount++;
        
        if (batchCount >= this.BATCH_SIZE) {
          await batch.commit();
          batchCount = 0;
        }
      }
      
      // Migrate shifts
      for (const docSnapshot of shiftsSnapshot.docs) {
        const shiftData = {
          ...docSnapshot.data(),
          outletId,
          migratedAt: serverTimestamp(),
          originalId: docSnapshot.id
        };
        
        const newDocRef = doc(db, `outlets/${outletId}/shifts`, docSnapshot.id);
        batch.set(newDocRef, shiftData);
        batchCount++;
        
        if (batchCount >= this.BATCH_SIZE) {
          await batch.commit();
          batchCount = 0;
        }
      }
      
      if (batchCount > 0) {
        await batch.commit();
      }
      
      console.log(`Migrated ${staffSnapshot.docs.length} staff and ${shiftsSnapshot.docs.length} shifts`);
    } catch (error) {
      console.warn('Failed to migrate staff:', error);
    }
  }

  /**
   * Migrate inventory transactions
   */
  async migrateInventory(outletId) {
    console.log('Migrating inventory...');
    
    try {
      const snapshot = await getDocs(collection(db, 'inventory_transactions'));
      
      if (snapshot.docs.length > 0) {
        const batch = writeBatch(db);
        let batchCount = 0;
        
        for (const docSnapshot of snapshot.docs) {
          const inventoryData = {
            ...docSnapshot.data(),
            outletId,
            migratedAt: serverTimestamp(),
            originalId: docSnapshot.id
          };
          
          const newDocRef = doc(db, `outlets/${outletId}/inventory_transactions`, docSnapshot.id);
          batch.set(newDocRef, inventoryData);
          
          batchCount++;
          
          if (batchCount >= this.BATCH_SIZE) {
            await batch.commit();
            batchCount = 0;
          }
        }
        
        if (batchCount > 0) {
          await batch.commit();
        }
        
        console.log(`Migrated ${snapshot.docs.length} inventory transactions`);
      }
    } catch (error) {
      console.warn('Failed to migrate inventory:', error);
    }
  }

  /**
   * Update user document with outlet access
   */
  async updateUserDocument(userId, outletId) {
    console.log('Updating user document...');
    
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      const userData = {
        outlets: [outletId],
        role: 'manager',
        migrationCompleted: true,
        migrationDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      if (userDoc.exists()) {
        await updateDoc(userRef, userData);
      } else {
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp()
        });
      }
      
      console.log('User document updated');
    } catch (error) {
      console.warn('Failed to update user document:', error);
    }
  }

  /**
   * Mark migration as complete
   */
  async markMigrationComplete(userId) {
    console.log('Marking migration as complete...');
    
    try {
      await setDoc(doc(db, 'migration', userId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        version: '1.0'
      });
      
      console.log('Migration marked as complete');
    } catch (error) {
      console.warn('Failed to mark migration as complete:', error);
    }
  }

  /**
   * Check if migration is needed
   */
  async isMigrationNeeded(userId) {
    try {
      const migrationDoc = await getDoc(doc(db, 'migration', userId));
      return !migrationDoc.exists() || migrationDoc.data().status !== 'completed';
    } catch (error) {
      console.warn('Error checking migration status:', error);
      return true; // Assume migration is needed if we can't check
    }
  }

  /**
   * Rollback migration (emergency use only)
   */
  async rollbackMigration(userId, backupId) {
    console.log('Rolling back migration...');
    toast.loading('Rolling back migration...');
    
    try {
      // Get backup data
      const backupDoc = await getDoc(doc(db, 'backups', backupId));
      if (!backupDoc.exists()) {
        throw new Error('Backup not found');
      }
      
      const backup = backupDoc.data();
      
      // Restore each collection
      for (const collectionInfo of backup.collections) {
        const collectionBackup = await getDoc(
          doc(db, `backups/${backupId}/collections`, collectionInfo.name)
        );
        
        if (collectionBackup.exists()) {
          const data = collectionBackup.data().data;
          
          // Clear existing collection
          const existingDocs = await getDocs(collection(db, collectionInfo.name));
          const deleteBatch = writeBatch(db);
          
          existingDocs.docs.forEach(doc => {
            deleteBatch.delete(doc.ref);
          });
          
          await deleteBatch.commit();
          
          // Restore data
          const restoreBatch = writeBatch(db);
          let batchCount = 0;
          
          for (const item of data) {
            const { id, ...itemData } = item;
            const docRef = doc(db, collectionInfo.name, id);
            restoreBatch.set(docRef, itemData);
            
            batchCount++;
            
            if (batchCount >= this.BATCH_SIZE) {
              await restoreBatch.commit();
              batchCount = 0;
            }
          }
          
          if (batchCount > 0) {
            await restoreBatch.commit();
          }
        }
      }
      
      // Reset migration status
      await deleteDoc(doc(db, 'migration', userId));
      
      console.log('Migration rolled back successfully');
      toast.success('Migration rolled back successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      toast.error('Rollback failed');
      throw error;
    }
  }
}

export default OutletMigration;