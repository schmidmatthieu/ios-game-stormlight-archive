// ─── JWT Auth Helpers for Vercel Serverless ──────────────────────
import * as jose from 'jose';
import type { VercelRequest } from '@vercel/node';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'cosmere-chronicles-dev-secret-change-me'
);
const JWT_ISSUER = 'cosmere-server';
const JWT_EXPIRY = '7d';

export interface AuthPayload {
  userId: number;
  username: string;
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, { issuer: JWT_ISSUER });
    return { userId: payload.userId as number, username: payload.username as string };
  } catch {
    return null;
  }
}

export async function getAuthUser(req: VercelRequest): Promise<AuthPayload | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.slice(7));
}
