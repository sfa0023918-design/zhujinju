import Link from "next/link";

import { filterOptions } from "@/lib/site-data";

type CollectionFiltersProps = {
  current: {
    category?: string;
    region?: string;
    period?: string;
    material?: string;
  };
};

const filterFields = [
  { name: "category", label: "品类", options: filterOptions.categories },
  { name: "region", label: "地区", options: filterOptions.regions },
  { name: "period", label: "年代", options: filterOptions.periods },
  { name: "material", label: "材质", options: filterOptions.materials },
] as const;

export function CollectionFilters({ current }: CollectionFiltersProps) {
  return (
    <form
      action="/collection"
      className="grid gap-4 border-y border-[var(--line)] py-5 md:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]"
    >
      {filterFields.map((field) => (
        <label key={field.name} className="grid gap-2 text-sm text-[var(--muted)]">
          <span className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)] uppercase">
            {field.label}
          </span>
          <select
            name={field.name}
            defaultValue={current[field.name]}
            className="h-11 rounded-none border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          >
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button
        type="submit"
        className="h-11 self-end border border-[var(--line-strong)] px-5 text-sm text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface-strong)]"
      >
        筛选
      </button>
      <Link
        href="/collection"
        className="flex h-11 items-center justify-center self-end border border-[var(--line)] px-5 text-sm text-[var(--muted)] transition-colors duration-300 hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
      >
        重置
      </Link>
    </form>
  );
}
