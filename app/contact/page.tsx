import { BilingualText } from "@/components/bilingual-text";
import { ContactForm } from "@/components/contact-form";
import { PageHero } from "@/components/page-hero";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { loadSiteContent } from "@/lib/site-data";

type ContactPageProps = {
  searchParams?: Promise<{
    artwork?: string;
  }>;
};

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();

  return buildMetadata({
    title: bt("联系", "Contact"),
    description: pageCopy.contact.hero.description,
    path: "/contact",
    site: siteConfig,
  });
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = (await searchParams) ?? {};
  const { siteConfig, pageCopy } = await loadSiteContent();

  return (
    <>
      <PageHero
        eyebrow={pageCopy.contact.hero.eyebrow}
        title={pageCopy.contact.hero.title}
        description={pageCopy.contact.hero.description}
        aside={pageCopy.contact.hero.aside}
      />

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 px-5 pb-16 md:grid-cols-[minmax(0,0.72fr)_minmax(0,1.08fr)] md:px-10 md:pb-24">
        <div className="space-y-8">
          <div className="border-t border-[var(--line)] pt-5">
            <BilingualText
              as="p"
              text={bt("邮箱", "Email")}
              className="mb-3 flex flex-col gap-1 text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.22em]"
              enClassName="text-[0.54rem] uppercase tracking-[0.24em]"
            />
            <a href={`mailto:${siteConfig.contact.email}`} className="text-[var(--ink)]">
              {siteConfig.contact.email}
            </a>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <BilingualText
              as="p"
              text={bt("微信", "WeChat")}
              className="mb-3 flex flex-col gap-1 text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.22em]"
              enClassName="text-[0.54rem] uppercase tracking-[0.24em]"
            />
            <p className="text-[var(--muted)]">{siteConfig.contact.wechat}</p>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <BilingualText
              as="p"
              text={bt("电话 / WhatsApp", "Phone / WhatsApp")}
              mode="inline"
              className="mb-3 text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.22em]"
              enClassName="text-[0.48rem] uppercase tracking-[0.16em] text-[var(--accent)]/76"
            />
            <p className="text-[var(--muted)]">{siteConfig.contact.phone}</p>
            <p className="text-[var(--muted)]">{siteConfig.contact.whatsapp}</p>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <p className="text-sm leading-8 text-[var(--muted)]">{siteConfig.contact.address.zh}</p>
            <p className="mt-3 text-sm leading-8 text-[var(--muted)]">{pageCopy.contact.appointmentLine.zh}</p>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <p className="text-sm leading-8 text-[var(--muted)]">{siteConfig.contact.replyWindow.zh}</p>
            <p className="mt-2 text-sm leading-8 text-[var(--muted)]">{siteConfig.contact.collaborationNote.zh}</p>
            <p className="mt-2 text-sm leading-8 text-[var(--muted)]">{pageCopy.contact.cooperationLine.zh}</p>
          </div>
        </div>
        <ContactForm initialArtwork={params.artwork} />
      </section>
    </>
  );
}
