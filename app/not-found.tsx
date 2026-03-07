import Link from "next/link";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { bt } from "@/lib/bilingual";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-[920px] flex-col justify-center px-5 py-20 md:px-10">
      <p className="mb-4 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
        404
      </p>
      <BilingualText
        as="h1"
        text={bt("页面不存在", "Page Not Found")}
        className="font-serif text-[var(--ink)]"
        zhClassName="block text-[2.8rem] leading-none tracking-[-0.05em] md:text-[5rem]"
        enClassName="mt-3 block font-sans text-[0.82rem] uppercase tracking-[0.24em] text-[var(--accent)]"
      />
      <BilingualText
        as="p"
        text={bt(
          "当前链接可能已经调整，或该内容尚未公开。你可以返回首页，或继续浏览藏品与展览页面。",
          "This link may have changed, or the content may not yet be public. You can return to the homepage or continue browsing the collection and exhibitions."
        )}
        className="mt-5 max-w-2xl flex flex-col gap-3 text-[var(--muted)] md:text-[0.98rem]"
        zhClassName="text-sm leading-8"
        enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
      />
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center border border-[var(--line-strong)] px-5 text-sm text-[var(--ink)]"
        >
          <ActionLabel text={bt("返回首页", "Home")} />
        </Link>
        <Link
          href="/collection"
          className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-sm text-[var(--muted)]"
        >
          <ActionLabel text={bt("浏览藏品", "Collection")} />
        </Link>
      </div>
    </section>
  );
}
