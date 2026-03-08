import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, initDB } from '../lib/db.js';
import { getAuthUser } from '../lib/auth.js';
import { setCors } from '../lib/cors.js';

const MAX_SLOTS = 3;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await initDB();

  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Token manquant' });

  const result = await db.execute({
    sql: 'SELECT slot, champion_name, champion_level, world_id, play_time, updated_at FROM saves WHERE user_id = ? ORDER BY slot',
    args: [auth.userId],
  });

  const slots = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    const row = result.rows.find((r) => r.slot === i);
    slots.push({
      slot: i,
      exists: !!row,
      championName: row?.champion_name ?? null,
      championLevel: row?.champion_level ?? null,
      worldID: row?.world_id ?? null,
      playTime: row?.play_time ?? null,
      updatedAt: row?.updated_at ?? null,
    });
  }

  return res.json({ slots });
}
