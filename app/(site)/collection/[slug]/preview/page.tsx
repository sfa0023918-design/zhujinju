import { getAdminSession } from "@/lib/admin-auth";
import { detailMetadata, renderDetail } from "../detail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const metadata = await detailMetadata((await params).slug, Boolean(await getAdminSession()));
  return { ...metadata, robots: { index: false, follow: false } };
}

export default async function PreviewPage({ params }: Props) {
  return renderDetail((await params).slug, Boolean(await getAdminSession()));
}
