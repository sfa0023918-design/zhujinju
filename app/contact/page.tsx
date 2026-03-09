import { BilingualText } from "@/components/bilingual-text";
import { ContactForm } from "@/components/contact-form";
import { EditorialPageHero } from "@/components/editorial-page-hero";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { loadSiteContent } from "@/lib/site-data";

export const dynamic = "force-dynamic";

type ContactPageProps = {
  searchParams?: Promise<{
    artwork?: string;
  }>;
};

export async function generateMetadata() {
  const { siteConfig } = await loadSiteContent();

  return buildMetadata({
    title: bt("联系", "Contact"),
    description: siteConfig.contactPage.description,
    path: "/contact",
    site: siteConfig,
  });
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = (await searchParams) ?? {};
  const { siteConfig, pageCopy } = await loadSiteContent();
  const labels = siteConfig.contactPage.infoLabels;

  return (
    <>
      <EditorialPageHero
        eyebrow={siteConfig.contactPage.eyebrow}
        title={siteConfig.contactPage.title}
        description={siteConfig.contactPage.description}
        aside={siteConfig.contactPage.aside}
      />

      <section className="mx-auto grid w-full max-w-[1480px] gap-8 px-5 pb-16 md:px-8 md:pb-20 lg:grid-cols-[minmax(0,0.74fr)_minmax(0,1.02fr)] lg:px-10 lg:pb-24">
        <div className="space-y-7">
          <div className="border-t border-[var(--line)]/80 pt-4">
            <BilingualText
              as="p"
              text={labels.email}
              className="mb-3 flex flex-col gap-1 text-[var(--accent)]"
              zhClassName="text-[0.7rem] tracking-[0.2em]"
              enClassName="text-[0.5rem] uppercase tracking-[0.16em] text-[var(--accent)]/62"
            />
            <a href={`mailto:${siteConfig.contact.email}`} className="text-[0.98rem] text-[var(--ink)]">
              {siteConfig.contact.email}
            </a>
          </div>
          <div className="border-t border-[var(--line)]/80 pt-4">
            <BilingualText
              as="p"
              text={labels.wechat}
              className="mb-3 flex flex-col gap-1 text-[var(--accent)]"
              zhClassName="text-[0.7rem] tracking-[0.2em]"
              enClassName="text-[0.5rem] uppercase tracking-[0.16em] text-[var(--accent)]/62"
            />
            <p className="text-[0.96rem] text-[var(--muted)]">{siteConfig.contact.wechat}</p>
          </div>
          <div className="border-t border-[var(--line)]/80 pt-4">
            <BilingualText
              as="p"
              text={labels.phoneWhatsapp}
              mode="inline"
              className="mb-3 text-[var(--accent)]"
              zhClassName="text-[0.7rem] tracking-[0.2em]"
              enClassName="text-[0.48rem] uppercase tracking-[0.14em] text-[var(--accent)]/62"
            />
            <p className="text-[0.96rem] text-[var(--muted)]">{siteConfig.contact.phone}</p>
            {siteConfig.contact.whatsapp !== siteConfig.contact.phone ? (
              <p className="text-[0.96rem] text-[var(--muted)]">{siteConfig.contact.whatsapp}</p>
            ) : null}
          </div>
          <div className="border-t border-[var(--line)]/80 pt-4">
            <p className="text-[15px] leading-8 text-[var(--muted)]">{siteConfig.contact.address.zh}</p>
            <p className="mt-3 text-[15px] leading-8 text-[var(--muted)]">{siteConfig.contact.appointmentNote.zh}</p>
          </div>
          <div className="border-t border-[var(--line)]/80 pt-4">
            <p className="text-[15px] leading-8 text-[var(--muted)]">{siteConfig.contact.replyWindow.zh}</p>
            <p className="mt-2 text-[15px] leading-8 text-[var(--muted)]">{siteConfig.contact.collaborationNote.zh}</p>
          </div>
        </div>
        <ContactForm
          initialArtwork={params.artwork}
          copy={pageCopy.siteChrome.contactForm}
        />
      </section>
    </>
  );
}
