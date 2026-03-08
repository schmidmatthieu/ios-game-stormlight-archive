import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, initDB } from '../lib/db.js';
import { signToken } from '../lib/auth.js';
import { hashPassword } from '../lib/crypto.js';
import { setCors } from '../lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await initDB();

  const { username, email, password } = req.body ?? {};

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Le pseudo doit faire entre 3 et 30 caractères' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE username = ? OR email = ?',
    args: [username, email],
  });

  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Ce pseudo ou email est déjà utilisé' });
  }

  const passwordHash = await hashPassword(password);

  const result = await db.execute({
    sql: 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    args: [username, email, passwordHash],
  });

  const userId = Number(result.lastInsertRowid);
  const token = await signToken({ userId, username });

  return res.status(201).json({ token, user: { id: userId, username, email } });
}
