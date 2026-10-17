"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function SiteChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return children;
  }

  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}
