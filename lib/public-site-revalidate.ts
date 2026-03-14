import { revalidatePath, revalidateTag } from "next/cache";

const SITE_CONTENT_TAG = "site-content";

export function revalidatePublicSite() {
  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/collection");
  revalidatePath("/exhibitions");
  revalidatePath("/journal");
  revalidatePath("/about");
  revalidatePath("/contact");
}

export function getSiteContentTag() {
  return SITE_CONTENT_TAG;
}
