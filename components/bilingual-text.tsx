import type { ComponentPropsWithoutRef, ElementType } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";

type BilingualTextProps<T extends ElementType> = {
  as?: T;
  text: BilingualValue;
  className?: string;
  zhClassName?: string;
  enClassName?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function BilingualText<T extends ElementType = "div">({
  as,
  text,
  className,
  zhClassName,
  enClassName,
  ...props
}: BilingualTextProps<T>) {
  const Component = as ?? "div";

  return (
    <Component className={className} {...props}>
      <span className={zhClassName}>{text.zh}</span>
      <span className={enClassName}>{text.en}</span>
    </Component>
  );
}
