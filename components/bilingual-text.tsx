import type { ComponentPropsWithoutRef, ElementType } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";
import type { ReadingLocale } from "./bilingual-prose";

type BilingualTextProps<T extends ElementType> = {
  as?: T;
  text: BilingualValue;
  className?: string;
  zhClassName?: string;
  enClassName?: string;
  mode?: "stacked" | "inline" | "single";
  locale?: ReadingLocale;
  separator?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function BilingualText<T extends ElementType = "div">({
  as,
  text,
  className,
  zhClassName,
  enClassName,
  mode = "stacked",
  locale = "zh",
  separator = "·",
  ...props
}: BilingualTextProps<T>) {
  const Component = as ?? "div";

  if (mode === "single") {
    const value = locale === "en" ? text.en : text.zh;
    const singleClassName = locale === "en" ? enClassName : zhClassName;

    return (
      <Component className={className} {...props}>
        <span className={singleClassName}>{value}</span>
      </Component>
    );
  }

  if (mode === "inline") {
    return (
      <Component className={className} {...props}>
        <span className={zhClassName}>{text.zh}</span>
        <span aria-hidden="true" className="mx-[0.45em] opacity-40">
          {separator}
        </span>
        <span className={enClassName}>{text.en}</span>
      </Component>
    );
  }

  return (
    <Component className={className} {...props}>
      <span className={zhClassName}>{text.zh}</span>
      <span className={enClassName}>{text.en}</span>
    </Component>
  );
}
