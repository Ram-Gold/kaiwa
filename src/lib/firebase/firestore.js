import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit as limitQuery,
  startAfter,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './client';

/* ==========================================================================
   1. PROFILE & SETTINGS
   ========================================================================== */

/**
 * Fetch profile document and settings for a given user.
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

/**
 * Update specific nested settings fields for a user.
 */
export async function updateUserSettings(uid, partialSettings) {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { settings: partialSettings, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Update user profile fields (displayName, bio, photoURL, etc.).
 */
export async function updateProfile(uid, profileData) {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { ...profileData, updatedAt: serverTimestamp() }, { merge: true });
}

// Legacy wrappers for backward compatibility
export async function saveUserProfile(userId, data) {
  return updateProfile(userId, data);
}

export async function saveUserSettings(userId, settingsData) {
  return updateUserSettings(userId, settingsData);
}

export async function saveAiProviderSettings(userId, provider, apiKey) {
  if (!userId) return;
  return updateUserSettings(userId, { aiProvider: provider });
}

/* ==========================================================================
   2. LINKS & SOCIAL
   ========================================================================== */

/**
 * Add a profile link to /users/{uid}/links
 */
export async function addProfileLink(uid, linkData) {
  if (!uid) return;
  const linksRef = collection(db, 'users', uid, 'links');
  const docRef = await addDoc(linksRef, {
    ...linkData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Remove a profile link from /users/{uid}/links/{linkId}
 */
export async function removeProfileLink(uid, linkId) {
  if (!uid || !linkId) return;
  const linkRef = doc(db, 'users', uid, 'links', linkId);
  await deleteDoc(linkRef);
}

/**
 * Update an existing profile link
 */
export async function updateProfileLink(uid, linkId, linkData) {
  if (!uid || !linkId) return;
  const linkRef = doc(db, 'users', uid, 'links', linkId);
  await updateDoc(linkRef, linkData);
}

/**
 * Get all profile links for a user
 */
export async function getUserLinks(uid) {
  if (!uid) return [];
  const linksRef = collection(db, 'users', uid, 'links');
  const snapshot = await getDocs(linksRef);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

// Alias for addProfileLink
export async function addUserLink(userId, linkData) {
  return addProfileLink(userId, linkData);
}

/**
 * Send a friend request from senderUid to receiverUid
 */
export async function sendFriendRequest(senderUid, receiverUid) {
  if (!senderUid || !receiverUid) return;
  const requestsRef = collection(db, 'friend_requests');
  const docRef = await addDoc(requestsRef, {
    senderId: senderUid,
    receiverId: receiverUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Respond to a friend request ('accepted' or 'rejected')
 */
export async function respondToFriendRequest(requestId, acceptBoolean) {
  if (!requestId) return;
  const status = acceptBoolean ? 'accepted' : 'rejected';
  const requestRef = doc(db, 'friend_requests', requestId);

  await updateDoc(requestRef, { status });

  if (acceptBoolean) {
    const snap = await getDoc(requestRef);
    if (snap.exists()) {
      const { senderId, receiverId } = snap.data();
      if (senderId && receiverId) {
        await addFriend(senderId, { friendUserId: receiverId });
        await addFriend(receiverId, { friendUserId: senderId });
      }
    }
  }
}

export async function respondFriendRequest(requestId, status) {
  return respondToFriendRequest(requestId, status === 'accepted');
}

/**
 * Add a friend record to /users/{userId}/friends/{friendUserId}
 */
export async function addFriend(userId, friendData) {
  if (!userId || !friendData.friendUserId) return;
  const friendRef = doc(db, 'users', userId, 'friends', friendData.friendUserId);
  await setDoc(friendRef, {
    ...friendData,
    since: serverTimestamp(),
  }, { merge: true });
}

/**
 * Remove a friend record from /users/{userId}/friends/{friendUserId}
 */
export async function removeFriend(userId, friendUserId) {
  if (!userId || !friendUserId) return;
  const friendRef = doc(db, 'users', userId, 'friends', friendUserId);
  await deleteDoc(friendRef);
}

/**
 * Toggle following a user
 */
export async function toggleFollowUser(currentUid, targetUid, isFollowing, targetData) {
  if (!currentUid || !targetUid) return;
  if (isFollowing) {
    await removeFriend(currentUid, targetUid);
  } else {
    await addFriend(currentUid, { friendUserId: targetUid, ...targetData });
  }
}

/**
 * Get all friends for a user
 */
export async function getFriends(uid) {
  if (!uid) return [];
  const friendsRef = collection(db, 'users', uid, 'friends');
  const snapshot = await getDocs(friendsRef);
  return snapshot.docs.map(docSnap => ({ friendUserId: docSnap.id, ...docSnap.data() }));
}

/**
 * Get all users except the current one
 */
export async function getAllUsers(currentUid) {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  return snapshot.docs
    .map(docSnap => ({ uid: docSnap.id, ...docSnap.data() }))
    .filter(u => u.uid !== currentUid);
}

/**
 * Fetch global categories for filtering lessons and roleplays
 */
export async function getCategories() {
  try {
    const catDoc = await getDoc(doc(db, 'appSettings', 'categories'));
    if (catDoc.exists()) {
      return catDoc.data().order || ['Beginner', 'Food', 'Memes', 'Life'];
    }
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  }
  return ['Beginner', 'Food', 'Memes', 'Life'];
}

/* ==========================================================================
   3. HISTORY & GAMIFICATION & 24HR STREAK
   ========================================================================== */

/**
 * Calculates updated 24-hour streak stats given previous stats and current time.
 * 
 * Rules:
 * - If last practice was TODAY (same calendar date):
 *     currentStreak is maintained (already active for today).
 * - If last practice was YESTERDAY (exactly 1 calendar day ago):
 *     currentStreak is incremented by 1.
 *     longestStreak = Math.max(longestStreak, currentStreak).
 * - If last practice was older than yesterday (or first practice ever):
 *     currentStreak is set to 1.
 *     longestStreak = Math.max(longestStreak || 0, 1).
 */
export function calculateUpdatedStreak(previousStats = {}, now = new Date()) {
  const currentStreak = Number(previousStats?.currentStreak) || 0;
  const longestStreak = Number(previousStats?.longestStreak) || 0;
  const lastPracticeDate = previousStats?.lastPracticeDate;

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yYear = yesterday.getFullYear();
  const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
  const yDay = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

  let newCurrentStreak = currentStreak;
  let isNewDay = false;

  if (!lastPracticeDate) {
    newCurrentStreak = 1;
    isNewDay = true;
  } else if (lastPracticeDate === todayStr) {
    newCurrentStreak = Math.max(currentStreak, 1);
    isNewDay = false;
  } else if (lastPracticeDate === yesterdayStr) {
    newCurrentStreak = currentStreak + 1;
    isNewDay = true;
  } else {
    // Missed at least one day
    newCurrentStreak = 1;
    isNewDay = true;
  }

  const newLongestStreak = Math.max(longestStreak, newCurrentStreak);

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastPracticeDate: todayStr,
    lastPracticedAt: now.getTime(),
    isNewDay,
  };
}

/**
 * Checks whether an existing streak is currently valid, active for today, expiring soon, or broken.
 */
export function getStreakStatus(stats = {}, now = new Date()) {
  const currentStreak = Number(stats?.currentStreak) || 0;
  const longestStreak = Number(stats?.longestStreak) || 0;
  const lastPracticeDate = stats?.lastPracticeDate;

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yYear = yesterday.getFullYear();
  const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
  const yDay = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

  if (!lastPracticeDate || currentStreak === 0) {
    return {
      currentStreak: 0,
      longestStreak,
      isActiveToday: false,
      isExpiringSoon: false,
      isBroken: true,
      message: 'Practice now to start your streak!',
    };
  }

  if (lastPracticeDate === todayStr) {
    return {
      currentStreak,
      longestStreak,
      isActiveToday: true,
      isExpiringSoon: false,
      isBroken: false,
      message: 'Streak saved for today!',
    };
  }

  if (lastPracticeDate === yesterdayStr) {
    return {
      currentStreak,
      longestStreak,
      isActiveToday: false,
      isExpiringSoon: true,
      isBroken: false,
      message: '24h window active • Practice today to keep it!',
    };
  }

  return {
    currentStreak: 0,
    longestStreak,
    isActiveToday: false,
    isExpiringSoon: false,
    isBroken: true,
    message: 'Streak expired. Practice to start a new one!',
  };
}

/**
 * Update user streak and XP directly in Firestore.
 */
export async function recordUserActivityStreak(uid, xpEarned = 10) {
  if (!uid) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};
    const currentStats = userData.stats || {};
    const streakResult = calculateUpdatedStreak(currentStats);

    const updatedStats = {
      ...currentStats,
      totalPractices: (currentStats.totalPractices || 0) + 1,
      xp: (currentStats.xp || 0) + xpEarned,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      lastPracticeDate: streakResult.lastPracticeDate,
      lastPracticedAt: streakResult.lastPracticedAt,
    };

    await setDoc(userRef, {
      stats: updatedStats,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return updatedStats;
  } catch (err) {
    console.error('Failed to record activity streak in Firestore:', err);
    return null;
  }
}

/**
 * Record completed practice session and update user practice count, 24h streak, & XP
 */
export async function logPracticeSession(uid, sessionData) {
  if (!uid) return;
  const docId = sessionData.id || `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const docRef = doc(db, 'users', uid, 'history', docId);
  await setDoc(docRef, {
    ...sessionData,
    id: docId,
    timestamp: serverTimestamp(),
  });

  const xpEarned = sessionData.score ? Math.round(sessionData.score / 2) : (sessionData.xp || 10);
  
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};
    const currentStats = userData.stats || {};
    const streakResult = calculateUpdatedStreak(currentStats);

    await setDoc(userRef, {
      stats: {
        ...currentStats,
        totalPractices: (currentStats.totalPractices || 0) + 1,
        xp: (currentStats.xp || 0) + xpEarned,
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastPracticeDate: streakResult.lastPracticeDate,
        lastPracticedAt: streakResult.lastPracticedAt,
      },
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to update streak stats in Firestore:', err);
  }

  return docId;
}

export async function addPracticeHistory(userId, historyData) {
  return logPracticeSession(userId, historyData);
}

export async function saveChatSession(userId, sessionData) {
  if (!userId) return;
  const sessionsRef = collection(db, 'users', userId, 'sessions');
  const docRef = await addDoc(sessionsRef, {
    ...sessionData,
    date: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Paginated query of past practice sessions for a user
 */
export async function fetchPracticeHistory(uid, limitCount = 10, startAfterDoc = null) {
  if (!uid) return { docs: [], lastDoc: null };

  const historyRef = collection(db, 'users', uid, 'history');
  let q = query(historyRef, orderBy('timestamp', 'desc'), limitQuery(limitCount));

  if (startAfterDoc) {
    q = query(historyRef, orderBy('timestamp', 'desc'), startAfter(startAfterDoc), limitQuery(limitCount));
  }

  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map((docSnap) => ({ ...docSnap.data(), id: docSnap.id }));
  const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { docs, lastDoc };
}

/**
 * Delete a practice session record from history (Firestore & LocalStorage)
 */
export async function deletePracticeSession(uid, sessionId) {
  if (!sessionId) return;

  // 1. Always remove from localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = JSON.parse(window.localStorage.getItem('kaiwa.local_history') || '[]');
      const updated = stored.filter((item) => item.id !== sessionId);
      window.localStorage.setItem('kaiwa.local_history', JSON.stringify(updated));
    } catch (err) {
      console.error('Error removing local practice history:', err);
    }
  }

  // 2. Remove from Firestore if user is authenticated
  if (uid) {
    try {
      const sessionRef = doc(db, 'users', uid, 'history', sessionId);
      await deleteDoc(sessionRef);

      // Decrement totalPractices in user stats
      const userRef = doc(db, 'users', uid);
      await setDoc(
        userRef,
        {
          stats: {
            totalPractices: increment(-1),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => console.error('Error updating user stats on delete:', err));
    } catch (err) {
      console.error('Error deleting practice session from Firestore:', err);
    }
  }
}

/**
 * Fetch unlocked badges for a user
 */
export async function getUserBadges(uid) {
  if (!uid) return [];
  const badgesRef = collection(db, 'users', uid, 'user_badges');
  const snapshot = await getDocs(badgesRef);
  return snapshot.docs.map((docSnap) => ({ badgeId: docSnap.id, ...docSnap.data() }));
}

/**
 * Claim/unlock a badge for a user
 */
export async function claimBadge(uid, badgeId, isFeatured = false) {
  if (!uid || !badgeId) return;
  const badgeRef = doc(db, 'users', uid, 'user_badges', badgeId);
  await setDoc(badgeRef, {
    badgeId,
    unlockedAt: serverTimestamp(),
    isFeatured,
  }, { merge: true });
}

export async function unlockUserBadge(userId, badgeId, isFeatured = false) {
  return claimBadge(userId, badgeId, isFeatured);
}

export async function saveSrsWord(userId, wordData) {
  if (!userId) return;
  const wordRef = doc(db, 'users', userId, 'srs', wordData.term);
  await setDoc(wordRef, {
    ...wordData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function createMasterBadge(badgeId, badgeData) {
  if (!badgeId) return;
  const badgeRef = doc(db, 'badges', badgeId);
  await setDoc(badgeRef, {
    badgeId,
    ...badgeData,
  }, { merge: true });
}

/* ==========================================================================
   4. MODULE PROGRESS
   ========================================================================== */

/**
 * Fetch all module progress for a given user.
 * Returns a dictionary mapped by moduleId.
 */
export async function getUserModuleProgress(uid) {
  if (!uid) return {};
  
  const progressRef = collection(db, 'users', uid, 'module_progress');
  const snap = await getDocs(progressRef);
  
  const progressMap = {};
  snap.forEach((doc) => {
    progressMap[doc.id] = doc.data();
  });
  
  return progressMap;
}

/**
 * Updates or creates a module progress entry.
 * @param {string} uid User ID
 * @param {string} moduleId Module ID (e.g. 'introduction')
 * @param {number} progressAmount Integer 0-100
 */
export async function updateModuleProgress(uid, moduleId, progressAmount) {
  if (!uid || !moduleId) return;
  
  const progressRef = doc(db, 'users', uid, 'module_progress', moduleId);
  
  await setDoc(progressRef, {
    progress: progressAmount,
    status: progressAmount >= 100 ? 'completed' : progressAmount > 0 ? 'in_progress' : 'not_started',
    lastStudiedAt: serverTimestamp(),
  }, { merge: true });
}

/* ==========================================================================
   5. LESSONS CATALOG
   ========================================================================== */

const DEFAULT_LESSONS_SEED = [
  {
    id: 'introduction',
    title: 'Introduction',
    jpTitle: 'はじめまして',
    category: 'Beginner',
    kind: 'lesson',
    level: 'N5',
    minutes: 8,
    accent: 'moss',
    summary: 'Practice your first self-introduction with simple, confident sentences.',
    headsUp: [
      'Keep answers short: name, origin, and one like.',
      'Use はじめまして at the start, then よろしくお願いします at the end.',
      'KAIwa will nudge you if particles feel off.'
    ],
    prep: ['私は ___ です', '___ が好きです', 'よろしくお願いします']
  },
  {
    id: 'common-phrases',
    title: 'Common Phrases',
    jpTitle: 'よく使う表現',
    category: 'Beginner',
    kind: 'lesson',
    level: 'N5',
    minutes: 12,
    accent: 'mustard',
    summary: 'Warm up everyday phrases for greetings, thanks, apologies, and quick replies.',
    headsUp: [
      'Listen for formality: です and ます keep it polite.',
      'Short natural replies are better than long translated sentences.',
      'Repeat a phrase once if you want KAIwa to drill it.'
    ],
    prep: ['ありがとうございます', 'すみません', '大丈夫です']
  },
  {
    id: 'likes-dislikes',
    title: 'Likes & Dislikes',
    jpTitle: '好き・嫌い',
    category: 'Life',
    kind: 'lesson',
    level: 'N5',
    minutes: 10,
    accent: 'correction',
    summary: 'Talk about what you like, dislike, and want to try next.',
    headsUp: [
      'Use が with 好き: コーヒーが好きです.',
      'Add とても or ちょっと to soften your answer.',
      'Expect follow-up questions asking why.'
    ],
    prep: ['___ が好きです', '___ はちょっと苦手です', 'どうしてですか']
  },
  {
    id: 'basic-verbs',
    title: 'Basic Verbs',
    jpTitle: '基本動詞',
    category: 'Beginner',
    kind: 'lesson',
    level: 'N5',
    minutes: 15,
    accent: 'aizome',
    summary: 'Use daily action verbs in short present and past-tense sentences.',
    headsUp: [
      'Focus on one verb per sentence.',
      'KAIwa may ask what you did today or what you do every morning.',
      'If stuck, answer with the verb stem and KAIwa will scaffold it.'
    ],
    prep: ['食べます', '行きます', '見ました']
  },
  {
    id: 'simple-sentences',
    title: 'Simple Sentences',
    jpTitle: '簡単な文',
    category: 'Life',
    kind: 'lesson',
    level: 'N5',
    minutes: 14,
    accent: 'mustard',
    summary: 'Build clean subject-topic sentences without overthinking grammar.',
    headsUp: [
      'Start with topic は, then say one clear thing.',
      'It is okay to answer slowly and revise.',
      'KAIwa will keep corrections small and actionable.'
    ],
    prep: ['今日は ___ です', '私は ___ に行きます', 'これは ___ です']
  },
  {
    id: 'personal-info',
    title: 'Personal Info',
    jpTitle: '自己紹介',
    category: 'Life',
    kind: 'lesson',
    level: 'N5',
    minutes: 9,
    accent: 'moss',
    summary: 'Answer common questions about yourself with safe local-first profile memory.',
    headsUp: [
      'Only share details you want saved locally on this device.',
      'Practice name, country, work or school, and hobbies.',
      'KAIwa can remember your preferred name for later sessions.'
    ],
    prep: ['お名前は？', 'どこから来ましたか', '趣味は何ですか']
  },
  {
    id: 'ordering-food',
    title: 'Ordering Food',
    jpTitle: '注文する',
    category: 'Food',
    kind: 'lesson',
    level: 'N5',
    minutes: 11,
    accent: 'correction',
    summary: 'Order politely, ask for recommendations, and confirm what you want.',
    headsUp: [
      'Use ___ をください for simple orders.',
      'Pointing language is useful: これ, それ, あれ.',
      'Expect a confirmation question before checkout.'
    ],
    prep: ['これをください', 'おすすめは何ですか', '水をお願いします']
  },
  {
    id: 'meme-replies',
    title: 'Meme Replies',
    jpTitle: 'ネット表現',
    category: 'Memes',
    kind: 'lesson',
    level: 'N4',
    minutes: 7,
    accent: 'aizome',
    summary: 'Practice light internet replies while keeping tone natural and friendly.',
    headsUp: [
      'Casual Japanese can sound too blunt if translated directly.',
      'KAIwa will flag phrases that are funny but risky.',
      'Short reactions are the goal here.'
    ],
    prep: ['かわいい', 'おもしろい', 'ほんとう？']
  }
];

export async function seedLessonsToFirestore() {
  for (const lesson of DEFAULT_LESSONS_SEED) {
    const lessonRef = doc(db, 'lessons', lesson.id);
    const { id, ...data } = lesson;
    await setDoc(lessonRef, data, { merge: true });
  }
}

/**
 * Fetch all lessons directly from Firestore.
 * If empty or blocked by permissions, seeds or falls back to default lessons.
 */
export async function seedDatabase(userId = null) {
  try {
    console.log('Seeding initial data...');

    // Seed categories
    await setDoc(doc(db, 'appSettings', 'categories'), {
      order: ['Beginner', 'Food', 'Memes', 'Life']
    });

    await seedLessonsToFirestore();
    // (Other seed functions would go here)
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

export async function getLessons() {
  try {
    const lessonsRef = collection(db, 'lessons');
    let snap = await getDocs(lessonsRef);
    
    if (snap.empty) {
      try {
        await seedLessonsToFirestore();
        snap = await getDocs(lessonsRef);
      } catch (seedErr) {
        console.warn('Could not seed lessons to Firestore (check auth / security rules):', seedErr);
        return DEFAULT_LESSONS_SEED.map(l => ({ ...l, href: `/briefing/${l.id}` }));
      }
    }
    
    const lessonsList = [];
    snap.forEach((docSnap) => {
      lessonsList.push({
        id: docSnap.id,
        ...docSnap.data(),
        href: `/briefing/${docSnap.id}`
      });
    });
    
    return lessonsList.length > 0 ? lessonsList : DEFAULT_LESSONS_SEED.map(l => ({ ...l, href: `/briefing/${l.id}` }));
  } catch (err) {
    console.warn('Firestore getLessons error, falling back to default catalog:', err);
    return DEFAULT_LESSONS_SEED.map(l => ({ ...l, href: `/briefing/${l.id}` }));
  }
}

/**
 * Fetch a single lesson from Firestore by ID.
 * Falls back to null safely if permissions or network fail during SSR.
 */
export async function getLessonById(lessonId) {
  if (!lessonId) return null;
  try {
    const lessonRef = doc(db, 'lessons', lessonId);
    const snap = await getDoc(lessonRef);
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...snap.data(),
      startHref: `/chat/sensei?briefing=${snap.id}&type=lesson`
    };
  } catch (err) {
    console.warn(`Firestore getLessonById error for ${lessonId}, falling back to static briefing:`, err);
    return null;
  }
}

/* ==========================================================================
   6. ROLEPLAYS CATALOG
   ========================================================================== */

const DEFAULT_ROLEPLAYS_SEED = [
  {
    id: 'train-station',
    title: 'Train Station',
    jpTitle: '駅で迷った時',
    category: 'Beginner',
    kind: 'roleplay',
    level: 'N5',
    minutes: 8,
    accent: 'mustard',
    image: '/assets/bg_eki_homedoor_train_open.jpg',
    summary: 'You are at a station and need help finding the right platform.',
    headsUp: [
      'Say where you want to go first.',
      'Listen for platform numbers and direction words.',
      'すみません is your safest opener.'
    ],
    prep: ['___ に行きたいです', '何番線ですか', 'ありがとうございます'],
    startHref: '/chat/sensei?briefing=train-station&type=roleplay'
  },
  {
    id: 'idol-cheki',
    title: 'Idol Cheki',
    jpTitle: 'ライブ後の一言',
    category: 'Memes',
    kind: 'roleplay',
    level: 'N4',
    minutes: 6,
    accent: 'correction',
    image: '/assets/bg_music_live_stage.jpg',
    summary: 'You get a quick post-live cheki moment and want to say something warm.',
    headsUp: [
      'Keep it short; the scene is fast.',
      'Compliments should be simple and sincere.',
      'KAIwa will help you avoid overly direct translations.'
    ],
    prep: ['ライブ最高でした', '応援しています', 'また来ます'],
    startHref: '/chat/idol?briefing=idol-cheki&type=roleplay'
  },
  {
    id: 'colleague-hiroen',
    title: 'Colleague Hiroen',
    jpTitle: '同僚と雑談',
    category: 'Life',
    kind: 'roleplay',
    level: 'N3',
    minutes: 12,
    accent: 'aizome',
    image: '/assets/bg_ryokan_hiroen.jpg',
    summary: 'Practice a relaxed work-adjacent chat with a colleague after hours.',
    headsUp: [
      'Use polite casual balance: friendly, not too stiff.',
      'Ask one follow-up before changing topics.',
      'KAIwa will model softer phrasing when needed.'
    ],
    prep: ['お疲れさまです', '週末は何をしましたか', 'いいですね'],
    startHref: '/chat/sensei?briefing=colleague-hiroen&type=roleplay'
  },
  {
    id: 'convenience-store',
    title: 'Convenience Store',
    jpTitle: 'コンビニ会話',
    category: 'Food',
    kind: 'roleplay',
    level: 'N5',
    minutes: 7,
    accent: 'moss',
    summary: 'Handle checkout, bags, payment, and quick store questions.',
    headsUp: [
      'Most questions are yes/no at checkout.',
      '聞き取れない is okay — ask for repetition.',
      'Practice declining politely: 大丈夫です.'
    ],
    prep: ['袋はいりますか', 'カードでお願いします', '大丈夫です'],
    startHref: '/chat/sensei?briefing=convenience-store&type=roleplay'
  },
  {
    id: 'job-interview',
    title: 'Job Interview',
    jpTitle: '面接の練習',
    category: 'Life',
    kind: 'roleplay',
    level: 'N2',
    minutes: 15,
    accent: 'correction',
    summary: 'Prepare concise, respectful interview answers with structured follow-ups.',
    headsUp: [
      'Answer in short blocks: point, example, result.',
      'Use polite endings consistently.',
      'If you need time, say 少し考えてもいいですか.'
    ],
    prep: ['自己紹介をお願いします', '志望理由は何ですか', '少し考えてもいいですか'],
    startHref: '/chat/sensei?briefing=job-interview&type=roleplay'
  },
  {
    id: 'teacher-teaching',
    title: 'Teacher Teaching',
    jpTitle: '先生に質問する',
    category: 'Beginner',
    kind: 'roleplay',
    level: 'N5',
    minutes: 10,
    accent: 'mustard',
    image: '/assets/bg_school_room_back.jpg',
    summary: 'Ask a teacher for clarification and practice saying what you do not understand.',
    headsUp: [
      'Be direct but polite about confusion.',
      'Ask for examples when grammar feels abstract.',
      'KAIwa will break explanations into smaller steps.'
    ],
    prep: ['わかりません', '例をください', 'もう一度お願いします'],
    startHref: '/chat/sensei?briefing=teacher-teaching&type=roleplay'
  }
];

export async function seedRoleplaysToFirestore() {
  for (const roleplay of DEFAULT_ROLEPLAYS_SEED) {
    const roleplayRef = doc(db, 'roleplays', roleplay.id);
    const { id, ...data } = roleplay;
    await setDoc(roleplayRef, data, { merge: true });
  }
}

export async function getRoleplays() {
  try {
    const roleplaysRef = collection(db, 'roleplays');
    let snap = await getDocs(roleplaysRef);
    
    if (snap.empty) {
      try {
        await seedRoleplaysToFirestore();
        snap = await getDocs(roleplaysRef);
      } catch (seedErr) {
        console.warn('Could not seed roleplays to Firestore (check auth / security rules):', seedErr);
        return DEFAULT_ROLEPLAYS_SEED.map(r => ({ ...r, href: `/briefing/${r.id}` }));
      }
    }
    
    const roleplaysList = [];
    snap.forEach((docSnap) => {
      roleplaysList.push({
        id: docSnap.id,
        ...docSnap.data(),
        href: `/briefing/${docSnap.id}`
      });
    });
    
    return roleplaysList.length > 0 ? roleplaysList : DEFAULT_ROLEPLAYS_SEED.map(r => ({ ...r, href: `/briefing/${r.id}` }));
  } catch (err) {
    console.warn('Firestore getRoleplays error, falling back to default catalog:', err);
    return DEFAULT_ROLEPLAYS_SEED.map(r => ({ ...r, href: `/briefing/${r.id}` }));
  }
}

export async function getRoleplayById(roleplayId) {
  if (!roleplayId) return null;
  try {
    const roleplayRef = doc(db, 'roleplays', roleplayId);
    const snap = await getDoc(roleplayRef);
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...snap.data(),
      startHref: snap.data().startHref || `/chat/sensei?briefing=${snap.id}&type=roleplay`
    };
  } catch (err) {
    console.warn(`Firestore getRoleplayById error for ${roleplayId}, falling back to static briefing:`, err);
    return null;
  }
}

