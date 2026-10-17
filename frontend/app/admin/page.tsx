import type { Metadata } from "next";

import { AdminConsole } from "./admin-console";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}
