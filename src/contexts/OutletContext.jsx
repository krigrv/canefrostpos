/**
 * OutletContext - Multi-Outlet Management System
 * Handles centralized operations with outlet-specific data isolation
 * Main account: canefrostmv@gmail.com has full access to all outlets
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const OutletContext = createContext();

export function useOutlet() {
  return useContext(OutletContext);
}

export function OutletProvider({ children }) {
  const { currentUser } = useAuth();
  const [outlets, setOutlets] = useState([]);
  const [currentOutlet, setCurrentOutlet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMainAccount, setIsMainAccount] = useState(false);
  const [userRole, setUserRole] = useState('staff'); // 'admin', 'manager', 'staff'

  // Main account email
  const MAIN_ACCOUNT_EMAIL = 'canefrostmv@gmail.com';

  // Initialize outlet system
  useEffect(() => {    
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const initializeOutletSystem = async () => {
      try {
        // Check if user is main account
        const isMain = currentUser.email === MAIN_ACCOUNT_EMAIL;
        setIsMainAccount(isMain);

        // Get user role and outlet access
        await getUserRoleAndOutlets();
        
        // Set up real-time listeners
        setupOutletListeners();
        
      } catch (error) {
        console.error('Error initializing outlet system:', error);
        toast.error('Failed to initialize outlet system');
      } finally {
        setLoading(false);
      }
    };

    initializeOutletSystem();
  }, [currentUser]);

  // Get user role and accessible outlets
  const getUserRoleAndOutlets = async () => {
    if (!currentUser) return;

    try {
      // Check user document for role and outlet access
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role || 'staff');
        
        // If main account, get all outlets
        if (currentUser.email === MAIN_ACCOUNT_EMAIL) {
          await getAllOutlets();
        } else {
          // Get outlets user has access to
          const userOutlets = userData.outlets || [];
          if (userOutlets.length > 0) {
            await getAccessibleOutlets(userOutlets);
          } else {
            // No outlet access, create default outlet for user
            await createDefaultOutletForUser();
          }
        }
      } else {
        // New user, create user document
        await createUserDocument();
      }
    } catch (error) {
      console.error('Error getting user role and outlets:', error);
    }
  };

  // Create user document with default settings
  const createUserDocument = async () => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userData = {
        email: currentUser.email,
        displayName: currentUser.displayName || '',
        role: currentUser.email === MAIN_ACCOUNT_EMAIL ? 'admin' : 'staff',
        outlets: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userDocRef, userData);
      setUserRole(userData.role);
      
      // Create default outlet for non-main accounts
      if (currentUser.email !== MAIN_ACCOUNT_EMAIL) {
        await createDefaultOutletForUser();
      }
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  };

  // Get all outlets (main account only)
  const getAllOutlets = async () => {
    try {
      const outletsQuery = query(
        collection(db, 'outlets'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(outletsQuery);
      const outletsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      
      setOutlets(outletsData);
      
      // Set first outlet as current if none selected
      if (outletsData.length > 0 && !currentOutlet) {
        setCurrentOutlet(outletsData[0]);
      }
    } catch (error) {
      console.error('Error getting all outlets:', error);
    }
  };

  // Get outlets user has access to
  const getAccessibleOutlets = async (outletIds) => {
    try {
      const outletsData = [];
      
      for (const outletId of outletIds) {
        const outletDoc = await getDoc(doc(db, 'outlets', outletId));
        if (outletDoc.exists()) {
          outletsData.push({
            id: outletDoc.id,
            ...outletDoc.data(),
            createdAt: outletDoc.data().createdAt?.toDate(),
            updatedAt: outletDoc.data().updatedAt?.toDate()
          });
        }
      }
      
      setOutlets(outletsData);
      
      if (outletsData.length > 0 && !currentOutlet) {
        setCurrentOutlet(outletsData[0]);
      }
    } catch (error) {
      console.error('Error getting accessible outlets:', error);
    }
  };

  // Create default outlet for new user
  const createDefaultOutletForUser = async () => {
    if (!currentUser) return;

    try {
      const outletData = {
        name: `${currentUser.displayName || currentUser.email}'s Outlet`,
        code: `OUT_${Date.now()}`,
        address: '',
        phone: '',
        email: currentUser.email,
        managerId: currentUser.uid,
        managerName: currentUser.displayName || currentUser.email,
        status: 'active',
        settings: {
          businessName: 'Canefrost POS',
          currency: 'INR',
          taxRate: 12,
          receiptFooter: 'Thank you for your business!'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid
      };

      const docRef = await addDoc(collection(db, 'outlets'), outletData);
      
      // Update user document with outlet access
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        outlets: [docRef.id],
        updatedAt: serverTimestamp()
      });

      // Add to local state
      const newOutlet = {
        id: docRef.id,
        ...outletData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setOutlets([newOutlet]);
      setCurrentOutlet(newOutlet);
      
      toast.success('Default outlet created successfully');
    } catch (error) {
      console.error('Error creating default outlet:', error);
      toast.error('Failed to create default outlet');
    }
  };

  // Setup real-time listeners for outlets
  const setupOutletListeners = () => {
    if (!currentUser) return;

    let outletsQuery;
    
    if (currentUser.email === MAIN_ACCOUNT_EMAIL) {
      // Main account sees all outlets
      outletsQuery = query(
        collection(db, 'outlets'),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Regular users see only their outlets
      outletsQuery = query(
        collection(db, 'outlets'),
        where('managerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(outletsQuery, (snapshot) => {
      const outletsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      
      setOutlets(outletsData);
      
      // Update current outlet if it was modified
      if (currentOutlet) {
        const updatedCurrentOutlet = outletsData.find(o => o.id === currentOutlet.id);
        if (updatedCurrentOutlet) {
          setCurrentOutlet(updatedCurrentOutlet);
        }
      }
    });

    return unsubscribe;
  };

  // Create new outlet (main account only)
  const createOutlet = async (outletData) => {
    if (!isMainAccount) {
      toast.error('Only main account can create outlets');
      return null;
    }

    try {
      const newOutletData = {
        ...outletData,
        code: `OUT_${Date.now()}`,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid
      };

      const docRef = await addDoc(collection(db, 'outlets'), newOutletData);
      
      toast.success('Outlet created successfully');
      return docRef.id;
    } catch (error) {
      console.error('Error creating outlet:', error);
      toast.error('Failed to create outlet');
      return null;
    }
  };

  // Update outlet
  const updateOutlet = async (outletId, updateData) => {
    if (!isMainAccount && currentOutlet?.id !== outletId) {
      toast.error('You can only update your own outlet');
      return false;
    }

    try {
      const outletRef = doc(db, 'outlets', outletId);
      await updateDoc(outletRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Outlet updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating outlet:', error);
      toast.error('Failed to update outlet');
      return false;
    }
  };

  // Delete outlet (main account only)
  const deleteOutlet = async (outletId) => {
    if (!isMainAccount) {
      toast.error('Only main account can delete outlets');
      return false;
    }

    try {
      await deleteDoc(doc(db, 'outlets', outletId));
      
      // Remove from current outlet if it was deleted
      if (currentOutlet?.id === outletId) {
        const remainingOutlets = outlets.filter(o => o.id !== outletId);
        setCurrentOutlet(remainingOutlets.length > 0 ? remainingOutlets[0] : null);
      }
      
      toast.success('Outlet deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting outlet:', error);
      toast.error('Failed to delete outlet');
      return false;
    }
  };

  // Switch current outlet
  const switchOutlet = (outlet) => {
    setCurrentOutlet(outlet);
    toast.success(`Switched to ${outlet.name}`);
  };

  // Assign user to outlet (main account only)
  const assignUserToOutlet = async (userId, outletId) => {
    if (!isMainAccount) {
      toast.error('Only main account can assign users to outlets');
      return false;
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentOutlets = userDoc.data().outlets || [];
        if (!currentOutlets.includes(outletId)) {
          await updateDoc(userRef, {
            outlets: [...currentOutlets, outletId],
            updatedAt: serverTimestamp()
          });
          
          toast.success('User assigned to outlet successfully');
          return true;
        } else {
          toast.info('User already has access to this outlet');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error assigning user to outlet:', error);
      toast.error('Failed to assign user to outlet');
      return false;
    }
  };

  // Get outlet-specific collection path
  const getOutletCollection = (collectionName) => {
    if (!currentOutlet) return collectionName;
    return `outlets/${currentOutlet.id}/${collectionName}`;
  };

  // Get centralized collection path (for main account analytics)
  const getCentralizedCollection = (collectionName) => {
    return `centralized/${collectionName}`;
  };

  const value = {
    outlets,
    currentOutlet,
    loading,
    isMainAccount,
    userRole,
    createOutlet,
    updateOutlet,
    deleteOutlet,
    switchOutlet,
    assignUserToOutlet,
    getOutletCollection,
    getCentralizedCollection,
    MAIN_ACCOUNT_EMAIL
  };

  return (
    <OutletContext.Provider value={value}>
      {children}
    </OutletContext.Provider>
  );
}