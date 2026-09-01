import "server-only";
import { cookies } from "next/headers";

export const UNLOCK_COOKIE_NAME = "br_unlocked_verses";
const MAX_TRACKED_VERSES = 50;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function parseUnlockedVerseIds(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function unlockCookieValue(existingRaw: string | undefined, verseId: string): string {
  const ids = parseUnlockedVerseIds(existingRaw).filter((id) => id !== verseId);
  ids.push(verseId);
  return JSON.stringify(ids.slice(-MAX_TRACKED_VERSES));
}

export const unlockCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

export async function hasUnlockedInterpretation(verseId: string): Promise<boolean> {
  const store = await cookies();
  const ids = parseUnlockedVerseIds(store.get(UNLOCK_COOKIE_NAME)?.value);
  return ids.includes(verseId);
}
