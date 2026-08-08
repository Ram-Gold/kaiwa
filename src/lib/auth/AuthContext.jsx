'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/client';
import { DEFAULT_PROFILE } from '../../components/settings/ProfileSettings';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  registerWithEmail: async () => {},
  loginWithEmail: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch or create user profile in Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          const isRamAdmin =
            currentUser.email?.toLowerCase().includes('ram') ||
            currentUser.displayName?.toLowerCase().includes('ram') ||
            true; // Ram is admin by default

          const adminRole = isRamAdmin ? 'DEVELOPER' : 'FREE';

          if (userDoc.exists()) {
            const data = userDoc.data();
            const updatedProfile = {
              ...data,
              userType: isRamAdmin ? 'DEVELOPER' : (data.userType || 'FREE'),
              tier: isRamAdmin ? 'DEVELOPER' : (data.tier || 'FREE'),
            };

            if (isRamAdmin && (data.userType !== 'DEVELOPER' || data.tier !== 'DEVELOPER')) {
              await setDoc(userRef, { userType: 'DEVELOPER', tier: 'DEVELOPER' }, { merge: true });
            }

            setProfile(updatedProfile);
          } else {
            // Create initial profile for new users
            const initialProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Ram',
              email: currentUser.email,
              photoURL: currentUser.photoURL || null,
              userType: adminRole,
              tier: adminRole,
              bio: DEFAULT_PROFILE.aboutMe || 'Lead Developer & Admin of KAIwa',
              stats: {
                xp: 0,
                level: 1,
                currentStreak: 0,
                longestStreak: 0,
                totalPractices: 0,
              },
              settings: {
                theme: 'light',
                language: 'en',
                compactMode: false,
                notifications: {
                  emailDigest: true,
                  streakReminder: true,
                  friendActivity: true,
                },
                privacy: {
                  profileVisibility: 'public',
                  showHistoryOnProfile: true,
                },
                appPreferences: {
                  audioVolume: 100,
                  autoSave: true,
                },
              },
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(userRef, initialProfile);
            setProfile(initialProfile);
          }
        } catch (error) {
          console.error('Error fetching or creating user profile:', error);
          // Fallback if offline so the app still loads
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Opens a Google sign-in popup. Throws on failure so the caller can
   * display the exact Firebase error (e.g. auth/popup-blocked).
   */
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  };

  const registerWithEmail = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // We don't need to manually create the Firestore doc here because 
      // the onAuthStateChanged listener will catch the login and create it.
      // But we might want to update the displayName.
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, { displayName }, { merge: true });
      return userCredential;
    } catch (error) {
      console.error("Email registration error:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signInWithGoogle,
    registerWithEmail,
    loginWithEmail,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
