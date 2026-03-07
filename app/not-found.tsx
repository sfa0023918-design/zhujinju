import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-[920px] flex-col justify-center px-5 py-20 md:px-10">
      <p className="mb-4 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
        404
      </p>
      <h1 className="font-serif text-[2.8rem] leading-none tracking-[-0.05em] text-[var(--ink)] md:text-[5rem]">
        页面不存在
      </h1>
      <p className="mt-5 max-w-2xl text-sm leading-8 text-[var(--muted)] md:text-[0.98rem]">
        当前链接可能已经调整，或该内容尚未公开。你可以返回首页，或继续浏览藏品与展览页面。
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center border border-[var(--line-strong)] px-5 text-sm text-[var(--ink)]"
        >
          返回首页
        </Link>
        <Link
          href="/collection"
          className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-sm text-[var(--muted)]"
        >
          浏览藏品
        </Link>
      </div>
    </section>
  );
}
