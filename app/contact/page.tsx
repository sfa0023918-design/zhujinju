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
  const { siteConfig } = await loadSiteContent();

  return buildMetadata({
    title: bt("联系", "Contact"),
    description: bt("联系竹瑾居，提交作品询洽、机构合作或研究交流信息。", "Contact Zhu Jin Ju regarding works, institutional collaboration, or research exchange."),
    path: "/contact",
    site: siteConfig,
  });
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = (await searchParams) ?? {};
  const { siteConfig } = await loadSiteContent();

  return (
    <>
      <PageHero
        eyebrow={bt("联系", "Contact")}
        title={bt("联系", "Contact")}
        description={bt(
          "欢迎藏家、机构、策展人与研究者联系。竹瑾居以作品咨询、借展洽谈、研究合作与图录交换为主要联络方向。",
          "Collectors, institutions, curators, and researchers are welcome to get in touch regarding works, loans, research collaboration, and catalogue exchange."
        )}
        aside={bt(
          "如咨询具体作品，可在表单中填写作品名称；若由作品页进入，意向作品将自动带入。上海会面采用预约制，可安排看件与研究交流。",
          "If you are inquiring about a specific work, include its title in the form. When arriving from an artwork page, the title is carried over automatically. Meetings in Shanghai are by appointment."
        )}
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
            <p className="mt-3 text-sm leading-8 text-[var(--muted)]">By appointment in Shanghai.</p>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <p className="text-sm leading-8 text-[var(--muted)]">{siteConfig.contact.replyWindow.zh}</p>
            <p className="mt-2 text-sm leading-8 text-[var(--muted)]">{siteConfig.contact.collaborationNote.zh}</p>
            <p className="mt-2 text-sm leading-8 text-[var(--muted)]">
              借展、研究合作、图录交换与机构看件，请在留言中说明机构名称、时间安排与需求方向。
            </p>
          </div>
        </div>
        <ContactForm initialArtwork={params.artwork} />
      </section>
    </>
  );
}
