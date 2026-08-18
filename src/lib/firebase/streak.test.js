import { describe, it, expect } from 'vitest';
import { calculateUpdatedStreak, getStreakStatus } from './firestore';

describe('24-Hour Streak Logic', () => {
  const fakeNow = new Date('2026-08-18T10:00:00');

  describe('calculateUpdatedStreak', () => {
    it('initializes streak to 1 on first practice', () => {
      const result = calculateUpdatedStreak({}, fakeNow);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.lastPracticeDate).toBe('2026-08-18');
      expect(result.isNewDay).toBe(true);
    });

    it('maintains streak on multiple practices within the same day', () => {
      const initial = {
        currentStreak: 3,
        longestStreak: 5,
        lastPracticeDate: '2026-08-18',
      };
      const result = calculateUpdatedStreak(initial, fakeNow);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(5);
      expect(result.isNewDay).toBe(false);
    });

    it('increments streak when practiced on the consecutive next day', () => {
      const initial = {
        currentStreak: 4,
        longestStreak: 4,
        lastPracticeDate: '2026-08-17',
      };
      const result = calculateUpdatedStreak(initial, fakeNow);
      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(5);
      expect(result.lastPracticeDate).toBe('2026-08-18');
      expect(result.isNewDay).toBe(true);
    });

    it('resets streak to 1 when a day is missed (> 24-48h window)', () => {
      const initial = {
        currentStreak: 10,
        longestStreak: 10,
        lastPracticeDate: '2026-08-15',
      };
      const result = calculateUpdatedStreak(initial, fakeNow);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(10);
      expect(result.lastPracticeDate).toBe('2026-08-18');
      expect(result.isNewDay).toBe(true);
    });
  });

  describe('getStreakStatus', () => {
    it('returns broken status when no practice history exists', () => {
      const status = getStreakStatus({}, fakeNow);
      expect(status.currentStreak).toBe(0);
      expect(status.isActiveToday).toBe(false);
      expect(status.isBroken).toBe(true);
    });

    it('returns active status when practiced today', () => {
      const status = getStreakStatus({
        currentStreak: 3,
        longestStreak: 5,
        lastPracticeDate: '2026-08-18',
      }, fakeNow);

      expect(status.currentStreak).toBe(3);
      expect(status.isActiveToday).toBe(true);
      expect(status.isExpiringSoon).toBe(false);
      expect(status.isBroken).toBe(false);
    });

    it('returns expiring soon when practiced yesterday and not yet today', () => {
      const status = getStreakStatus({
        currentStreak: 3,
        longestStreak: 5,
        lastPracticeDate: '2026-08-17',
      }, fakeNow);

      expect(status.currentStreak).toBe(3);
      expect(status.isActiveToday).toBe(false);
      expect(status.isExpiringSoon).toBe(true);
      expect(status.isBroken).toBe(false);
    });

    it('returns broken status when last practice was more than 1 day ago', () => {
      const status = getStreakStatus({
        currentStreak: 5,
        longestStreak: 5,
        lastPracticeDate: '2026-08-16',
      }, fakeNow);

      expect(status.currentStreak).toBe(0);
      expect(status.isActiveToday).toBe(false);
      expect(status.isBroken).toBe(true);
    });
  });
});
