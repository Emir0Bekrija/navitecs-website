import "server-only";
import { cookies } from "next/headers";
import * as adminSessionRepo from "@/lib/db/repositories/adminSession";
import * as auditLogRepo from "@/lib/db/repositories/auditLog";
import crypto from "crypto";

// ─── Constants ────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "nca_sess";

/** Idle timeout: session expires if unused for this long. */
export const SESSION_MAX_AGE_S = 4 * 60 * 60; // 4 hours

/** Hard cap: session always expires this long after login, regardless of activity. */
export const SESSION_ABSOLUTE_MAX_S = 24 * 60 * 60; // 24 hours

const SESSION_MAX_AGE_MS       = SESSION_MAX_AGE_S * 1000;
const SESSION_ABSOLUTE_MAX_MS  = SESSION_ABSOLUTE_MAX_S * 1000;

// Slide the idle window when less than half of it remains (< 2 h left).
// This halves the number of DB writes while still feeling seamless.
const SESSION_RENEW_THRESHOLD_MS = (SESSION_MAX_AGE_MS / 2);

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminSessionUser = {
  id: number;
  username: string;
  role: string;
  sessionId: string;
  /** SHA-256 hash of the cookie token — used for revocation. Never the raw value. */
  sessionTokenHash: string;
};

// ─── Token hashing ────────────────────────────────────────────────────────────

/**
 * SHA-256 hash of a raw session token.
 * Only this hash is ever written to the database.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─── Session lifecycle ────────────────────────────────────────────────────────

/**
 * Create a new session for the given user.
 *
 * Generates a 96-char hex token (384 bits of entropy) with crypto.randomBytes.
 * Only the SHA-256 hash of that token is stored in AdminSession.
 * Returns the raw token — this is the only time it exists in plaintext.
 * The caller must place it in an HttpOnly cookie and then discard it.
 */
export async function createSession(
  userId: number,
  ip: string | null,
  userAgent: string | null,
): Promise<string> {
  const token    = crypto.randomBytes(48).toString("hex"); // raw — never stored
  const tokenHash = hashSessionToken(token);

  const now              = Date.now();
  const expiresAt        = new Date(now + SESSION_MAX_AGE_MS);
  const absoluteExpiresAt = new Date(now + SESSION_ABSOLUTE_MAX_MS);

  await adminSessionRepo.create({
    userId,
    tokenHash,
    ip,
    userAgent: userAgent ? userAgent.slice(0, 500) : null,
    expiresAt,
    absoluteExpiresAt,
  });

  return token;
}

/**
 * Validate a raw token (read from a cookie).
 *
 * Hashes the token and looks up the hash in the DB.
 * Checks both the sliding idle timeout and the absolute hard cap.
 * Slides the idle expiry forward if less than half the idle window remains,
 * but never past the absolute cap.
 */
export async function getSessionUser(token: string): Promise<AdminSessionUser | null> {
  const tokenHash = hashSessionToken(token);
  const now       = new Date();

  let session;
  try {
    session = await adminSessionRepo.findUniqueWithUser(tokenHash);
  } catch {
    return null;
  }

  if (!session) return null;

  // Check idle timeout
  if (session.expiresAt <= now) {
    await adminSessionRepo.remove(tokenHash).catch(() => {});
    return null;
  }

  // Check absolute hard cap
  if (session.absoluteExpiresAt <= now) {
    await adminSessionRepo.remove(tokenHash).catch(() => {});
    return null;
  }

  // Slide the idle window when less than half remains,
  // capped at the absolute max so we never extend beyond login + 24 h.
  const idleRemaining = session.expiresAt.getTime() - now.getTime();
  if (idleRemaining < SESSION_RENEW_THRESHOLD_MS) {
    const newExpiry = new Date(
      Math.min(
        now.getTime() + SESSION_MAX_AGE_MS,
        session.absoluteExpiresAt.getTime(),
      ),
    );
    await adminSessionRepo.update(tokenHash, { expiresAt: newExpiry }).catch(() => {});
  }

  return {
    id:               session.user.id,
    username:         session.user.username,
    role:             session.user.role,
    sessionId:        session.id,
    sessionTokenHash: tokenHash,
  };
}

/**
 * Read the session cookie and validate it.
 * Returns null if the cookie is absent or the session is invalid/expired.
 */
export async function getSessionFromCookie(): Promise<AdminSessionUser | null> {
  const cookieStore = await cookies();
  const token       = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionUser(token);
}

// ─── Session revocation ───────────────────────────────────────────────────────

/**
 * Immediately revoke a session by its token hash.
 * Called on logout and on verify-password lockout.
 */
export async function deleteSession(tokenHash: string): Promise<void> {
  await adminSessionRepo.remove(tokenHash).catch(() => {});
}

/**
 * Revoke a session by its DB row ID.
 * Used by the superadmin session management page.
 */
export async function deleteSessionById(id: string): Promise<void> {
  await adminSessionRepo.removeById(id).catch(() => {});
}

/**
 * Revoke all sessions for a user.
 * Called when a user's password is changed.
 */
export async function deleteAllUserSessions(userId: number): Promise<void> {
  await adminSessionRepo.removeByUserId(userId).catch(() => {});
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export async function logAudit(
  action:    string,
  userId:    number | null,
  username:  string | null,
  ip:        string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await auditLogRepo
    .create({ action, userId, username, ip, metadata })
    .catch(() => {});
}
