import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="wf-footer">
      <Link aria-label="Willyfab Engineering home" className="wf-footer-brand" href="/">
        <img alt="" className="wf-footer-logo" height="42" src="/images/willyfab-logo.png" width="42" />
        <span>WILLYFAB <i>ENGINEERING</i></span>
      </Link>
      <p>Engineering, fabrication & industrial systems.<br />Owerri, Imo State, Nigeria.</p>
      <nav aria-label="Footer navigation">
        <Link href="/about">Company</Link>
        <Link href="/services">Services</Link>
        <Link href="/projects">Projects</Link>
        <Link href="/gallery">Gallery</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
      </nav>
      <a className="wf-instagram" href="https://instagram.com/will_yfab" rel="noreferrer" target="_blank">
        Instagram <ArrowUpRight aria-hidden="true" size={13} />
      </a>
      <span className="wf-footer-legal">RC 2975508 <i /> © {new Date().getFullYear()} Willyfab Engineering</span>
    </footer>
  );
}