import Link from "next/link";

const navigation = [
  { href: "/", label: "首页" },
  { href: "/collection", label: "藏品" },
  { href: "/exhibitions", label: "展览与图录" },
  { href: "/journal", label: "文章" },
  { href: "/about", label: "关于" },
  { href: "/contact", label: "联系" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)]">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-8 px-5 py-5 md:px-10 md:py-6">
        <Link href="/" className="min-w-fit text-[0.95rem] tracking-[0.28em] text-[var(--ink)]">
          竹瑾居
        </Link>
        <nav
          aria-label="主导航"
          className="flex flex-1 justify-end gap-4 overflow-x-auto text-sm text-[var(--muted)] md:gap-7"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-w-fit whitespace-nowrap transition-colors duration-300 hover:text-[var(--ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
