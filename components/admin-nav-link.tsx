"use client";

type AdminNavLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

declare global {
  interface Window {
    __zhujinjuAdminNavBypass?: boolean;
  }
}

export function AdminNavLink({ href, className, children }: AdminNavLinkProps) {
  function allowNavigation() {
    window.__zhujinjuAdminNavBypass = true;
    window.setTimeout(() => {
      window.__zhujinjuAdminNavBypass = false;
    }, 2000);
  }

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    allowNavigation();
    window.location.assign(href);
  }

  return (
    <a href={href} className={className} onMouseDown={allowNavigation} onClick={handleClick}>
      {children}
    </a>
  );
}
