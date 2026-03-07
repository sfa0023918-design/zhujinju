import Link from "next/link";

import { bt, formatInlineText } from "@/lib/bilingual";
import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { ActionLabel } from "./action-label";
import { BilingualText } from "./bilingual-text";

type CollectionFiltersProps = {
  current: {
    category?: string;
    region?: string;
    period?: string;
    material?: string;
  };
  options: {
    all: BilingualValue;
    categories: BilingualValue[];
    regions: BilingualValue[];
    periods: BilingualValue[];
    materials: BilingualValue[];
  };
};

export function CollectionFilters({ current, options }: CollectionFiltersProps) {
  const filterFields = [
    { name: "category", label: bt("品类", "Category"), options: options.categories },
    { name: "region", label: bt("地区", "Region"), options: options.regions },
    { name: "period", label: bt("年代", "Period"), options: options.periods },
    { name: "material", label: bt("材质", "Material"), options: options.materials },
  ] as const;

  return (
    <form
      action="/collection"
      className="grid gap-4 border-y border-[var(--line)] py-5 md:grid-cols-[repeat(4,minmax(0,1fr))_minmax(280px,0.9fr)]"
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
            <option value={options.all.zh}>{formatInlineText(options.all)}</option>
            {field.options.map((option) => (
              <option key={option.zh} value={option.zh}>
                {formatInlineText(option)}
              </option>
            ))}
          </select>
        </label>
      ))}
      <div className="grid gap-2 text-sm text-[var(--muted)]">
        <BilingualText
          as="span"
          text={bt("操作", "Actions")}
          mode="inline"
          className="text-[var(--accent)]"
          zhClassName="text-[0.72rem] tracking-[0.18em]"
          enClassName="text-[0.5rem] uppercase tracking-[0.16em]"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center border border-[var(--line-strong)] px-5 text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface-strong)]"
          >
            <ActionLabel text={bt("筛选结果", "Apply Filters")} />
          </button>
          <Link
            href="/collection"
            className="inline-flex h-11 items-center justify-center border border-[var(--line)] px-5 text-[var(--muted)] transition-colors duration-300 hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
          >
            <ActionLabel text={bt("重置筛选", "Reset Filters")} />
          </Link>
        </div>
      </div>
    </form>
  );
}
