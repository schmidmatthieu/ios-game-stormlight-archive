// ─── Password Hashing — PBKDF2 ──────────────────────────────────
import { randomBytes, pbkdf2 } from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2Async = promisify(pbkdf2);
const ITERATIONS = 100_000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(32).toString('hex');
  const hash = await pbkdf2Async(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  return `${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, storedHash] = stored.split(':');
  if (!salt || !storedHash) return false;
  const hash = await pbkdf2Async(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  return hash.toString('hex') === storedHash;
}
