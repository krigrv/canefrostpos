/**
 * AuthContextSupabase - Supabase Authentication Provider
 * Handles user authentication state and methods using Supabase Auth
 * Replaces Firebase authentication with Supabase
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/config';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null); // For backward compatibility
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Sign in with email and password
  const login = React.useCallback(async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success('Successfully logged in!');
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign up with email and password
  const signUp = React.useCallback(async (email, password, metadata = {}) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) throw error;
      
      toast.success('Account created successfully! Please check your email for verification.');
      return data;
    } catch (error) {
      console.error('Sign up failed:', error);
      toast.error(error.message || 'Sign up failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign in with Google
  const loginWithGoogle = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error(error.message || 'Google login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Staff login with mobile number and access code
  const loginStaff = React.useCallback(async (mobileNumber, accessCode) => {
    try {
      setLoading(true);
      
      // Query the staff table to find matching mobile number and access code
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('phone', mobileNumber)
        .eq('accessCode', accessCode)
        .eq('status', 'active')
        .single();
      
      if (staffError || !staffData) {
        throw new Error('Invalid mobile number or access code');
      }
      
      // Create a temporary user session for staff
      // Since staff don't have email/password, we'll create a custom session
      const staffUser = {
        id: `staff_${staffData.id}`,
        email: `staff_${staffData.id}@internal.pos`,
        user_metadata: {
          name: staffData.name,
          role: 'staff',
          staff_id: staffData.id,
          phone: staffData.phone,
          position: staffData.role
        },
        app_metadata: {
          provider: 'staff',
          providers: ['staff']
        }
      };
      
      // Set the staff user as current user
      setCurrentUser(staffUser);
      setUser(staffUser);
      setIsAuthenticated(true);
      
      toast.success('Staff login successful!');
      return { user: staffUser };
    } catch (error) {
      console.error('Staff login failed:', error);
      toast.error(error.message || 'Staff login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const logout = React.useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setCurrentUser(null);
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Successfully logged out!');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error(error.message || 'Logout failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password
  const resetPassword = React.useCallback(async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      toast.success('Password reset email sent!');
    } catch (error) {
      console.error('Password reset failed:', error);
      toast.error(error.message || 'Password reset failed');
      throw error;
    }
  }, []);

  // Update user profile
  const updateUserProfile = React.useCallback(async (updates) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      
      if (error) throw error;
      
      setCurrentUser(data.user);
      setUser(data.user);
      toast.success('Profile updated successfully!');
      return data;
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error(error.message || 'Profile update failed');
      throw error;
    }
  }, []);

  // Update password
  const updatePassword = React.useCallback(async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully!');
    } catch (error) {
      console.error('Password update failed:', error);
      toast.error(error.message || 'Password update failed');
      throw error;
    }
  }, []);

  // Get current session
  const getSession = React.useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session failed:', error);
      return null;
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          if (session?.user) {
            setCurrentUser(session.user);
            setUser(session.user);
            setIsAuthenticated(true);
          } else {
            setCurrentUser(null);
            setUser(null);
            setIsAuthenticated(false);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (mounted) {
          if (session?.user) {
            setCurrentUser(session.user);
            setUser(session.user);
            setIsAuthenticated(true);
          } else {
            setCurrentUser(null);
            setUser(null);
            setIsAuthenticated(false);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = React.useMemo(() => ({
    currentUser,
    user, // For backward compatibility
    isAuthenticated,
    loading,
    login,
    signUp,
    loginWithGoogle,
    loginStaff,
    logout,
    resetPassword,
    updateProfile: updateUserProfile,
    updateUserProfile,
    updatePassword,
    getSession
  }), [
    currentUser,
    user,
    isAuthenticated,
    loading,
    login,
    signUp,
    loginWithGoogle,
    loginStaff,
    logout,
    resetPassword,
    updateUserProfile,
    updatePassword,
    getSession
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };