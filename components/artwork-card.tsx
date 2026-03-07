import Image from "next/image";
import Link from "next/link";

import type { Artwork } from "@/lib/site-data";

import { StatusPill } from "./status-pill";

type ArtworkCardProps = {
  artwork: Artwork;
  priority?: boolean;
};

export function ArtworkCard({ artwork, priority = false }: ArtworkCardProps) {
  return (
    <article className="group border-t border-[var(--line)] pt-5 md:pt-6">
      <Link href={`/collection/${artwork.slug}`} className="grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(260px,0.55fr)] md:gap-8">
        <div className="relative overflow-hidden bg-[var(--surface-strong)]">
          <Image
            src={artwork.image}
            alt={artwork.title}
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
              <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)] uppercase">
                {artwork.category}
              </p>
              <StatusPill status={artwork.status} />
            </div>
            <div>
              <h3 className="font-serif text-[1.7rem] leading-tight tracking-[-0.03em] text-[var(--ink)] md:text-[2.2rem]">
                {artwork.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{artwork.subtitle}</p>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[var(--muted)] md:text-[0.96rem]">
              {artwork.excerpt}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-[var(--muted)] md:max-w-sm">
            <div>
              <dt className="mb-1 text-[0.72rem] tracking-[0.18em] uppercase text-[var(--accent)]">
                年代
              </dt>
              <dd>{artwork.period}</dd>
            </div>
            <div>
              <dt className="mb-1 text-[0.72rem] tracking-[0.18em] uppercase text-[var(--accent)]">
                地区
              </dt>
              <dd>{artwork.region}</dd>
            </div>
            <div>
              <dt className="mb-1 text-[0.72rem] tracking-[0.18em] uppercase text-[var(--accent)]">
                材质
              </dt>
              <dd>{artwork.material}</dd>
            </div>
            <div>
              <dt className="mb-1 text-[0.72rem] tracking-[0.18em] uppercase text-[var(--accent)]">
                尺寸
              </dt>
              <dd>{artwork.dimensions}</dd>
            </div>
          </dl>
        </div>
      </Link>
    </article>
  );
}
