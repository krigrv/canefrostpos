import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../supabase/config'
import { useSync } from './SyncContext'
import toast from 'react-hot-toast'

const StaffContext = createContext()

export const useStaff = () => {
  const context = useContext(StaffContext)
  if (!context) {
    throw new Error('useStaff must be used within a StaffProvider')
  }
  return context
}

export const StaffProvider = ({ children }) => {
  const [staff, setStaff] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const { isOnline, queueOperation } = useSync()

  // Load staff data
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          throw error
        }
        
        setStaff(data || [])
      } catch (error) {
        console.error('Error loading staff:', error)
        toast.error('Failed to load staff data')
      } finally {
        setLoading(false)
      }
    }

    loadStaff()
  }, [])

  // Load shifts data
  useEffect(() => {
    const loadShifts = async () => {
      try {
        const { data, error } = await supabase
          .from('shifts')
          .select('*')
          .order('start_time', { ascending: false })
        
        if (error) {
          throw error
        }
        
        setShifts(data || [])
      } catch (error) {
        console.error('Error loading shifts:', error)
        toast.error('Failed to load shifts data')
      }
    }

    loadShifts()
  }, [])

  // Add new staff member
  const addStaffMember = useCallback(async (staffData) => {
    try {
      const staffWithDefaults = {
        ...staffData,
        join_date: staffData.joinDate ? new Date(staffData.joinDate).toISOString() : new Date().toISOString(),
        is_active: staffData.isActive !== undefined ? staffData.isActive : true,
        permissions: staffData.permissions || {
          canManageInventory: false,
          canManageStaff: false,
          canViewReports: false,
          canManageSettings: false
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('staff')
        .insert([staffWithDefaults])
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      // Update local state
      setStaff(prev => [data, ...prev])
      
      console.log('Staff member added with ID:', data.id)
      toast.success('Staff member added successfully')
      return data.id
    } catch (error) {
      console.error('Error adding staff member:', error)
      toast.error('Failed to add staff member')
      throw error
    }
  }, [isOnline, queueOperation])

  // Update staff member
  const updateStaffMember = useCallback(async (staffId, staffData) => {
    try {
      const updatePayload = {
        ...staffData,
        updated_at: new Date().toISOString()
      }

      // Convert joinDate to ISO string if it's a Date or string
      if (staffData.joinDate) {
        updatePayload.join_date = new Date(staffData.joinDate).toISOString()
        delete updatePayload.joinDate
      }
      
      // Convert isActive to is_active
      if (staffData.isActive !== undefined) {
        updatePayload.is_active = staffData.isActive
        delete updatePayload.isActive
      }

      const { error } = await supabase
        .from('staff')
        .update(updatePayload)
        .eq('id', staffId)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setStaff(prev => 
        prev.map(s => s.id === staffId ? { ...s, ...updatePayload } : s)
      )
      
      toast.success('Staff member updated successfully')
    } catch (error) {
      console.error('Error updating staff member:', error)
      toast.error('Failed to update staff member')
      throw error
    }
  }, [])

  // Delete staff member
  const deleteStaffMember = useCallback(async (staffId) => {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setStaff(prev => prev.filter(s => s.id !== staffId))
      
      toast.success('Staff member deleted successfully')
    } catch (error) {
      console.error('Error deleting staff member:', error)
      toast.error('Failed to delete staff member')
      throw error
    }
  }, [])

  // Add new shift
  const addShift = useCallback(async (shiftData) => {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert([{
          ...shiftData,
          date: new Date(shiftData.date).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      // Update local state
      setShifts(prev => [data, ...prev])
      
      console.log('Shift added with ID:', data.id)
      toast.success('Shift added successfully')
      return data.id
    } catch (error) {
      console.error('Error adding shift:', error)
      toast.error('Failed to add shift')
      throw error
    }
  }, [])

  // Update shift
  const updateShift = useCallback(async (shiftId, shiftData) => {
    try {
      const updateData = {
        ...shiftData,
        updated_at: new Date().toISOString()
      }
      
      // Convert date to ISO string if it's a Date or string
      if (shiftData.date) {
        updateData.date = new Date(shiftData.date).toISOString()
      }
      
      const { error } = await supabase
        .from('shifts')
        .update(updateData)
        .eq('id', shiftId)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setShifts(prev => 
        prev.map(s => s.id === shiftId ? { ...s, ...updateData } : s)
      )
      
      toast.success('Shift updated successfully')
    } catch (error) {
      console.error('Error updating shift:', error)
      toast.error('Failed to update shift')
      throw error
    }
  }, [])

  // Delete shift
  const deleteShift = useCallback(async (shiftId) => {
    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setShifts(prev => prev.filter(s => s.id !== shiftId))
      
      toast.success('Shift deleted successfully')
    } catch (error) {
      console.error('Error deleting shift:', error)
      toast.error('Failed to delete shift')
      throw error
    }
  }, [])

  const value = useMemo(() => ({
    staff,
    shifts,
    loading,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    addShift,
    updateShift,
    deleteShift
  }), [
    staff,
    shifts,
    loading,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    addShift,
    updateShift,
    deleteShift
  ])

  return (
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  )
}