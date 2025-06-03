/*
 * AuthContext - Firebase Authentication Provider
 * Handles user authentication state and methods
 * Updated with error handling for debugging blank screen issues
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail // Added import
} from 'firebase/auth';
import { auth, db } from '../firebase/config';


const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);







  // Sign in with email and password
  const login = React.useCallback(async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  // Sign in with Google
  const loginWithGoogle = React.useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  // Sign out
  const logout = React.useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      throw error;
    }
  }, []);

  // Reset password
  const resetPassword = React.useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  }, []);

  // Update user profile
  const updateUserProfile = React.useCallback(async (updates) => {
    try {
      if (currentUser) {
        await updateProfile(currentUser, updates);
        setCurrentUser({ ...currentUser, ...updates });
      }
    } catch (error) {
      throw error;
    }
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = React.useMemo(() => ({
    currentUser,
    login,
    loginWithGoogle,
    logout,
    resetPassword, // Added for completeness, though not strictly necessary if not exposed
    updateProfile: updateUserProfile
  }), [currentUser, login, loginWithGoogle, logout, resetPassword, updateUserProfile]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}