import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

const SALT_ROUNDS = 12;

export interface AuthUser {
  id: number;
  username: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

function signToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, username: user.username }, getJWTSecret(), { expiresIn: '30d' });
}

// Register — username + password only
router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'Pseudo et mot de passe requis' });
    return;
  }

  if (username.length < 3 || username.length > 32) {
    res.status(400).json({ error: 'Le pseudo doit faire entre 3 et 32 caractères' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });
    return;
  }

  // Only allow alphanumeric, underscores, dashes
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    res.status(400).json({ error: 'Le pseudo ne peut contenir que lettres, chiffres, _ et -' });
    return;
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username.toLowerCase(), hash],
    );
    const user: AuthUser = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, username: user.username } });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      res.status(409).json({ error: 'Ce pseudo est déjà pris' });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Login — username + password
router.post('/login', async (req: Request, res: Response) => {
  const { login, password } = req.body as { login?: string; password?: string };

  if (!login || !password) {
    res.status(400).json({ error: 'Pseudo et mot de passe requis' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [login.toLowerCase()],
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Pseudo ou mot de passe incorrect' });
      return;
    }

    const row = result.rows[0];
    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Pseudo ou mot de passe incorrect' });
      return;
    }

    const user: AuthUser = { id: row.id, username: row.username };
    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Verify session
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Auth middleware
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token manquant' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), getJWTSecret()) as AuthUser;
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

export { router as authRouter };
