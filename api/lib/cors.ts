// ─── CORS Helpers for Vercel ─────────────────────────────────────
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
];

function isAllowed(origin: string | undefined): string {
  if (!origin) return ALLOWED_ORIGINS[0];
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return origin;
  if (origin.includes('vercel.app')) return origin;
  if (origin.includes('cosmere')) return origin;
  return ALLOWED_ORIGINS[0];
}

export function setCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin as string | undefined;
  res.setHeader('Access-Control-Allow-Origin', isAllowed(origin));
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
