import Image from "next/image";
import Link from "next/link";

import { withImageVersion } from "@/lib/image-url";
import type { Artwork } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";
import { StatusPill } from "./status-pill";

type ArtworkCardProps = {
  artwork: Artwork;
  priority?: boolean;
  variant?: "editorial" | "compact" | "catalogue";
};

const fieldLabels = {
  period: { zh: "年代", en: "Period" },
  region: { zh: "地区", en: "Region" },
  material: { zh: "材质", en: "Material" },
  dimensions: { zh: "尺寸", en: "Dimensions" },
} as const;

export function ArtworkCard({
  artwork,
  priority = false,
  variant = "editorial",
}: ArtworkCardProps) {
  const isPlaceholderImage = !artwork.image || artwork.image.startsWith("/api/placeholder/");

  if (variant === "catalogue") {
    return (
      <article className="group">
        <Link href={`/collection/${artwork.slug}`} className="block space-y-2.5">
          <div className="relative overflow-hidden bg-[var(--surface-strong)]">
            {isPlaceholderImage ? (
              <div className="relative flex aspect-[4/5] h-full w-full items-end bg-[linear-gradient(180deg,rgba(239,235,229,0.8)_0%,rgba(233,228,221,0.97)_100%)] p-4 md:p-5">
                <div className="absolute inset-4 border border-[var(--line)]/34 md:inset-5" />
                <div className="relative w-full border-t border-[var(--line)]/44 pt-2 text-[var(--muted)]">
                  <p className="text-[0.64rem] tracking-[0.08em] text-[var(--muted)]/88">图像整理中</p>
                  <p className="mt-0.5 text-[0.4rem] uppercase tracking-[0.18em] text-[var(--accent)]/34">
                    Image forthcoming
                  </p>
                </div>
              </div>
            ) : (
              <Image
                src={withImageVersion(artwork.image)}
                alt={`${artwork.title.zh} ${artwork.title.en}`}
                width={900}
                height={1200}
                priority={priority}
                unoptimized
                className="aspect-[4/5] h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.004]"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <BilingualText
                as="p"
                text={artwork.period}
                mode="inline"
                className="text-[var(--muted)]"
                zhClassName="text-[0.6rem] tracking-[0.08em]"
                enClassName="text-[0.38rem] uppercase tracking-[0.16em] text-[var(--accent)]/36"
              />
              <StatusPill status={artwork.status} variant="fine" />
            </div>
            <div className="space-y-0.5">
              <p className="font-serif text-[1.16rem] leading-[1.08] tracking-[-0.026em] text-[var(--ink)] md:text-[1.28rem]">
                {artwork.title.zh}
              </p>
              <p className="text-[0.44rem] uppercase tracking-[0.16em] text-[var(--accent)]/30">
                {artwork.title.en}
              </p>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group">
        <Link href={`/collection/${artwork.slug}`} className="block space-y-3.5">
          <div className="relative overflow-hidden bg-[var(--surface-strong)]">
            <Image
              src={withImageVersion(artwork.image)}
              alt={`${artwork.title.zh} ${artwork.title.en}`}
              width={900}
              height={1200}
              priority={priority}
              unoptimized
              className="aspect-[4/5] h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.012]"
            />
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <BilingualText
                as="p"
                text={artwork.period}
                mode="inline"
                className="text-[var(--muted)]"
                zhClassName="text-[0.72rem] tracking-[0.08em]"
                enClassName="text-[0.46rem] uppercase tracking-[0.16em] text-[var(--accent)]/60"
              />
              <StatusPill status={artwork.status} />
            </div>
            <div>
              <p className="font-serif text-[1.38rem] leading-[1.08] tracking-[-0.03em] text-[var(--ink)] md:text-[1.58rem]">
                {artwork.title.zh}
              </p>
              <p className="mt-1.5 text-[0.52rem] uppercase tracking-[0.16em] text-[var(--accent)]/56 md:text-[0.56rem]">
                {artwork.title.en}
              </p>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group border-t border-[var(--line)] pt-6 md:pt-7">
      <Link href={`/collection/${artwork.slug}`} className="grid gap-6 md:grid-cols-[minmax(0,0.92fr)_minmax(260px,0.52fr)] md:gap-10">
        <div className="relative overflow-hidden bg-[var(--surface-strong)]">
          <Image
            src={withImageVersion(artwork.image)}
            alt={`${artwork.title.zh} ${artwork.title.en}`}
            width={900}
            height={1200}
            priority={priority}
            unoptimized
            className="aspect-[4/5] h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.008]"
          />
        </div>
        <div className="flex flex-col justify-between gap-7 py-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <BilingualText
                as="p"
                text={artwork.category}
                mode="inline"
                className="text-[var(--accent)]"
                zhClassName="text-[0.7rem] tracking-[0.14em]"
                enClassName="text-[0.46rem] uppercase tracking-[0.16em] text-[var(--accent)]/62"
              />
              <StatusPill status={artwork.status} />
            </div>
            <div>
              <BilingualText
                as="h3"
                text={artwork.title}
                className="font-serif text-[var(--ink)]"
                zhClassName="block text-[1.56rem] leading-[1.08] tracking-[-0.028em] md:text-[2rem]"
                enClassName="mt-1.5 block font-sans text-[0.58rem] uppercase tracking-[0.16em] text-[var(--accent)]/62"
              />
              <BilingualText
                as="p"
                text={artwork.subtitle}
                mode="inline"
                className="mt-2 text-[var(--muted)]"
                zhClassName="text-[0.92rem] leading-7"
                enClassName="text-[0.64rem] leading-6 text-[var(--accent)]/62"
              />
            </div>
            <p className="max-w-xl text-[0.92rem] leading-7 text-[var(--muted)]">
              {artwork.excerpt.zh}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm text-[var(--muted)] md:max-w-[22rem]">
            {(Object.keys(fieldLabels) as Array<keyof typeof fieldLabels>).map((key) => (
              <div key={key}>
                <BilingualText
                  as="dt"
                  text={fieldLabels[key]}
                  mode="inline"
                  className="mb-1 text-[var(--accent)]"
                  zhClassName="text-[0.72rem] tracking-[0.18em]"
                  enClassName="text-[0.48rem] uppercase tracking-[0.16em]"
                />
                <BilingualText
                  as="dd"
                  text={artwork[key]}
                  mode="inline"
                  className="block"
                  zhClassName="block"
                  enClassName="text-[0.66rem] leading-6 text-[var(--accent)]/75"
                />
              </div>
            ))}
          </dl>
        </div>
      </Link>
    </article>
  );
}
