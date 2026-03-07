import { notFound } from "next/navigation";

import { saveAdminSection } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminVisualEditor } from "@/components/admin-visual-editor";
import { editableSections, loadSiteContent } from "@/lib/site-data";

type AdminSectionPageProps = {
  params: Promise<{
    section: string;
  }>;
};

export default async function AdminSectionPage({ params }: AdminSectionPageProps) {
  const { section } = await params;
  const sectionMeta = editableSections.find((item) => item.key === section);

  if (!sectionMeta) {
    notFound();
  }

  const content = await loadSiteContent();
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
      />
    </AdminShell>
  );
}
