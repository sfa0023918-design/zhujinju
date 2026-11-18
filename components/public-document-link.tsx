import type { ComponentPropsWithoutRef } from "react";

// These exhibition and artwork destinations can display their server-rendered
// content while the browser is still fetching their interactive controls.
export function PublicDocumentLink(props: ComponentPropsWithoutRef<"a">) {
  return <a {...props} />;
}
