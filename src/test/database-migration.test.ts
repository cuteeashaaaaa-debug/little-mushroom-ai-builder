import { afterEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { deleteDB, openDB } from 'idb';
import type { AcademyDB } from '../storage/db';
import { upgradeAcademyDB } from '../storage/db';

const name = 'academy-v2-migration-test';
afterEach(async () => { await deleteDB(name); });

describe('IndexedDB v3 to v4 migration', () => {
  it('adds micro-lesson progress without removing learning data or existing highlights', async () => {
    const v3 = await openDB<AcademyDB>(name, 3, { upgrade(db) {
      db.createObjectStore('courses', { keyPath: 'id' });
      db.createObjectStore('progress', { keyPath: 'unitId' });
      db.createObjectStore('checkins', { keyPath: 'date' });
      db.createObjectStore('preferences', { keyPath: 'key' });
      db.createObjectStore('exercises', { keyPath: 'unitId' });
      const highlights = db.createObjectStore('highlights', { keyPath: 'id' });
      highlights.createIndex('by-unit', 'unitId');
    }});
    await v3.put('progress', { unitId: 'U01', learningStatus: 'completed', masteryStatus: 'needs_review', updatedAt: '2026-10-27T00:00:00Z' });
    await v3.put('checkins', { date: '2026-10-27' });
    await v3.put('preferences', { key: 'theme', theme: 'dark' });
    await v3.put('exercises', { unitId: 'U01', quizAnswers: { q1: 1 }, quizScore: 100, quizSubmitted: true, scenarioAnswer: 'saved answer', rubricScores: { clarity: 2 }, updatedAt: '2026-10-27T00:00:00Z' });
    await v3.put('highlights', { id:'old-highlight',unitId:'U01',passageId:'U01:section:0:paragraph:0',quote:'LLM',passageText:'old U01 passage',startOffset:0,endOffset:3,createdAt:'2026-10-27T00:00:00Z' });
    v3.close();

    const beforeUpgrade = await openDB<AcademyDB>(name, 3);
    expect(beforeUpgrade.objectStoreNames.contains('microProgress')).toBe(false);
    beforeUpgrade.close();
    const v4 = await openDB<AcademyDB>(name, 4, { upgrade(db) { upgradeAcademyDB(db); } });
    expect(await v4.get('progress', 'U01')).toMatchObject({ learningStatus:'completed',masteryStatus:'needs_review' });
    expect(await v4.get('checkins', '2026-10-27')).toEqual({ date:'2026-10-27' });
    expect(await v4.get('preferences', 'theme')).toEqual({ key:'theme',theme:'dark' });
    expect(await v4.get('exercises', 'U01')).toMatchObject({ scenarioAnswer:'saved answer',quizScore:100 });
    expect(await v4.get('highlights', 'old-highlight')).toMatchObject({ passageText:'old U01 passage',quote:'LLM' });
    expect(v4.objectStoreNames.contains('microProgress')).toBe(true);
    expect(v4.transaction('microProgress').store.indexNames.contains('by-unit')).toBe(true);
    expect(await v4.getAll('microProgress')).toEqual([]);
    v4.close();
  });
});
