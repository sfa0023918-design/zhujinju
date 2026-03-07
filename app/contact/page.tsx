import { BilingualText } from "@/components/bilingual-text";
import { ContactForm } from "@/components/contact-form";
import { PageHero } from "@/components/page-hero";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

type ContactPageProps = {
  searchParams?: Promise<{
    artwork?: string;
  }>;
};

export const metadata = buildMetadata({
  title: bt("联系", "Contact"),
  description: bt("联系竹瑾居，提交作品询洽、机构合作或研究交流信息。", "Contact Zhu Jin Ju regarding works, institutional collaboration, or research exchange."),
  path: "/contact",
});

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <>
      <PageHero
        eyebrow={bt("联系", "Contact")}
        title={bt("联系", "Contact")}
        description={bt(
          "欢迎藏家、机构、策展人与研究者联系。页面保留自然得体的联络方式，不做销售式引导。",
          "Collectors, institutions, curators, and researchers are welcome to get in touch. The page keeps a natural and measured tone rather than a sales-driven one."
        )}
        aside={bt(
          "如咨询具体作品，可在表单中填写作品名称；若从作品页进入，意向作品将自动带入。",
          "If you are inquiring about a specific work, include its title in the form. When arriving from an artwork page, the title is carried over automatically."
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
              className="mb-3 flex flex-col gap-1 text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.22em]"
              enClassName="text-[0.54rem] uppercase tracking-[0.24em]"
            />
            <p className="text-[var(--muted)]">{siteConfig.contact.phone}</p>
            <p className="text-[var(--muted)]">{siteConfig.contact.whatsapp}</p>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <BilingualText
              as="p"
              text={siteConfig.contact.address}
              className="flex flex-col gap-3 text-[var(--muted)]"
              zhClassName="text-sm leading-8"
              enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
            />
            <BilingualText
              as="p"
              text={bt("以预约制会面为主，亦可安排线上交流。", "Meetings are generally by appointment, with online conversations also available.")}
              className="mt-3 flex flex-col gap-3 text-[var(--muted)]"
              zhClassName="text-sm leading-8"
              enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
            />
          </div>
        </div>
        <ContactForm initialArtwork={params.artwork} />
      </section>
    </>
  );
}
