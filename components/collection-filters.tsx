import Link from "next/link";

import { bt, formatInlineText } from "@/lib/bilingual";
import { filterOptions } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";

type CollectionFiltersProps = {
  current: {
    category?: string;
    region?: string;
    period?: string;
    material?: string;
  };
};

const filterFields = [
  { name: "category", label: bt("品类", "Category"), options: filterOptions.categories },
  { name: "region", label: bt("地区", "Region"), options: filterOptions.regions },
  { name: "period", label: bt("年代", "Period"), options: filterOptions.periods },
  { name: "material", label: bt("材质", "Material"), options: filterOptions.materials },
] as const;

export function CollectionFilters({ current }: CollectionFiltersProps) {
  return (
    <form
      action="/collection"
      className="grid gap-4 border-y border-[var(--line)] py-5 md:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]"
    >
      {filterFields.map((field) => (
        <label key={field.name} className="grid gap-2 text-sm text-[var(--muted)]">
          <BilingualText
            as="span"
            text={field.label}
            mode="inline"
            className="text-[var(--accent)]"
            zhClassName="text-[0.72rem] tracking-[0.18em]"
            enClassName="text-[0.5rem] uppercase tracking-[0.16em]"
          />
          <select
            name={field.name}
            defaultValue={current[field.name]}
            className="h-11 rounded-none border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          >
            <option value={filterOptions.all.zh}>{formatInlineText(filterOptions.all)}</option>
            {field.options.map((option) => (
              <option key={option.zh} value={option.zh}>
                {formatInlineText(option)}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button
        type="submit"
        className="h-11 self-end border border-[var(--line-strong)] px-5 text-sm text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface-strong)]"
      >
        筛选·Filter
      </button>
      <Link
        href="/collection"
        className="flex h-11 items-center justify-center self-end border border-[var(--line)] px-5 text-sm text-[var(--muted)] transition-colors duration-300 hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
      >
        重置·Reset
      </Link>
    </form>
  );
}
