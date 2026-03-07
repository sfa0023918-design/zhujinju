import Image from "next/image";
import Link from "next/link";

import type { Artwork } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";
import { StatusPill } from "./status-pill";

type ArtworkCardProps = {
  artwork: Artwork;
  priority?: boolean;
};

const fieldLabels = {
  period: { zh: "年代", en: "Period" },
  region: { zh: "地区", en: "Region" },
  material: { zh: "材质", en: "Material" },
  dimensions: { zh: "尺寸", en: "Dimensions" },
} as const;

export function ArtworkCard({ artwork, priority = false }: ArtworkCardProps) {
  return (
    <article className="group border-t border-[var(--line)] pt-5 md:pt-6">
      <Link href={`/collection/${artwork.slug}`} className="grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(260px,0.55fr)] md:gap-8">
        <div className="relative overflow-hidden bg-[var(--surface-strong)]">
          <Image
            src={artwork.image}
            alt={`${artwork.title.zh} ${artwork.title.en}`}
            width={900}
            height={1200}
            priority={priority}
            unoptimized
            className="aspect-[4/5] h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
          />
        </div>
        <div className="flex flex-col justify-between gap-6 py-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <BilingualText
                as="p"
                text={artwork.category}
                className="flex flex-col gap-1 text-[var(--accent)]"
                zhClassName="text-[0.74rem] tracking-[0.16em]"
                enClassName="text-[0.54rem] uppercase tracking-[0.22em]"
              />
              <StatusPill status={artwork.status} />
            </div>
            <div>
              <BilingualText
                as="h3"
                text={artwork.title}
                className="font-serif text-[var(--ink)]"
                zhClassName="block text-[1.7rem] leading-tight tracking-[-0.03em] md:text-[2.2rem]"
                enClassName="mt-2 block font-sans text-[0.74rem] uppercase tracking-[0.2em] text-[var(--accent)]"
              />
              <BilingualText
                as="p"
                text={artwork.subtitle}
                className="mt-3 flex flex-col gap-2 text-[var(--muted)]"
                zhClassName="text-sm leading-7"
                enClassName="text-[0.78rem] leading-6 text-[var(--accent)]/80"
              />
            </div>
            <BilingualText
              as="p"
              text={artwork.excerpt}
              className="max-w-xl flex flex-col gap-3 text-[var(--muted)]"
              zhClassName="text-sm leading-7 md:text-[0.96rem]"
              enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
            />
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-[var(--muted)] md:max-w-sm">
            {(Object.keys(fieldLabels) as Array<keyof typeof fieldLabels>).map((key) => (
              <div key={key}>
                <BilingualText
                  as="dt"
                  text={fieldLabels[key]}
                  className="mb-1 flex flex-col gap-1 text-[var(--accent)]"
                  zhClassName="text-[0.72rem] tracking-[0.18em]"
                  enClassName="text-[0.52rem] uppercase tracking-[0.2em]"
                />
                <BilingualText
                  as="dd"
                  text={artwork[key]}
                  className="flex flex-col gap-1"
                  zhClassName="block"
                  enClassName="block text-[0.72rem] leading-6 text-[var(--accent)]/80"
                />
              </div>
            ))}
          </dl>
        </div>
      </Link>
    </article>
  );
}
