import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { preload } from "react-dom";
import { Reveal } from "./components/reveal";
import { HeroSlideshow } from "./components/hero-slideshow";
import { landingSlides } from "./data/landing-slides";
import { getPublicProjects, getPublicServices } from "./lib/public-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  preload(landingSlides[0].src, { as: "image", fetchPriority: "high" });
  const [serviceContent, projectContent] = await Promise.all([getPublicServices(), getPublicProjects()]);
  const featuredServices = serviceContent.items.slice(0, 4);
  const featuredProjects = projectContent.items.filter((project) => !project.isTemplate).slice(0, 2);

  return (
    <main className="wf-main">
      <section className="home-hero">
        <div className="home-hero-copy">
          <Reveal><h1>Engineering<br />that gets to <em>work.</em></h1></Reveal>
          <Reveal delay={0.08}><p className="wf-kicker"><span /> OWERRI, NIGERIA <i>—</i> ENGINEERING & FABRICATION</p></Reveal>
          <Reveal delay={0.16}><p className="home-lede">From processing plants to precision steelwork, Willyfab builds practical systems for the work that matters.</p></Reveal>
          <Reveal delay={0.24}>
            <div className="home-hero-actions">
              <Link className="wf-button wf-button-forest" href="/services">Explore our services <ArrowDownRight aria-hidden="true" size={17} /></Link>
              <Link className="wf-text-link" href="/contact">Start a conversation <ArrowUpRight aria-hidden="true" size={15} /></Link>
            </div>
          </Reveal>
          <div className="home-credentials"><span>INCORPORATED 2019</span><i /><span>CAC RC 2975508</span></div>
        </div>
        <Reveal className="home-hero-slideshow-reveal" delay={0.12}>
          <HeroSlideshow />
        </Reveal>
      </section>

      <section className="home-intro">
        <div className="home-intro-copy">
          <p className="wf-kicker"><span /> OUR WORK, IN BRIEF</p>
          <h2>Built around the<br /><em>real job to be done.</em></h2>
        </div>
        <p>Willyfab Engineering is an Owerri-based company working across agro-processing equipment, industrial auxiliaries, general contracting and fabrication.</p>
        <Link aria-label="Read about Willyfab Engineering" className="circle-link" href="/about"><ArrowDownRight aria-hidden="true" size={20} /></Link>
      </section>

      <section className="home-services">
        <div className="home-services-heading">
          <div><p className="wf-kicker"><span /> OUR CAPABILITIES</p><h2>Technical range.<br /><em>Practical thinking.</em></h2></div>
          <Link className="wf-text-link" href="/services">All services <ArrowUpRight aria-hidden="true" size={15} /></Link>
        </div>
        <div className="home-service-list">
          {featuredServices.map((service) => (
            <Reveal className="home-service-reveal" delay={Number(service.number) * 0.04} key={service.slug}>
              <Link className="home-service-row" href={`/services/${service.slug}`}>
                <span className="home-service-number">{service.number}</span>
                <span className="home-service-name">{service.title}</span>
                <span className="home-service-category">{service.category}</span>
                <ArrowUpRight aria-hidden="true" className="home-service-arrow" size={19} strokeWidth={1.5} />
              </Link>
            </Reveal>
          ))}
          {featuredServices.length === 0 && (
            <p className="public-content-empty">
              {serviceContent.source === "unavailable"
                ? "Services are temporarily unavailable. Please contact Willyfab Engineering directly."
                : "Services are being prepared. Contact Willyfab Engineering to discuss your requirement."}
            </p>
          )}
        </div>
        {serviceContent.source === "development-preview" && <p className="public-preview-note">Development preview catalogue. Public service records load from the API when configured.</p>}
      </section>

      <section className="home-projects">
        <div className="home-projects-heading">
          <div><p className="wf-kicker"><span /> SELECTED PROJECTS</p><h2>Work in<br /><em>good detail.</em></h2></div>
          <Link className="wf-text-link" href="/projects">Project archive <ArrowUpRight aria-hidden="true" size={15} /></Link>
        </div>
        {featuredProjects.length > 0 ? (
          <div className="home-project-orbits">
            {featuredProjects.map((project, index) => (
              <Reveal className={index === 1 ? "home-project-orbit-2" : undefined} delay={index * 0.1} key={project.slug}>
                <Link aria-label={`More info: ${project.title}`} className="home-project-link" href={`/projects/${project.slug}`}>
                  <span className="home-project-image"><img alt={project.imageAlt} loading={index === 0 ? "eager" : "lazy"} src={project.image} /><span>More info <ArrowUpRight aria-hidden="true" size={15} /></span></span>
                  <span className="home-project-meta">{project.number} <i /> {project.category}</span>
                  <strong>{project.title}</strong>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="home-projects-empty">
            <span>{projectContent.source === "development-preview" ? "LOCAL PROJECT TEMPLATE" : "NO PUBLISHED PROJECTS"}</span>
            <p>{projectContent.source === "development-preview" ? "Development project examples are available in the full portfolio preview." : "Verified project records will appear here when published."}</p>
            <Link className="wf-text-link" href="/projects">View project archive <ArrowUpRight aria-hidden="true" size={15} /></Link>
          </div>
        )}
      </section>

      <section className="home-company">
        <div className="home-company-image" role="img" aria-label="Illustrative view of an industrial workshop"><span>ILLUSTRATIVE INDUSTRY IMAGE</span></div>
        <Reveal className="home-company-copy">
          <p className="wf-kicker"><span /> A COMPANY BUILT ON CRAFT</p>
          <h2>Good work is<br />never <em>accidental.</em></h2>
          <p>Since 2019, Willyfab Engineering has brought together competent technical professionals and an efficient administrative team to deliver work with care, integrity and attention to safety.</p>
          <Link className="wf-text-link is-dark" href="/about">Meet the company <ArrowUpRight aria-hidden="true" size={15} /></Link>
        </Reveal>
      </section>

      <section className="cta-band">
        <div className="cta-band-copy">
          <p className="wf-kicker"><span /> HAVE A REQUIREMENT?</p>
          <h2>Let&apos;s talk through the <em>details.</em></h2>
        </div>
        <Link className="wf-button wf-button-light" href="/contact">Contact Willyfab <ArrowUpRight aria-hidden="true" size={17} /></Link>
      </section>
    </main>
  );
}
