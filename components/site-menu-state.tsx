"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const SiteMenuContext = createContext<{
  open: boolean;
  setOpenPath: (path: string | null) => void;
} | null>(null);

export function SiteMenuProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath !== null && openPath === pathname;
  useEffect(() => {
    if (openPath !== null && openPath !== pathname) setOpenPath(null);
  }, [openPath, pathname]);

  return <SiteMenuContext.Provider value={{ open, setOpenPath }}>{children}</SiteMenuContext.Provider>;
}

export function useSiteMenu() {
  const menu = useContext(SiteMenuContext);
  if (!menu) throw new Error("Missing SiteMenuProvider");
  return menu;
}
