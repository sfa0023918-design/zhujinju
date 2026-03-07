import { ContactForm } from "@/components/contact-form";
import { PageHero } from "@/components/page-hero";
import { buildMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

type ContactPageProps = {
  searchParams?: Promise<{
    artwork?: string;
  }>;
};

export const metadata = buildMetadata({
  title: "联系",
  description: "联系竹瑾居，提交作品询洽、机构合作或研究交流信息。",
  path: "/contact",
});

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="联系"
        description="欢迎藏家、机构、策展人与研究者联系。页面保留自然得体的联络方式，不做销售式引导。"
        aside="如咨询具体作品，可在表单中填写作品名称；若从作品页进入，意向作品将自动带入。"
      />

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 px-5 pb-16 md:grid-cols-[minmax(0,0.72fr)_minmax(0,1.08fr)] md:px-10 md:pb-24">
        <div className="space-y-8">
          <div className="border-t border-[var(--line)] pt-5">
            <p className="mb-3 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
              邮箱
            </p>
            <a href={`mailto:${siteConfig.contact.email}`} className="text-[var(--ink)]">
              {siteConfig.contact.email}
            </a>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <p className="mb-3 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
              微信
            </p>
            <p className="text-[var(--muted)]">{siteConfig.contact.wechat}</p>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <p className="mb-3 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
              电话 / WhatsApp
            </p>
            <p className="text-[var(--muted)]">{siteConfig.contact.phone}</p>
            <p className="text-[var(--muted)]">{siteConfig.contact.whatsapp}</p>
          </div>
          <div className="border-t border-[var(--line)] pt-5 text-sm leading-8 text-[var(--muted)]">
            <p>{siteConfig.contact.address}</p>
            <p>以预约制会面为主，亦可安排线上交流。</p>
          </div>
        </div>
        <ContactForm initialArtwork={params.artwork} />
      </section>
    </>
  );
}
