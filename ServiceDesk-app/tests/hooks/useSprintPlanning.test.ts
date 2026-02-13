import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSprintPlanning, CapacitySettings } from '@/hooks/useSprintPlanning';
import api from '@/lib/axios';

vi.mock('@/lib/axios');

describe('useSprintPlanning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateTeamCapacity', () => {
    it('should calculate total capacity correctly with no days off', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const settings: CapacitySettings = {
        sprintDays: 10,
        defaultHoursPerDay: 6,
        meetings: 10,
        teamMembers: [
          {
            userId: 'user1',
            name: 'Alice',
            email: 'alice@example.com',
            availability: 6,
            daysOff: [],
          },
          {
            userId: 'user2',
            name: 'Bob',
            email: 'bob@example.com',
            availability: 6,
            daysOff: [],
          },
        ],
      };

      const capacity = result.current.calculateTeamCapacity(settings);

      // (10 days × 6 hours × 2 members) - 10 meeting hours = 110 hours
      expect(capacity).toBe(110);
    });

    it('should account for days off', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const settings: CapacitySettings = {
        sprintDays: 10,
        defaultHoursPerDay: 8,
        meetings: 10,
        teamMembers: [
          {
            userId: 'user1',
            name: 'Alice',
            email: 'alice@example.com',
            availability: 8,
            daysOff: ['2025-12-25', '2025-12-26'], // 2 days off
          },
        ],
      };

      const capacity = result.current.calculateTeamCapacity(settings);

      // (10 - 2 days) × 8 hours - 10 meeting hours = 54 hours
      expect(capacity).toBe(54);
    });

    it('should handle different availability per member', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const settings: CapacitySettings = {
        sprintDays: 10,
        defaultHoursPerDay: 6,
        meetings: 5,
        teamMembers: [
          {
            userId: 'user1',
            name: 'Alice',
            email: 'alice@example.com',
            availability: 8, // Full-time
            daysOff: [],
          },
          {
            userId: 'user2',
            name: 'Bob',
            email: 'bob@example.com',
            availability: 4, // Part-time
            daysOff: [],
          },
        ],
      };

      const capacity = result.current.calculateTeamCapacity(settings);

      // (10 × 8) + (10 × 4) - 5 = 115 hours
      expect(capacity).toBe(115);
    });

    it('should not return negative capacity', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const settings: CapacitySettings = {
        sprintDays: 10,
        defaultHoursPerDay: 6,
        meetings: 200, // Excessive meetings
        teamMembers: [
          {
            userId: 'user1',
            name: 'Alice',
            email: 'alice@example.com',
            availability: 6,
            daysOff: [],
          },
        ],
      };

      const capacity = result.current.calculateTeamCapacity(settings);

      expect(capacity).toBe(0);
    });
  });

  describe('calculateAvailabilityPercentage', () => {
    it('should calculate 100% availability with no constraints', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const settings: CapacitySettings = {
        sprintDays: 10,
        defaultHoursPerDay: 6,
        meetings: 0,
        teamMembers: [
          {
            userId: 'user1',
            name: 'Alice',
            email: 'alice@example.com',
            availability: 6,
            daysOff: [],
          },
        ],
      };

      const percentage = result.current.calculateAvailabilityPercentage(settings);

      expect(percentage).toBe(100);
    });

    it('should calculate reduced availability with days off and meetings', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const settings: CapacitySettings = {
        sprintDays: 10,
        defaultHoursPerDay: 8,
        meetings: 10,
        teamMembers: [
          {
            userId: 'user1',
            name: 'Alice',
            email: 'alice@example.com',
            availability: 8,
            daysOff: ['2025-12-25'], // 1 day off
          },
        ],
      };

      const percentage = result.current.calculateAvailabilityPercentage(settings);

      // Ideal: 1 member × 10 days × 8 hours = 80 hours
      // Actual: (10 - 1) × 8 - 10 = 62 hours
      // Percentage: 62 / 80 = 77.5% → 78%
      expect(percentage).toBe(78);
    });

    it('should handle multiple team members', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const settings: CapacitySettings = {
        sprintDays: 10,
        defaultHoursPerDay: 6,
        meetings: 10,
        teamMembers: [
          {
            userId: 'user1',
            name: 'Alice',
            email: 'alice@example.com',
            availability: 6,
            daysOff: [],
          },
          {
            userId: 'user2',
            name: 'Bob',
            email: 'bob@example.com',
            availability: 6,
            daysOff: ['2025-12-25', '2025-12-26'],
          },
        ],
      };

      const percentage = result.current.calculateAvailabilityPercentage(settings);

      // Ideal: 2 × 10 × 6 = 120 hours
      // Actual: (10 × 6) + ((10 - 2) × 6) - 10 = 98 hours
      // Percentage: 98 / 120 = 81.67% → 82%
      expect(percentage).toBe(82);
    });

    it('should return 100% when no team members (edge case)', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const settings: CapacitySettings = {
        sprintDays: 10,
        defaultHoursPerDay: 6,
        meetings: 0,
        teamMembers: [],
      };

      const percentage = result.current.calculateAvailabilityPercentage(settings);

      expect(percentage).toBe(100);
    });
  });

  describe('calculateCapacityFromVelocity', () => {
    it('should calculate capacity from historical velocity and availability', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const capacity = result.current.calculateCapacityFromVelocity(50, 80);

      // 50 points × 80% = 40 points
      expect(capacity).toBe(40);
    });

    it('should handle 100% availability', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const capacity = result.current.calculateCapacityFromVelocity(45, 100);

      expect(capacity).toBe(45);
    });

    it('should handle low availability', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const capacity = result.current.calculateCapacityFromVelocity(60, 50);

      // 60 points × 50% = 30 points
      expect(capacity).toBe(30);
    });

    it('should round to nearest integer', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const capacity = result.current.calculateCapacityFromVelocity(47, 85);

      // 47 × 0.85 = 39.95 → 40
      expect(capacity).toBe(40);
    });

    it('should handle zero velocity', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const capacity = result.current.calculateCapacityFromVelocity(0, 80);

      expect(capacity).toBe(0);
    });
  });

  describe('Integration: Real-world scenarios', () => {
    it('Scenario 1: Standard 2-week sprint with full team', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const settings: CapacitySettings = {
        sprintDays: 10,
        defaultHoursPerDay: 6,
        meetings: 10,
        teamMembers: [
          { userId: '1', name: 'Dev 1', email: 'dev1@test.com', availability: 6, daysOff: [] },
          { userId: '2', name: 'Dev 2', email: 'dev2@test.com', availability: 6, daysOff: [] },
          { userId: '3', name: 'Dev 3', email: 'dev3@test.com', availability: 6, daysOff: [] },
          { userId: '4', name: 'Dev 4', email: 'dev4@test.com', availability: 6, daysOff: [] },
          { userId: '5', name: 'Dev 5', email: 'dev5@test.com', availability: 6, daysOff: [] },
        ],
      };

      const hours = result.current.calculateTeamCapacity(settings);
      const availability = result.current.calculateAvailabilityPercentage(settings);
      const historicalVelocity = 50;
      const capacity = result.current.calculateCapacityFromVelocity(historicalVelocity, availability);

      // 5 members × 10 days × 6 hours - 10 meetings = 290 hours
      expect(hours).toBe(290);
      // 290 / 300 = 96.67% → 97%
      expect(availability).toBe(97);
      // 50 × 0.97 = 48.5 → 48 or 49 points
      expect(capacity).toBeGreaterThanOrEqual(48);
      expect(capacity).toBeLessThanOrEqual(49);
    });

    it('Scenario 2: Sprint with vacation and reduced team', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const settings: CapacitySettings = {
        sprintDays: 10,
        defaultHoursPerDay: 8,
        meetings: 12,
        teamMembers: [
          { userId: '1', name: 'Dev 1', email: 'dev1@test.com', availability: 8, daysOff: [] },
          { userId: '2', name: 'Dev 2', email: 'dev2@test.com', availability: 8, daysOff: ['2025-12-25', '2025-12-26'] },
          { userId: '3', name: 'Dev 3', email: 'dev3@test.com', availability: 4, daysOff: [] }, // Part-time
        ],
      };

      const hours = result.current.calculateTeamCapacity(settings);
      const availability = result.current.calculateAvailabilityPercentage(settings);
      const historicalVelocity = 45;
      const capacity = result.current.calculateCapacityFromVelocity(historicalVelocity, availability);

      // (10 × 8) + ((10-2) × 8) + (10 × 4) - 12 = 172 hours
      expect(hours).toBe(172);
      // Ideal: 3 × 10 × 8 = 240, Actual: 172, Percentage: 71.67% → 72%
      expect(availability).toBe(72);
      // 45 × 0.72 = 32.4 → 32 points
      expect(capacity).toBe(32);
    });

    it('Scenario 3: New team with conservative estimate', () => {
      const { result } = renderHook(() => useSprintPlanning('project123'));

      const settings: CapacitySettings = {
        sprintDays: 10,
        defaultHoursPerDay: 6,
        meetings: 15,
        teamMembers: [
          { userId: '1', name: 'Dev 1', email: 'dev1@test.com', availability: 6, daysOff: [] },
          { userId: '2', name: 'Dev 2', email: 'dev2@test.com', availability: 6, daysOff: [] },
          { userId: '3', name: 'Dev 3', email: 'dev3@test.com', availability: 6, daysOff: [] },
        ],
      };

      const hours = result.current.calculateTeamCapacity(settings);
      const availability = result.current.calculateAvailabilityPercentage(settings);
      
      // For new team, use conservative velocity (e.g., 30 points)
      const conservativeVelocity = 30;
      const capacity = result.current.calculateCapacityFromVelocity(conservativeVelocity, availability);

      // 3 × 10 × 6 - 15 = 165 hours
      expect(hours).toBe(165);
      // 165 / 180 = 91.67% → 92%
      expect(availability).toBe(92);
      // 30 × 0.92 = 27.6 → 28 points
      expect(capacity).toBe(28);
    });
  });
});
