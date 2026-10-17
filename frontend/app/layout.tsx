import type { Metadata } from "next";
import { SiteChrome } from "./components/site-chrome";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import "./styles/main.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "Willyfab Engineering | Engineering, Fabrication & Industrial Systems",
    template: "%s | Willyfab Engineering",
  },
  description:
    "Willyfab Engineering provides general contracting, steel fabrication, agro-processing plants and industrial engineering services in Owerri, Nigeria.",
  icons: {
    icon: [{ url: "/images/willyfab-logo.png", type: "image/png" }],
    shortcut: ["/images/willyfab-logo.png"],
    apple: [{ url: "/images/willyfab-logo.png", type: "image/png" }],
  },
  openGraph: {
    title: "Willyfab Engineering",
    description:
      "Engineering, fabrication and processing systems made to move industry forward.",
    type: "website",
    locale: "en_NG",
    siteName: "Willyfab Engineering",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>
        <SiteChrome footer={<SiteFooter />} header={<SiteHeader />}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
