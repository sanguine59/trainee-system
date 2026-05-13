import { redis } from '@devvit/redis';
import type { ContentDoc, ModActionDoc } from './types';

const contentKey = (id: string) => `content:${id}`;
const MOD_ACTIONS_KEY = 'mod_actions';

export async function upsertContent(id: string, doc: Partial<ContentDoc>): Promise<void> {
  const key = contentKey(id);
  const existing = await redis.get(key);
  const base: Partial<ContentDoc> = existing ? JSON.parse(existing) : {};
  await redis.set(key, JSON.stringify({ ...base, ...doc, updated_at: Date.now() }));
}

export async function addModAction(doc: ModActionDoc): Promise<void> {
  await redis.zAdd(MOD_ACTIONS_KEY, { score: doc.created_at, member: JSON.stringify(doc) });
}
