import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, initDB } from '../lib/db.js';
import { getAuthUser } from '../lib/auth.js';
import { setCors } from '../lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await initDB();

  const auth = await getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Non authentifié' });

  const result = await db.execute({
    sql: 'SELECT id, username, email, created_at, last_login FROM users WHERE id = ?',
    args: [auth.userId],
  });

  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  return res.json({ user });
}
