import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { db } from '../firebase/config'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore'
import toast from 'react-hot-toast'

const SyncContext = createContext()

export const useSync = () => {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider')
  }
  return context
}

export function SyncProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, error
  const [pendingOperations, setPendingOperations] = useState([])
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const syncQueueRef = useRef([])
  const retryTimeoutRef = useRef(null)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Connection restored - syncing data...')
      processPendingOperations()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('Connection lost - working offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load pending operations from localStorage on mount
  useEffect(() => {
    const savedOperations = localStorage.getItem('pendingOperations')
    if (savedOperations) {
      try {
        const operations = JSON.parse(savedOperations)
        setPendingOperations(operations)
        syncQueueRef.current = operations
      } catch (error) {
        console.error('Error loading pending operations:', error)
        localStorage.removeItem('pendingOperations')
      }
    }

    const savedLastSync = localStorage.getItem('lastSyncTime')
    if (savedLastSync) {
      setLastSyncTime(new Date(savedLastSync))
    }
  }, [])

  // Save pending operations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations))
  }, [pendingOperations])

  // Add operation to sync queue
  const queueOperation = (operation) => {
    console.log('Queueing operation:', operation);
    
    // Ensure consistent field names
    const queuedOperation = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      ...operation
    }
    
    // Make sure we have consistent field names
    if (operation.type && !operation.operation) {
      queuedOperation.operation = operation.type;
    }
    
    if (operation.docId && !operation.id) {
      queuedOperation.id = operation.docId;
    }

    console.log('Formatted operation for queue:', queuedOperation);
    setPendingOperations(prev => [...prev, queuedOperation])
    syncQueueRef.current.push(queuedOperation)

    // If online, try to process immediately
    if (isOnline) {
      processPendingOperations()
    }

    return queuedOperation.id
  }

  // Process pending operations
  const processPendingOperations = async () => {
    if (!isOnline || syncQueueRef.current.length === 0) return

    setSyncStatus('syncing')
    const operations = [...syncQueueRef.current]
    const failedOperations = []

    for (const operation of operations) {
      try {
        await executeOperation(operation)
        // Remove successful operation from queue
        syncQueueRef.current = syncQueueRef.current.filter(op => op.id !== operation.id)
        setPendingOperations(prev => prev.filter(op => op.id !== operation.id))
      } catch (error) {
        console.error('Operation failed:', operation, error)
        
        // Increment retry count
        operation.retryCount = (operation.retryCount || 0) + 1
        
        // If max retries reached, mark as failed
        if (operation.retryCount >= 3) {
          failedOperations.push(operation)
          syncQueueRef.current = syncQueueRef.current.filter(op => op.id !== operation.id)
          setPendingOperations(prev => prev.filter(op => op.id !== operation.id))
        }
      }
    }

    if (failedOperations.length > 0) {
      toast.error(`${failedOperations.length} operations failed after 3 retries`)
      setSyncStatus('error')
    } else if (syncQueueRef.current.length === 0) {
      setSyncStatus('idle')
      setLastSyncTime(new Date())
      localStorage.setItem('lastSyncTime', new Date().toISOString())
      toast.success('All data synced successfully')
    }

    // Schedule retry for remaining operations
    if (syncQueueRef.current.length > 0) {
      scheduleRetry()
    }
  }

  // Execute individual operation
  const executeOperation = async (operation) => {
    const { collection: collectionName, operation: operationType, data, id } = operation
    console.log('Executing operation:', operationType, 'on collection:', collectionName, 'with ID:', id, 'Data:', data);

    switch (operationType) {
      case 'create':
        if (id) {
          await setDoc(doc(db, collectionName, id), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        } else {
          await addDoc(collection(db, collectionName), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        }
        break

      case 'update':
        console.log('Updating document in Firestore:', collectionName, id, data);
        await updateDoc(doc(db, collectionName, id), {
          ...data,
          updatedAt: serverTimestamp()
        })
        break

      case 'delete':
        await deleteDoc(doc(db, collectionName, id))
        break

      case 'upsert':
        const docRef = doc(db, collectionName, id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
          })
        } else {
          await setDoc(docRef, {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        }
        break

      default:
        throw new Error(`Unknown operation type: ${operationType}`)
    }
  }

  // Schedule retry for failed operations
  const scheduleRetry = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    retryTimeoutRef.current = setTimeout(() => {
      if (isOnline) {
        processPendingOperations()
      }
    }, 5000) // Retry after 5 seconds
  }

  // Sync specific collection with conflict resolution
  const syncCollection = async (collectionName, localData, conflictResolver = null) => {
    if (!isOnline) {
      toast.error('Cannot sync while offline')
      return
    }

    try {
      setSyncStatus('syncing')
      
      // Get remote data
      const snapshot = await getDocs(query(collection(db, collectionName), orderBy('updatedAt', 'desc')))
      const remoteData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate()
      }))

      // Create maps for easier comparison
      const localMap = new Map(localData.map(item => [item.id, item]))
      const remoteMap = new Map(remoteData.map(item => [item.id, item]))

      const conflicts = []
      const toUpdate = []
      const toCreate = []
      const toDelete = []

      // Check for conflicts and updates needed
      for (const [id, localItem] of localMap) {
        const remoteItem = remoteMap.get(id)
        
        if (!remoteItem) {
          // Item exists locally but not remotely - create
          toCreate.push(localItem)
        } else {
          // Compare timestamps for conflicts
          const localTime = new Date(localItem.updatedAt || localItem.createdAt)
          const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt)
          
          if (localTime > remoteTime) {
            // Local is newer - update remote
            toUpdate.push(localItem)
          } else if (remoteTime > localTime) {
            // Remote is newer - potential conflict
            if (conflictResolver) {
              const resolved = await conflictResolver(localItem, remoteItem)
              if (resolved !== remoteItem) {
                toUpdate.push(resolved)
              }
            } else {
              conflicts.push({ local: localItem, remote: remoteItem })
            }
          }
        }
      }

      // Check for items that exist remotely but not locally
      for (const [id, remoteItem] of remoteMap) {
        if (!localMap.has(id)) {
          // Item exists remotely but not locally - might have been deleted
          // For now, we'll keep the remote version
        }
      }

      // Execute sync operations
      const operations = []
      
      toCreate.forEach(item => {
        operations.push({
          type: 'upsert',
          collection: collectionName,
          docId: item.id,
          data: item
        })
      })

      toUpdate.forEach(item => {
        operations.push({
          type: 'upsert',
          collection: collectionName,
          docId: item.id,
          data: item
        })
      })

      // Process operations
      for (const operation of operations) {
        await executeOperation(operation)
      }

      setSyncStatus('idle')
      setLastSyncTime(new Date())
      localStorage.setItem('lastSyncTime', new Date().toISOString())
      
      if (conflicts.length > 0) {
        toast.error(`${conflicts.length} conflicts detected - manual resolution required`)
        return { success: true, conflicts }
      } else {
        toast.success(`${collectionName} synced successfully`)
        return { success: true, conflicts: [] }
      }

    } catch (error) {
      console.error('Sync error:', error)
      setSyncStatus('error')
      toast.error('Sync failed - will retry automatically')
      return { success: false, error }
    }
  }

  // Force sync all collections
  const forceSyncAll = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline')
      return
    }

    try {
      setSyncStatus('syncing')
      await processPendingOperations()
      toast.success('Full sync completed')
    } catch (error) {
      console.error('Force sync error:', error)
      toast.error('Force sync failed')
    }
  }

  // Clear all pending operations (use with caution)
  const clearPendingOperations = () => {
    setPendingOperations([])
    syncQueueRef.current = []
    localStorage.removeItem('pendingOperations')
    toast.success('Pending operations cleared')
  }

  // Get sync statistics
  const getSyncStats = () => {
    return {
      isOnline,
      syncStatus,
      pendingCount: pendingOperations.length,
      lastSyncTime,
      hasConflicts: syncStatus === 'error'
    }
  }

  const value = {
    // Status
    isOnline,
    syncStatus,
    pendingOperations,
    lastSyncTime,
    
    // Operations
    queueOperation,
    processPendingOperations,
    syncCollection,
    forceSyncAll,
    clearPendingOperations,
    getSyncStats
  }

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  )
}

export default SyncProvider