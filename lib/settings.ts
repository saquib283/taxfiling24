import prisma from "@/lib/prisma";

export type SiteSettings = Record<string, string>;

/**
 * Fetches all settings from the database as a key-value map.
 * Safe to call from server components and API routes.
 */
export async function getSettings(): Promise<SiteSettings> {
  try {
    const settings = await prisma.setting.findMany();
    return settings.reduce((acc: SiteSettings, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return {};
  }
}

/**
 * Get a single setting value with a fallback default.
 */
export async function getSetting(key: string, fallback: string = ""): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } });
    return setting?.value || fallback;
  } catch {
    return fallback;
  }
}
