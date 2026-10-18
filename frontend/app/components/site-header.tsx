"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <header className="wf-header" ref={headerRef}>
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
        {menuOpen ? <X aria-hidden="true" size={24} strokeWidth={1.25} /> : <Menu aria-hidden="true" size={24} strokeWidth={1.25} />}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            animate={{ x: 0 }}
            aria-label="Mobile navigation"
            className="wf-mobile-nav"
            exit={{ x: "100%" }}
            id="mobile-navigation"
            initial={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {navigation.map((item) => (
              <Link
                aria-current={pathname === item.href ? "page" : undefined}
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
                <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.5} />
              </Link>
            ))}
            <Link className="wf-mobile-nav-cta" href="/contact" onClick={() => setMenuOpen(false)}>
              Discuss a project
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}