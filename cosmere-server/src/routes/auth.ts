// ─── Auth Routes — Register / Login ──────────────────────────────
import { Hono } from 'hono';
import { db } from '../db/schema.js';
import { signToken } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';

const auth = new Hono();

// POST /auth/register
auth.post('/register', async (c) => {
  const body = await c.req.json<{ username: string; email: string; password: string }>();
  const { username, email, password } = body;

  if (!username || !email || !password) {
    return c.json({ error: 'Tous les champs sont requis' }, 400);
  }
  if (username.length < 3 || username.length > 30) {
    return c.json({ error: 'Le pseudo doit faire entre 3 et 30 caractères' }, 400);
  }
  if (password.length < 6) {
    return c.json({ error: 'Le mot de passe doit faire au moins 6 caractères' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Email invalide' }, 400);
  }

  // Check if username or email already taken
  const existing = db.prepare(
    'SELECT id FROM users WHERE username = ? OR email = ?'
  ).get(username, email) as { id: number } | undefined;

  if (existing) {
    return c.json({ error: 'Ce pseudo ou email est déjà utilisé' }, 409);
  }

  const passwordHash = await hashPassword(password);

  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  ).run(username, email, passwordHash);

  const userId = result.lastInsertRowid as number;
  const token = await signToken({ userId, username });

  return c.json({ token, user: { id: userId, username, email } }, 201);
});

// POST /auth/login
auth.post('/login', async (c) => {
  const body = await c.req.json<{ login: string; password: string }>();
  const { login, password } = body;

  if (!login || !password) {
    return c.json({ error: 'Identifiant et mot de passe requis' }, 400);
  }

  // Allow login with username or email
  const user = db.prepare(
    'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?'
  ).get(login, login) as { id: number; username: string; email: string; password_hash: string } | undefined;

  if (!user) {
    return c.json({ error: 'Identifiant ou mot de passe incorrect' }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ error: 'Identifiant ou mot de passe incorrect' }, 401);
  }

  // Update last login
  db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);

  const token = await signToken({ userId: user.id, username: user.username });

  return c.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

// GET /auth/me — verify token and get user info
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  const { verifyToken } = await import('../middleware/auth.js');
  const payload = await verifyToken(authHeader.slice(7));
  if (!payload) {
    return c.json({ error: 'Token invalide' }, 401);
  }

  const user = db.prepare(
    'SELECT id, username, email, created_at, last_login FROM users WHERE id = ?'
  ).get(payload.userId) as { id: number; username: string; email: string; created_at: string; last_login: string } | undefined;

  if (!user) {
    return c.json({ error: 'Utilisateur introuvable' }, 404);
  }

  return c.json({ user });
});

export { auth };
