import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { AdminCmsEditor } from "@/components/admin-cms-editor";
import { editableSections, getEditableSectionValue, readSiteContentFresh } from "@/lib/site-data";

type AdminSectionPageProps = {
  params: Promise<{
    section: string;
  }>;
  searchParams?: Promise<{
    new?: string;
  }>;
};

export default async function AdminSectionPage({ params, searchParams }: AdminSectionPageProps) {
  const { section } = await params;
  const query = (await searchParams) ?? {};
  const sectionMeta = editableSections.find((item) => item.key === section);

  if (!sectionMeta) {
    notFound();
  }

  const content = await readSiteContentFresh();
  const value = getEditableSectionValue(content, sectionMeta.key);

  return (
    <AdminShell activeSection={sectionMeta.key}>
      <AdminCmsEditor
        section={sectionMeta.key}
        title={sectionMeta.title.zh}
        description={sectionMeta.description.zh}
        initialValue={value}
        content={content}
        autoCreate={query.new === "1"}
      />
    </AdminShell>
  );
}
