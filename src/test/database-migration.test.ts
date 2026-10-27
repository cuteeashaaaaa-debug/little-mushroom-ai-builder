import { afterEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { deleteDB, openDB } from 'idb';
import type { AcademyDB } from '../storage/db';
import { upgradeAcademyDB } from '../storage/db';

const name = 'academy-v2-migration-test';
afterEach(async () => { await deleteDB(name); });

describe('IndexedDB v2 to v3 migration', () => {
  it('adds highlights without removing existing progress, check-ins, preferences, or exercises', async () => {
    const v2 = await openDB<AcademyDB>(name, 2, { upgrade(db) {
      db.createObjectStore('courses', { keyPath: 'id' });
      db.createObjectStore('progress', { keyPath: 'unitId' });
      db.createObjectStore('checkins', { keyPath: 'date' });
      db.createObjectStore('preferences', { keyPath: 'key' });
      db.createObjectStore('exercises', { keyPath: 'unitId' });
    }});
    await v2.put('progress', { unitId: 'U01', learningStatus: 'completed', masteryStatus: 'needs_review', updatedAt: '2026-10-27T00:00:00Z' });
    await v2.put('checkins', { date: '2026-10-27' });
    await v2.put('preferences', { key: 'theme', theme: 'dark' });
    await v2.put('exercises', { unitId: 'U01', quizAnswers: { q1: 1 }, quizScore: 100, quizSubmitted: true, scenarioAnswer: 'saved answer', rubricScores: { clarity: 2 }, updatedAt: '2026-10-27T00:00:00Z' });
    v2.close();

    const v3 = await openDB<AcademyDB>(name, 3, { upgrade(db) { upgradeAcademyDB(db); } });
    expect(await v3.get('progress', 'U01')).toMatchObject({ learningStatus: 'completed', masteryStatus: 'needs_review' });
    expect(await v3.get('checkins', '2026-10-27')).toEqual({ date: '2026-10-27' });
    expect(await v3.get('preferences', 'theme')).toEqual({ key: 'theme', theme: 'dark' });
    expect(await v3.get('exercises', 'U01')).toMatchObject({ scenarioAnswer: 'saved answer', quizScore: 100 });
    expect(v3.objectStoreNames.contains('highlights')).toBe(true);
    expect(v3.transaction('highlights').store.indexNames.contains('by-unit')).toBe(true);
    v3.close();
  });
});
