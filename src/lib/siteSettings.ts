import "server-only";
import * as siteSettingsRepo from "@/lib/db/repositories/siteSettings";
import { cached, invalidate } from "@/lib/cache";

export type SiteSettings = {
  projectsComingSoon: boolean;
};

const DEFAULT: SiteSettings = {
  projectsComingSoon: false,
};

const CACHE_KEY = "siteSettings";

export async function getSiteSettings(): Promise<SiteSettings> {
  return cached(CACHE_KEY, async () => {
    const row = await siteSettingsRepo.findUnique();
    if (!row) return DEFAULT;
    return { projectsComingSoon: row.projectsComingSoon };
  });
}

export async function saveSiteSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const row = await siteSettingsRepo.upsert(data);
  invalidate(CACHE_KEY);
  return { projectsComingSoon: row.projectsComingSoon };
}
