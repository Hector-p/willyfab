"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { MaintenanceScreen } from "./maintenance-screen";

export function SiteChrome({
  header,
  footer,
  maintenance,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  maintenance: { message: string | null } | null;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return children;
  }

  if (maintenance) {
    return <MaintenanceScreen message={maintenance.message} />;
  }

  return (
    <>
      {header}
      {children}
      {footer}
    </>
  );
}
