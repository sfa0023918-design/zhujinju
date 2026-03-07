import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";

type ActionLabelProps = {
  text: BilingualValue;
  align?: "start" | "center";
};

export function ActionLabel({ text, align = "center" }: ActionLabelProps) {
  return (
    <BilingualText
      as="span"
      text={text}
      className={`flex flex-col ${align === "center" ? "items-center text-center" : "items-start text-left"}`}
      zhClassName="text-sm leading-none tracking-[0.01em]"
      enClassName="mt-1 text-[0.54rem] uppercase tracking-[0.16em] text-[var(--accent)]/76"
    />
  );
}
