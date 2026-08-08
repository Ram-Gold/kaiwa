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

/* ==========================================================================
   3. HISTORY & GAMIFICATION
   ========================================================================== */

/**
 * Record completed practice session and update user practice count & XP
 */
export async function logPracticeSession(uid, sessionData) {
  if (!uid) return;
  const historyRef = collection(db, 'users', uid, 'history');
  const docRef = await addDoc(historyRef, {
    ...sessionData,
    timestamp: serverTimestamp(),
  });

  // Increment totalPractices & XP if provided
  const xpEarned = sessionData.score ? Math.round(sessionData.score / 2) : 10;
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    stats: {
      totalPractices: increment(1),
      xp: increment(xpEarned),
    },
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return docRef.id;
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
  const docs = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { docs, lastDoc };
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
 * If empty, seeds the default lessons to Firestore and returns them.
 */
export async function getLessons() {
  const lessonsRef = collection(db, 'lessons');
  let snap = await getDocs(lessonsRef);
  
  if (snap.empty) {
    await seedLessonsToFirestore();
    snap = await getDocs(lessonsRef);
  }
  
  const lessonsList = [];
  snap.forEach((docSnap) => {
    lessonsList.push({
      id: docSnap.id,
      ...docSnap.data(),
      href: `/briefing/${docSnap.id}`
    });
  });
  
  return lessonsList;
}

/**
 * Fetch a single lesson from Firestore by ID.
 */
export async function getLessonById(lessonId) {
  if (!lessonId) return null;
  const lessonRef = doc(db, 'lessons', lessonId);
  const snap = await getDoc(lessonRef);
  if (!snap.exists()) return null;
  return {
    id: snap.id,
    ...snap.data(),
    startHref: `/chat/sensei?briefing=${snap.id}&type=lesson`
  };
}


