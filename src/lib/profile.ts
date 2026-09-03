import { supabase } from "@/integrations/supabase/client";

const PENDING_KEY = "community-sos:pending-profile";

export interface PendingProfile {
  name: string;
  email: string;
  phone: string;
  age?: number | null;
}

export function savePendingProfile(profile: PendingProfile) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable */
  }
}

function readPendingProfile(): PendingProfile | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingProfile) : null;
  } catch {
    return null;
  }
}

function clearPendingProfile() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* noop */
  }
}

function makePlatformId() {
  return `CSOS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * Writes the signup details captured on /register into the public profile table
 * and the private contacts table. Runs once a real session exists (email
 * confirmation may delay that), and is a no-op when the profile already exists.
 */
export async function ensurePendingProfile(userId: string) {
  const pending = readPendingProfile();

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    clearPendingProfile();
    return;
  }
  if (!pending) return;

  const { error } = await supabase.from("users").insert({
    id: userId,
    name: pending.name,
    platform_user_id: makePlatformId(),
  });
  if (error) return;

  await supabase.from("user_contacts").insert({
    user_id: userId,
    email: pending.email,
    phone: pending.phone,
    age: pending.age ?? null,
  });

  clearPendingProfile();
}
