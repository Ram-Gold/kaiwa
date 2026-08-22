import { QUEST_POOL, TASK_POOL } from '../data/dailyQuestsDataset.js';
import {
  Zap,
  Target,
  Clock,
  BookOpen,
  MessageSquare,
  Layers,
  Award,
  Sparkles,
  Flame,
  CircleDot,
} from 'lucide-react';

export const ICON_MAP = {
  Zap,
  Target,
  Clock,
  BookOpen,
  MessageSquare,
  Layers,
  Award,
  Sparkles,
  Flame,
  CircleDot,
};

/**
 * Maps an icon name string to a Lucide icon component.
 */
export function resolveIcon(iconName, fallback = Zap) {
  if (!iconName) return fallback;
  if (typeof iconName === 'function' || typeof iconName === 'object') return iconName;
  return ICON_MAP[iconName] || fallback;
}

/**
 * Simple, robust hash function producing a 32-bit integer seed from a string.
 */
export function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash >>> 0;
}

/**
 * Mulberry32 PRNG: seeded pseudo-random number generator in [0, 1).
 */
export function createPRNG(seed) {
  let s = seed >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns the current date key string 'YYYY-MM-DD' for the local timezone.
 */
export function getTodayDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates time remaining until the next 24-hour cycle reset (midnight).
 */
export function get24HourCycleRemaining(now = new Date()) {
  const nextReset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const totalMs = Math.max(0, nextReset.getTime() - now.getTime());
  
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  const formattedDigital = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    totalMs,
    totalSeconds,
    hours,
    minutes,
    seconds,
    formatted,
    formattedDigital,
    nextResetTime: nextReset.getTime(),
  };
}

/**
 * Deterministically shuffles an array given a PRNG function.
 */
export function seededShuffle(array, rng) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generates a randomized list of Daily Quests for a given user & date key.
 */
export function generateRandomQuestsForUser(userId = 'guest', dateKey = getTodayDateKey(), count = 3) {
  const seed = hashString(`${userId}_quests_${dateKey}`);
  const rng = createPRNG(seed);
  const shuffled = seededShuffle(QUEST_POOL, rng);
  const selected = shuffled.slice(0, count);

  return selected.map((q) => ({
    ...q,
    current: 0,
    claimed: false,
    icon: resolveIcon(q.iconName),
  }));
}

/**
 * Generates a randomized list of Daily Tasks for a given user & date key.
 */
export function generateRandomTasksForUser(userId = 'guest', dateKey = getTodayDateKey(), count = 4) {
  const seed = hashString(`${userId}_tasks_${dateKey}`);
  const rng = createPRNG(seed);
  const shuffled = seededShuffle(TASK_POOL, rng);
  const selected = shuffled.slice(0, count);

  return selected.map((t) => ({
    ...t,
    done: false,
    icon: resolveIcon(t.iconName),
  }));
}

const STORAGE_PREFIX = 'kaiwa_daily_quest_state_';

// In-memory fallback if localStorage is disabled, restricted, or in testing
const memoryStore = new Map();

function safeGetStorage(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Fallback to memory
  }
  return memoryStore.get(key) ?? null;
}

function safeSetStorage(key, value) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {
    // Fallback to memory
  }
  memoryStore.set(key, value);
}

/**
 * Loads the user's quest state from storage, or generates a fresh randomized batch for today.
 */
export function loadUserDailyState(userId = 'guest', dateKey = getTodayDateKey()) {
  const normalizedUser = userId || 'guest';
  const storageKey = `${STORAGE_PREFIX}${normalizedUser}`;

  try {
    const storedJson = safeGetStorage(storageKey);
    if (storedJson) {
      const parsed = JSON.parse(storedJson);
      if (parsed && parsed.dateKey === dateKey && Array.isArray(parsed.quests) && Array.isArray(parsed.tasks)) {
        // Hydrate icon functions
        const hydratedQuests = parsed.quests.map((q) => ({
          ...q,
          icon: resolveIcon(q.iconName || q.icon),
        }));
        const hydratedTasks = parsed.tasks.map((t) => ({
          ...t,
          icon: resolveIcon(t.iconName || t.icon),
        }));
        return {
          dateKey: parsed.dateKey,
          quests: hydratedQuests,
          tasks: hydratedTasks,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored daily quests from storage:', err);
  }

  // Generate fresh randomized set for this user & day
  const freshQuests = generateRandomQuestsForUser(normalizedUser, dateKey);
  const freshTasks = generateRandomTasksForUser(normalizedUser, dateKey);

  const freshState = {
    dateKey,
    quests: freshQuests,
    tasks: freshTasks,
  };

  saveUserDailyState(normalizedUser, freshState);
  return freshState;
}

/**
 * Persists the user's daily quests & tasks state into storage.
 */
export function saveUserDailyState(userId = 'guest', state) {
  const normalizedUser = userId || 'guest';
  const storageKey = `${STORAGE_PREFIX}${normalizedUser}`;

  if (state) {
    try {
      // Serialize clean data (omit cyclic icon functions)
      const toSave = {
        dateKey: state.dateKey,
        quests: (state.quests || []).map(({ icon, ...rest }) => rest),
        tasks: (state.tasks || []).map(({ icon, ...rest }) => rest),
      };
      safeSetStorage(storageKey, JSON.stringify(toSave));
    } catch (err) {
      console.warn('Failed to save daily quests to storage:', err);
    }
  }
}
