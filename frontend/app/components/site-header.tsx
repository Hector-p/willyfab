"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="wf-header">
      <Link aria-label="Willyfab Engineering home" className="wf-brand" href="/" onClick={() => setMenuOpen(false)}>
        <img alt="" className="wf-brand-logo" height="48" src="/images/willyfab-logo.png" width="48" />
        <span className="wf-brand-wordmark">WILLYFAB<span>ENGINEERING</span></span>
      </Link>

      <nav aria-label="Main navigation" className="wf-nav wf-nav-desktop">
        {navigation.map((item) => (
          <Link aria-current={pathname === item.href ? "page" : undefined} href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <Link className="wf-header-cta" href="/contact">
        Discuss a project <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.8} />
      </Link>

      <button
        aria-controls="mobile-navigation"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        className="wf-menu-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        {menuOpen ? <X aria-hidden="true" size={21} /> : <Menu aria-hidden="true" size={21} />}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            animate={{ opacity: 1, y: 0 }}
            aria-label="Mobile navigation"
            className="wf-mobile-nav"
            exit={{ opacity: 0, y: -8 }}
            id="mobile-navigation"
            initial={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {navigation.map((item, index) => (
              <Link
                aria-current={pathname === item.href ? "page" : undefined}
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
                style={{ "--nav-order": index } as React.CSSProperties}
              >
                <span>0{index + 1}</span>{item.label}<ArrowUpRight aria-hidden="true" size={16} />
              </Link>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}