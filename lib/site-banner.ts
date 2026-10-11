import { unstable_cache } from "next/cache";

import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettingModel } from "@/lib/models/site-setting";

/* The "under development" banner across the top of every page. On until an admin turns it off. Read through the
 * cache (it's in the root layout, so it must not cost a database trip per page); the admin switch clears the tag. */
export const BANNER_TAG = "site-banner";
export const BANNER_KEY = "dev-banner";
export const DEFAULT_BANNER = "Node is under active development — you may find issues or bugs, and things may be interrupted now and then. Thank you for your patience.";

export type Banner = { enabled: boolean; message: string };

export async function readBanner(): Promise<Banner> {
  await connectToDatabase();
  const doc = await SiteSettingModel.findOne({ key: BANNER_KEY }).lean();
  return { enabled: doc?.enabled ?? true, message: doc?.message || DEFAULT_BANNER };
}

const cached = unstable_cache(readBanner, [BANNER_KEY], { tags: [BANNER_TAG], revalidate: 600 });

/* never lets a database hiccup take a page down: if it can't be read, the banner shows (the safe default) */
export async function getBanner(): Promise<Banner> {
  try {
    return await cached();
  } catch {
    return { enabled: true, message: DEFAULT_BANNER };
  }
}
