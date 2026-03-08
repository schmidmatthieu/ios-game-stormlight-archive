import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, initDB } from '../lib/db.js';
import { signToken } from '../lib/auth.js';
import { verifyPassword } from '../lib/crypto.js';
import { setCors } from '../lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await initDB();

  const { login, password } = req.body ?? {};

  if (!login || !password) {
    return res.status(400).json({ error: 'Identifiant et mot de passe requis' });
  }

  const result = await db.execute({
    sql: 'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?',
    args: [login, login],
  });

  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
  }

  const valid = await verifyPassword(password, user.password_hash as string);
  if (!valid) {
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
  }

  await db.execute({
    sql: "UPDATE users SET last_login = datetime('now') WHERE id = ?",
    args: [user.id as number],
  });

  const token = await signToken({ userId: user.id as number, username: user.username as string });

  return res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
}
