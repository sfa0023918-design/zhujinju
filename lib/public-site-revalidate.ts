import { revalidatePath, revalidateTag } from "next/cache";

const SITE_CONTENT_TAG = "site-content";

export function revalidatePublicSite() {
  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/collection");
  revalidatePath("/collection/[slug]", "page");
  revalidatePath("/exhibitions");
  revalidatePath("/exhibitions/[slug]", "page");
  revalidatePath("/journal");
  revalidatePath("/journal/[slug]", "page");
  revalidatePath("/about");
  revalidatePath("/contact");
}

export function getSiteContentTag() {
  return SITE_CONTENT_TAG;
}
