/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hashString,
  createPRNG,
  getTodayDateKey,
  get24HourCycleRemaining,
  generateRandomQuestsForUser,
  generateRandomTasksForUser,
  loadUserDailyState,
  saveUserDailyState,
  resolveIcon,
} from './dailyQuests.js';

describe('dailyQuests service', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage?.clear) {
      window.localStorage.clear();
    }
    vi.restoreAllMocks();
  });

  describe('PRNG and Hashing', () => {
    it('produces consistent hash for the same string', () => {
      const hash1 = hashString('user123_2026-08-22');
      const hash2 = hashString('user123_2026-08-22');
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('number');
    });

    it('produces different hashes for different users', () => {
      const hash1 = hashString('user_alice_2026-08-22');
      const hash2 = hashString('user_bob_2026-08-22');
      expect(hash1).not.toBe(hash2);
    });

    it('creates deterministic pseudo-random sequences with createPRNG', () => {
      const rng1 = createPRNG(12345);
      const rng2 = createPRNG(12345);
      const values1 = [rng1(), rng1(), rng1()];
      const values2 = [rng2(), rng2(), rng2()];
      expect(values1).toEqual(values2);
    });
  });

  describe('Randomized Quests Generation Per User', () => {
    it('generates distinct sets of daily quests for different users on the same day', () => {
      const dateKey = '2026-08-22';
      const questsUserA = generateRandomQuestsForUser('user_alice', dateKey, 3);
      const questsUserB = generateRandomQuestsForUser('user_bob', dateKey, 3);

      expect(questsUserA).toHaveLength(3);
      expect(questsUserB).toHaveLength(3);

      const idsA = questsUserA.map((q) => q.id);
      const idsB = questsUserB.map((q) => q.id);

      // Verify that user A and user B do not receive the identical ordered list
      expect(idsA).not.toEqual(idsB);
    });

    it('generates reproducible quests for the same user on the same dateKey', () => {
      const quests1 = generateRandomQuestsForUser('user_ram', '2026-08-22', 3);
      const quests2 = generateRandomQuestsForUser('user_ram', '2026-08-22', 3);

      expect(quests1.map((q) => q.id)).toEqual(quests2.map((q) => q.id));
    });

    it('generates different quests for the same user on different days', () => {
      const day1Quests = generateRandomQuestsForUser('user_ram', '2026-08-22', 3);
      const day2Quests = generateRandomQuestsForUser('user_ram', '2026-08-23', 3);

      const ids1 = day1Quests.map((q) => q.id);
      const ids2 = day2Quests.map((q) => q.id);
      expect(ids1).not.toEqual(ids2);
    });

    it('initializes quests with current = 0 and claimed = false and valid icons', () => {
      const quests = generateRandomQuestsForUser('test_user', '2026-08-22', 3);
      quests.forEach((q) => {
        expect(q.current).toBe(0);
        expect(q.claimed).toBe(false);
        expect(typeof q.target).toBe('number');
        expect(typeof q.rewardXp).toBe('number');
        expect(q.icon).toBeDefined();
      });
    });

    it('generates randomized tasks for tasks mode', () => {
      const tasksA = generateRandomTasksForUser('user_alice', '2026-08-22', 4);
      const tasksB = generateRandomTasksForUser('user_bob', '2026-08-22', 4);

      expect(tasksA).toHaveLength(4);
      expect(tasksB).toHaveLength(4);
      tasksA.forEach((t) => {
        expect(t.done).toBe(false);
        expect(t.icon).toBeDefined();
      });
      expect(tasksA.map((t) => t.id)).not.toEqual(tasksB.map((t) => t.id));
    });
  });

  describe('24-Hour Cycle and Countdown Timer', () => {
    it('returns formatted date string YYYY-MM-DD', () => {
      const date = new Date(2026, 7, 22); // Month is 0-indexed, so 7 = August
      expect(getTodayDateKey(date)).toBe('2026-08-22');
    });

    it('calculates 24-hour cycle remaining time to midnight accurately', () => {
      // 14:30:00 -> 9 hours and 30 minutes until midnight
      const fakeTime = new Date(2026, 7, 22, 14, 30, 0);
      const remaining = get24HourCycleRemaining(fakeTime);

      expect(remaining.hours).toBe(9);
      expect(remaining.minutes).toBe(30);
      expect(remaining.seconds).toBe(0);
      expect(remaining.formatted).toBe('9h 30m 00s');
      expect(remaining.formattedDigital).toBe('09:30:00');
    });
  });

  describe('Storage and State Persistence', () => {
    it('persists and reloads daily quest state in localStorage for a user', () => {
      const userId = 'user_123';
      const dateKey = '2026-08-22';

      const state1 = loadUserDailyState(userId, dateKey);
      expect(state1.quests).toHaveLength(3);

      // Modify state (simulate user doing progress)
      state1.quests[0].current = 5;
      saveUserDailyState(userId, state1);

      // Reload
      const state2 = loadUserDailyState(userId, dateKey);
      expect(state2.quests[0].current).toBe(5);
      expect(state2.quests[0].id).toBe(state1.quests[0].id);
    });

    it('resets and generates a fresh set when the date key advances to a new 24h cycle', () => {
      const userId = 'user_123';
      const day1Key = '2026-08-22';
      const day2Key = '2026-08-23';

      const day1State = loadUserDailyState(userId, day1Key);
      day1State.quests[0].current = 10;
      saveUserDailyState(userId, day1State);

      // Next day
      const day2State = loadUserDailyState(userId, day2Key);
      expect(day2State.dateKey).toBe(day2Key);
      // New quests are reset
      expect(day2State.quests[0].current).toBe(0);
    });
  });

  describe('resolveIcon helper', () => {
    it('returns Zap icon as fallback for unknown icon names', () => {
      const icon = resolveIcon('UnknownNonExistentIcon');
      expect(icon).toBeDefined();
    });
  });
});
