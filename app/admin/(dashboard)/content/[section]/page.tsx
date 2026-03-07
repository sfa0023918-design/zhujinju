import { notFound } from "next/navigation";

import { saveAdminSection } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminVisualEditor } from "@/components/admin-visual-editor";
import { editableSections, readSiteContentFresh } from "@/lib/site-data";

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
  const value = content[sectionMeta.key];

  return (
    <AdminShell activeSection={sectionMeta.key}>
      <AdminVisualEditor
        action={saveAdminSection}
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
