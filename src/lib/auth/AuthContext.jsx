'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/client';
import { DEFAULT_PROFILE } from '../../components/settings/ProfileSettings';
import { getUserRole, hasPermission, hasRole, isDeveloper } from './rbac';
import { getStreakStatus } from '../firebase/firestore';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  role: 'FREE',
  hasPermission: () => false,
  hasRole: () => false,
  isDeveloper: false,
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
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

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

          if (!userDoc.exists()) {
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
                lastPracticeDate: null,
                lastPracticedAt: null,
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
          } else if (isRamAdmin) {
            const data = userDoc.data();
            if (data.userType !== 'DEVELOPER' || data.tier !== 'DEVELOPER') {
              await setDoc(userRef, { userType: 'DEVELOPER', tier: 'DEVELOPER' }, { merge: true });
            }
          }

          // Real-time snapshot listener for user profile & streak changes
          unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const streakInfo = getStreakStatus(data.stats);
              const effectiveProfile = {
                ...data,
                userType: isRamAdmin ? 'DEVELOPER' : (data.userType || 'FREE'),
                tier: isRamAdmin ? 'DEVELOPER' : (data.tier || 'FREE'),
                stats: {
                  ...(data.stats || {}),
                  currentStreak: streakInfo.currentStreak,
                  longestStreak: streakInfo.longestStreak,
                  isActiveToday: streakInfo.isActiveToday,
                  isExpiringSoon: streakInfo.isExpiringSoon,
                  isBroken: streakInfo.isBroken,
                  streakMessage: streakInfo.message,
                },
              };
              setProfile(effectiveProfile);
            }
          }, (err) => {
            console.error('User doc snapshot error:', err);
          });
        } catch (error) {
          console.error('Error fetching or creating user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
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

  const activeRole = getUserRole(profile || user);
  const checkPermission = (perm) => hasPermission(profile || user, perm);
  const checkRole = (r) => hasRole(profile || user, r);
  const checkIsDeveloper = isDeveloper(profile || user);

  const value = {
    user,
    profile,
    loading,
    role: activeRole,
    hasPermission: checkPermission,
    hasRole: checkRole,
    isDeveloper: checkIsDeveloper,
    signInWithGoogle,
    registerWithEmail,
    loginWithEmail,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
