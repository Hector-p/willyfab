import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "../components/reveal";
import { PlaceholderImage } from "../components/placeholder-image";
import { getPublicServices } from "../lib/public-content";

export const metadata: Metadata = {
  title: "Engineering Services",
  description: "Explore Willyfab Engineering's agro-processing, fabrication and industrial services.",
};

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default async function ServicesPage() {
  const serviceContent = await getPublicServices();
  const services = serviceContent.items;

  const groups = new Map<string, typeof services>();
  for (const service of services) {
    const group = groups.get(service.category) ?? [];
    group.push(service);
    groups.set(service.category, group);
  }

  return (
    <main className="wf-main">
      <section className="services-hero">
        <div className="services-hero-copy">
          <p className="wf-kicker"><span /> ENGINEERING &amp; FABRICATION</p>
          <h1>Capability for<br />the <em>work ahead.</em></h1>
          <p>Explore our services across agro-processing, industrial systems, fabrication, general contracting and trade.</p>
          <p>Each requirement is different. We work with clients to understand the application, scope and site context before confirming a suitable specification.</p>
        </div>
        <PlaceholderImage alt="Illustrative industrial production machinery" className="services-hero-image" src="/images/hero-03-industrial.jpg" />
      </section>

      {serviceContent.source === "development-preview" && <p className="public-preview-note">Development preview catalogue. Published service records will load from the API when configured.</p>}

      {groups.size > 0 && (
        <nav aria-label="Service categories" className="services-categories">
          {[...groups.keys()].map((category) => (
            <a href={`#${slugify(category)}`} key={category}>{category}</a>
          ))}
        </nav>
      )}

      <section className="services-index">
        <div className="services-index-inner">
          {[...groups.entries()].map(([category, items]) => (
            <div id={slugify(category)} key={category}>
              <Reveal className="services-group-head">
                <span>{String(items.length).padStart(2, "0")} SERVICES</span>
                <h2>{category}</h2>
              </Reveal>
              <div className="service-card-grid">
                {items.map((service, index) => (
                  <Reveal delay={index * 0.05} key={service.slug}>
                    <Link className="service-card" href={`/services/${service.slug}`}>
                      <span className="service-card-number">{service.number}</span>
                      <h3>{service.title}</h3>
                      <p>{service.summary}</p>
                      <span className="service-card-foot"><span>View service</span><ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.5} /></span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <p className="public-content-empty">
              {serviceContent.source === "unavailable"
                ? "Service information is temporarily unavailable. Please contact Willyfab Engineering directly."
                : "No services are currently published. Please contact Willyfab Engineering for current capabilities."}
            </p>
          )}
          {services.length > 0 && <p className="service-note">Capacity descriptions are reproduced as supplied by the company. Confirm units and specifications directly with Willyfab Engineering.</p>}
        </div>
      </section>
    </main>
  );
}
