/**
 * Share History Database Tests
 *
 * Tests for addShareHistory, getShareHistory, and getShareCount functions.
 * Uses a mock of expo-sqlite that simulates an in-memory store to verify
 * SQL query logic, parameter passing, and return value shaping.
 *
 * Constitution Principle V: Every database function in src/db/ MUST have
 * corresponding automated tests.
 */

// In-memory store to simulate SQLite
let store: Array<{
  id: number;
  day_filter: string | null;
  show_count: number;
  shared_at: string;
}> = [];
let nextId = 1;

const mockDatabase = {
  execAsync: jest.fn(),
  runAsync: jest.fn(async (sql: string, params: unknown[]) => {
    if (sql.includes('INSERT INTO share_history')) {
      store.push({
        id: nextId++,
        day_filter: params[0] as string | null,
        show_count: params[1] as number,
        shared_at: new Date().toISOString(),
      });
    }
  }),
  getAllAsync: jest.fn(async <T>(_sql: string): Promise<T[]> => {
    const sorted = [...store].sort(
      (a, b) => new Date(b.shared_at).getTime() - new Date(a.shared_at).getTime()
    );
    return sorted.map((row) => ({
      id: row.id,
      dayFilter: row.day_filter,
      showCount: row.show_count,
      sharedAt: row.shared_at,
    })) as unknown as T[];
  }),
  getFirstAsync: jest.fn(async <T>(_sql: string): Promise<T | null> => {
    return { count: store.length } as unknown as T;
  }),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => mockDatabase),
}));

import { addShareHistory, getShareHistory, getShareCount } from '../queries';

beforeEach(() => {
  store = [];
  nextId = 1;
  jest.clearAllMocks();
});

describe('addShareHistory', () => {
  it('inserts a share event with null dayFilter (all days)', async () => {
    await addShareHistory(null, 5);
    expect(store).toHaveLength(1);
    expect(store[0].day_filter).toBeNull();
    expect(store[0].show_count).toBe(5);
  });

  it('inserts a share event with a specific dayFilter', async () => {
    await addShareHistory('2026-07-08', 3);
    expect(store).toHaveLength(1);
    expect(store[0].day_filter).toBe('2026-07-08');
    expect(store[0].show_count).toBe(3);
  });

  it('inserts multiple share events', async () => {
    await addShareHistory(null, 10);
    await addShareHistory('2026-07-09', 4);
    await addShareHistory(null, 12);
    expect(store).toHaveLength(3);
  });
});

describe('getShareHistory', () => {
  it('returns empty array when no shares exist', async () => {
    const result = await getShareHistory();
    expect(result).toEqual([]);
  });

  it('returns share events ordered by most recent first', async () => {
    await addShareHistory(null, 5);
    await addShareHistory('2026-07-10', 2);
    const result = await getShareHistory();
    expect(result).toHaveLength(2);
    expect(result[0].showCount).toBeDefined();
    expect(result[1].showCount).toBeDefined();
  });

  it('maps SQL columns to TypeScript interface fields', async () => {
    await addShareHistory('2026-07-08', 7);
    const result = await getShareHistory();
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('dayFilter');
    expect(result[0]).toHaveProperty('showCount');
    expect(result[0]).toHaveProperty('sharedAt');
  });
});

describe('getShareCount', () => {
  it('returns 0 when no shares exist', async () => {
    const count = await getShareCount();
    expect(count).toBe(0);
  });

  it('returns correct total after multiple shares', async () => {
    await addShareHistory(null, 5);
    await addShareHistory('2026-07-08', 3);
    await addShareHistory(null, 8);
    const count = await getShareCount();
    expect(count).toBe(3);
  });
});
