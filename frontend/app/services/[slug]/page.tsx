import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "../../components/reveal";
import { getPublicService, getPublicServices } from "../../lib/public-content";

type ServiceDetailProps = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: ServiceDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublicService(slug);
  return { title: service?.title ?? "Service" };
}

export default async function ServiceDetailPage({ params }: ServiceDetailProps) {
  const { slug } = await params;
  const service = await getPublicService(slug);
  if (!service) notFound();

  const catalogue = await getPublicServices();
  const related = catalogue.items
    .filter((item) => item.slug !== service.slug && item.category === service.category)
    .slice(0, 3);

  return (
    <main className="wf-main">
      <section className="service-hero">
        <div className="service-hero-inner">
          <div>
            <p className="wf-kicker"><span /> {service.category.toUpperCase()}</p>
            <h1>{service.title}</h1>
            <p className="service-hero-lede">{service.summary}</p>
          </div>
          <dl className="service-spec">
            <div><dt>Category</dt><dd>{service.category}</dd></div>
            <div><dt>Reference</dt><dd>{service.number}</dd></div>
            {service.capacity && <div><dt>Stated capacity</dt><dd>{service.capacity}</dd></div>}
          </dl>
        </div>
      </section>

      <section className="service-body">
        <div className="service-body-aside">
          <Link className="back-link" href="/services"><ArrowLeft aria-hidden="true" size={15} /> All services</Link>
          <p className="wf-kicker"><span /> SERVICE OVERVIEW</p>
          <h2>Specified for the actual <em>operation.</em></h2>
          {service.capacity && <p className="capacity-note">Company-stated capacity: {service.capacity}</p>}
        </div>
        <Reveal className="service-body-copy" delay={0.1}>
          <p>{service.description}</p>
          <p>For a project discussion, share the intended application, required output, location and any available technical requirements. Willyfab Engineering can then discuss scope and next steps with you.</p>
          <Link className="wf-button wf-button-forest" href={`/contact?service=${service.slug}`}>Discuss this service <ArrowUpRight aria-hidden="true" size={16} /></Link>
        </Reveal>
      </section>

      <section className="service-detail-photo-wrap">
        <div aria-label="Illustrative image of industrial equipment" className="service-detail-photo" role="img" />
        <p className="service-note">Illustrative industry image. This is not represented as a Willyfab Engineering project.</p>
      </section>

      {related.length > 0 && (
        <section className="service-related">
          <div className="service-related-inner">
            <div className="service-related-heading">
              <p className="wf-kicker"><span /> RELATED IN {service.category.toUpperCase()}</p>
              <h2>Other services in this <em>category.</em></h2>
            </div>
            <div className="service-card-grid">
              {related.map((item, index) => (
                <Reveal delay={index * 0.05} key={item.slug}>
                  <Link className="service-card" href={`/services/${item.slug}`}>
                    <span className="service-card-number">{item.number}</span>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <span className="service-card-foot"><span>View service</span><ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.5} /></span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
