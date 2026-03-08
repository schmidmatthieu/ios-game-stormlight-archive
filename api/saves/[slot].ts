import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, initDB } from '../lib/db.js';
import { getAuthUser } from '../lib/auth.js';
import { setCors } from '../lib/cors.js';

const MAX_SLOTS = 3;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;

  await initDB();

  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Token manquant' });

  const slot = parseInt(req.query.slot as string, 10);
  if (isNaN(slot) || slot < 0 || slot >= MAX_SLOTS) {
    return res.status(400).json({ error: 'Slot invalide (0-2)' });
  }

  // GET — load save
  if (req.method === 'GET') {
    const result = await db.execute({
      sql: 'SELECT save_data, updated_at FROM saves WHERE user_id = ? AND slot = ?',
      args: [auth.userId, slot],
    });

    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Aucune sauvegarde dans ce slot' });

    return res.json({ slot, data: JSON.parse(row.save_data as string), updatedAt: row.updated_at });
  }

  // PUT — save/overwrite
  if (req.method === 'PUT') {
    const { data, championName, championLevel, worldID, playTime } = req.body ?? {};

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Données de sauvegarde manquantes' });
    }

    const saveData = JSON.stringify(data);

    await db.execute({
      sql: `INSERT INTO saves (user_id, slot, save_data, champion_name, champion_level, world_id, play_time, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(user_id, slot) DO UPDATE SET
              save_data = excluded.save_data,
              champion_name = excluded.champion_name,
              champion_level = excluded.champion_level,
              world_id = excluded.world_id,
              play_time = excluded.play_time,
              updated_at = datetime('now')`,
      args: [auth.userId, slot, saveData, championName ?? null, championLevel ?? null, worldID ?? null, playTime ?? 0],
    });

    return res.json({ ok: true, slot });
  }

  // DELETE — delete save
  if (req.method === 'DELETE') {
    await db.execute({
      sql: 'DELETE FROM saves WHERE user_id = ? AND slot = ?',
      args: [auth.userId, slot],
    });

    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
