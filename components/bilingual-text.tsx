import type { ComponentPropsWithoutRef, ElementType } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";

type BilingualTextProps<T extends ElementType> = {
  as?: T;
  text: BilingualValue;
  className?: string;
  zhClassName?: string;
  enClassName?: string;
  mode?: "stacked" | "inline";
  separator?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function BilingualText<T extends ElementType = "div">({
  as,
  text,
  className,
  zhClassName,
  enClassName,
  mode = "stacked",
  separator = " / ",
  ...props
}: BilingualTextProps<T>) {
  const Component = as ?? "div";

  if (mode === "inline") {
    return (
      <Component className={className} {...props}>
        <span className={zhClassName}>{text.zh}</span>
        <span aria-hidden="true" className="mx-1 opacity-50">
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
