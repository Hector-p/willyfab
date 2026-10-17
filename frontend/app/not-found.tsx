import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="wf-main not-found">
      <p className="not-found-code" aria-hidden="true">404</p>
      <div>
        <p className="wf-kicker"><span /> PAGE NOT FOUND</p>
        <h1>This page isn&apos;t <em>on the drawing board.</em></h1>
        <p>The address may have changed, or the page may not exist.</p>
        <div className="not-found-links">
          <Link className="wf-button wf-button-forest" href="/">Return to homepage <ArrowUpRight aria-hidden="true" size={16} /></Link>
          <Link className="wf-text-link" href="/services">Browse services</Link>
        </div>
      </div>
    </main>
  );
}
