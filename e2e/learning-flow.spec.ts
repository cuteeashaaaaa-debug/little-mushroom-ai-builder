import { expect, test, type Page } from '@playwright/test';

async function openLesson(page: Page, id: string, title: RegExp) {
  await page.goto(`#/courses/${id}`);
  await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();
}

async function readProgress(page: Page, unitId: string) {
  return page.evaluate((id) => new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
    const request = indexedDB.open('little-mushroom-academy');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const read = db.transaction('progress').objectStore('progress').get(id);
      read.onsuccess = () => { const value = read.result; db.close(); resolve(value); };
      read.onerror = () => { const error = read.error; db.close(); reject(error); };
    };
  }), unitId);
}

test('scenario draft saves, survives reload, and replaces the saved text with the newest edit', async ({ page }) => {
  await openLesson(page, 'U02', /Token 与上下文窗口/);
  const answer = page.getByLabel('你的作答');
  await answer.fill('第一版：保留系统指令和问题，按相关度裁剪历史。');
  await page.getByRole('button', { name: '保存草稿' }).click();
  await expect(page.getByRole('status').filter({ hasText: '草稿已保存到本机' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('你的作答')).toHaveValue('第一版：保留系统指令和问题，按相关度裁剪历史。');
  await page.getByLabel('你的作答').fill('最新版：保留指令、当前问题和引用证据，先裁剪低相关历史。');
  await expect(page.getByRole('status').filter({ hasText: '有未保存的修改' })).toBeVisible();
  await page.getByRole('button', { name: '保存草稿' }).click();
  await expect(page.getByRole('status').filter({ hasText: '草稿已保存到本机' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('你的作答')).toHaveValue('最新版：保留指令、当前问题和引用证据，先裁剪低相关历史。');
});

test('scenario submit reveals the reference and rubric without claiming semantic grading', async ({ page }) => {
  await openLesson(page, 'U02', /Token 与上下文窗口/);
  await expect(page.getByText('输入预算 = 20,000−1,500−700−1,000=16,800', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '参考答案' })).toHaveCount(0);
  await page.getByLabel('你的作答').fill('先核算预算，再保留证据和来源页码。');
  await page.getByRole('button', { name: '提交作答并查看解析' }).click();
  await expect(page.getByRole('status').filter({ hasText: '作答已提交并保存到本机' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '参考答案' })).toBeVisible();
  await expect(page.getByText(/输入预算.*16,800/)).toBeVisible();
  await expect(page.getByText(/自由文本没有被自动判定为通过/)).toBeVisible();
  await expect(page.getByText(/Rubric 自评/)).toBeVisible();
});

test('failed IndexedDB write shows the error and never reports a saved draft', async ({ page }) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'exercises') throw new DOMException('simulated quota failure', 'QuotaExceededError');
      return original.apply(this, args);
    };
  });
  await openLesson(page, 'U02', /Token 与上下文窗口/);
  await page.getByLabel('你的作答').fill('这次写入会失败。');
  await page.getByRole('button', { name: '保存草稿' }).click();
  await expect(page.getByRole('status').filter({ hasText: /保存失败：.*simulated quota failure/ })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: '草稿已保存到本机' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '参考答案' })).toHaveCount(0);
});

test('failed completion write stays on the lesson and does not claim completion', async ({ page }) => {
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'progress') throw new DOMException('simulated progress write failure', 'QuotaExceededError');
      return original.apply(this, args);
    };
  });
  await openLesson(page, 'U02', /Token 与上下文窗口/);
  await page.getByRole('button', { name: '完成本课并学习下一节：U03' }).click();
  await expect(page).toHaveURL(/#\/courses\/U02$/);
  await expect(page.getByRole('status').filter({ hasText: /课程尚未标记完成/ })).toBeVisible();
  await expect(page.getByText('本课状态：已完成')).toHaveCount(0);
  expect(await readProgress(page, 'U02')).toBeUndefined();
});

test('next lesson navigation does not complete the current lesson; completion waits for persistence', async ({ page }) => {
  await openLesson(page, 'U02', /Token 与上下文窗口/);
  await page.getByRole('link', { name: /学习下一节：U03/ }).click();
  await expect(page).toHaveURL(/#\/courses\/U03$/);
  await expect(page.getByRole('heading', { name: 'Prompt 设计与版本对比' }).first()).toBeVisible();
  expect(await readProgress(page, 'U02')).toBeUndefined();

  await openLesson(page, 'U02', /Token 与上下文窗口/);
  await page.getByRole('button', { name: '完成本课并学习下一节：U03' }).click();
  await expect(page).toHaveURL(/#\/courses\/U03$/);
  await expect(page.getByRole('heading', { name: 'Prompt 设计与版本对比' }).first()).toBeVisible();
  expect(await readProgress(page, 'U02')).toMatchObject({ learningStatus: 'completed' });
  expect(await readProgress(page, 'U03')).toBeUndefined();
  expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0);
});

test('completed lessons do not show a control that can regress them to in progress', async ({ page }) => {
  await openLesson(page, 'U02', /Token 与上下文窗口/);
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('little-mushroom-academy');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('progress', 'readwrite');
      tx.objectStore('progress').put({ unitId: 'U02', learningStatus: 'completed', masteryStatus: 'needs_review', updatedAt: new Date().toISOString() });
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { const error = tx.error; db.close(); reject(error); };
    };
  }));
  await page.reload();
  await expect(page.getByText('本课状态：已完成')).toBeVisible();
  await expect(page.getByRole('button', { name: /开始 \/ 继续学习/ })).toHaveCount(0);
  expect(await readProgress(page, 'U02')).toMatchObject({ learningStatus: 'completed', masteryStatus: 'needs_review' });
});

test('cross-module next lesson works and an unpublished next unit is never linked', async ({ page }) => {
  await openLesson(page, 'U07', /Function Calling 与模型选型/);
  await page.getByRole('link', { name: /学习下一节：U08/ }).click();
  await expect(page).toHaveURL(/#\/courses\/U08$/);
  await expect(page.getByRole('heading', { name: 'RAG 原理与完整链路' }).first()).toBeVisible();
  await page.getByRole('link', { name: /学习下一节：U09/ }).count().then(count => expect(count).toBe(0));
  await expect(page.getByText('U09 尚未发布')).toBeVisible();
  await expect(page.getByRole('link', { name: /U09/ })).toHaveCount(0);
});

test('the final U01 micro-lesson still offers the next published unit', async ({ page }) => {
  await openLesson(page, 'U01', /LLM 基础与 AI 应用架构/);
  await page.getByRole('button', { name: /从模型局限到企业 AI 产品/ }).click();
  await expect(page.getByRole('heading', { name: '从模型局限到企业 AI 产品' })).toBeVisible();
  await expect(page.getByRole('link', { name: /学习下一节：U02/ })).toBeVisible();
});

test('saving a new draft preserves pre-existing progress, check-ins, highlights, preferences, and micro-progress', async ({ page }) => {
  await openLesson(page, 'U02', /Token 与上下文窗口/);
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('little-mushroom-academy');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(['progress', 'checkins', 'exercises', 'highlights', 'preferences', 'microProgress'], 'readwrite');
      tx.objectStore('progress').put({ unitId: 'U02', learningStatus: 'in_progress', masteryStatus: 'needs_review', updatedAt: '2026-10-28T00:00:00.000Z' });
      tx.objectStore('checkins').put({ date: '2026-10-27' });
      tx.objectStore('exercises').put({ unitId: 'U02', quizAnswers: { q1: 1 }, quizScore: 66, quizSubmitted: true, scenarioAnswer: '以前保存的答案', rubricScores: { budget: 1 }, updatedAt: '2026-10-27T00:00:00.000Z' });
      tx.objectStore('highlights').put({ id: 'keep-highlight', unitId: 'U02', passageId: 'U02:section:0:paragraph:0', quote: '窗口', passageText: '窗口', startOffset: 0, endOffset: 2, createdAt: '2026-10-27T00:00:00.000Z' });
      tx.objectStore('preferences').put({ key: 'theme', theme: 'dark' });
      tx.objectStore('microProgress').put({ id: 'U01:keep-micro', unitId: 'U01', microLessonId: 'token-vectors', status: 'completed', lastVisitedAt: '2026-10-27T00:00:00.000Z', updatedAt: '2026-10-27T00:00:00.000Z' });
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { const error = tx.error; db.close(); reject(error); };
    };
  }));
  await page.reload();
  await expect(page.getByLabel('你的作答')).toHaveValue('以前保存的答案');
  await page.getByLabel('你的作答').fill('更新后的答案');
  await page.getByRole('button', { name: '保存草稿' }).click();
  await expect(page.getByRole('status').filter({ hasText: '草稿已保存到本机' })).toBeVisible();
  const preserved = await page.evaluate(() => new Promise<Record<string, unknown>>((resolve, reject) => {
    const request = indexedDB.open('little-mushroom-academy');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(['progress', 'checkins', 'exercises', 'highlights', 'preferences', 'microProgress']);
      const keys = ['progress', 'checkins', 'exercises', 'highlights', 'preferences', 'microProgress'];
      const result: Record<string, unknown> = {};
      let remaining = keys.length;
      for (const key of keys) {
        const store = tx.objectStore(key);
        const read = key === 'progress' ? store.get('U02') : key === 'checkins' ? store.get('2026-10-27') : key === 'exercises' ? store.get('U02') : key === 'highlights' ? store.get('keep-highlight') : key === 'preferences' ? store.get('theme') : store.get('U01:keep-micro');
        read.onsuccess = () => { result[key] = read.result; if (--remaining === 0) { db.close(); resolve(result); } };
        read.onerror = () => { const error = read.error; db.close(); reject(error); };
      }
    };
  }));
  expect(preserved.progress).toMatchObject({ learningStatus: 'in_progress', masteryStatus: 'needs_review' });
  expect(preserved.checkins).toEqual({ date: '2026-10-27' });
  expect(preserved.exercises).toMatchObject({ quizAnswers: { q1: 1 }, scenarioAnswer: '更新后的答案' });
  expect(preserved.highlights).toMatchObject({ id: 'keep-highlight', quote: '窗口' });
  expect(preserved.preferences).toEqual({ key: 'theme', theme: 'dark' });
  expect(preserved.microProgress).toMatchObject({ status: 'completed' });
});

test('scenario and navigation controls remain usable without horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLesson(page, 'U02', /Token 与上下文窗口/);
  const buttons = [page.getByRole('button', { name: '保存草稿' }), page.getByRole('button', { name: '提交作答并查看解析' }), page.getByRole('link', { name: /学习下一节：U03/ })];
  for (const button of buttons) await expect(button).toBeVisible();
  const layout = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
});
