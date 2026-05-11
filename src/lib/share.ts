import bcrypt from "bcryptjs";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";

const SHARE_COOKIE_PREFIX = "share_access_";

export function generateShareToken(): string {
  return randomBytes(16).toString("base64url");
}

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, 12);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

// Signed access cookie for a share token: HMAC of "<token>:<expiry>".
// Set after a visitor enters the correct password; checked on subsequent requests.
function signingSecret(): string {
  const secret = process.env.SHARE_LINK_SECRET;
  if (!secret) throw new Error("SHARE_LINK_SECRET is not set");
  return secret;
}

export function signShareAccess(token: string, ttlSeconds = 60 * 60 * 12): string {
  const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${token}:${expiry}`;
  const sig = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `${expiry}.${sig}`;
}

export function verifyShareAccess(token: string, cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const [expiryStr, sig] = cookieValue.split(".");
  if (!expiryStr || !sig) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac("sha256", signingSecret()).update(`${token}:${expiry}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function shareCookieName(token: string): string {
  return `${SHARE_COOKIE_PREFIX}${token}`;
}
