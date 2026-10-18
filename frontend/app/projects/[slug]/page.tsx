import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "../../components/reveal";
import { getPublicProject } from "../../lib/public-content";

type ProjectDetailProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProjectDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProject(slug);
  return { title: project ? `${project.category} project record` : "Project" };
}

export default async function ProjectDetailPage({ params }: ProjectDetailProps) {
  const { slug } = await params;
  const project = await getPublicProject(slug);
  if (!project) notFound();

  return (
    <main className="wf-main">
      <section className="project-detail-cover">
        <div className="project-detail-circle">
          <img alt={project.imageAlt} src={project.image} />
        </div>
        <div className="project-detail-titlebar">
          <div className="project-detail-titlebar-inner">
            <Link className="project-back-link" href="/projects"><ArrowLeft aria-hidden="true" size={15} /> All projects</Link>
            <div>
              <p className="wf-kicker"><span /> PROJECT RECORD · {project.number}</p>
              <span className="project-category-tag">{project.category}</span>
            </div>
            <h1>{project.title}</h1>
            {project.isTemplate && <p className="project-template-note">Development template · replace with verified project content</p>}
          </div>
        </div>
      </section>

      <section className="project-detail-body">
        <Reveal className="project-detail-body-copy">
          <p className="wf-kicker"><span /> PROJECT OVERVIEW</p>
          <h2>From requirement<br />to <em>delivered work.</em></h2>
          <p className="project-detail-brief">{project.brief}</p>
          {(project.isTemplate || project.imageIsPlaceholder) && <span className="project-detail-disclaimer">Replace template copy and illustrative imagery with approved, verified project information.</span>}
        </Reveal>
        <Reveal className="project-detail-scope" delay={0.1}>
          <p className="wf-kicker"><span /> SCOPE OF WORK</p>
          <h2>What was <em>done.</em></h2>
          <p>{project.scope}</p>
        </Reveal>
        <div className="project-facts" style={{ gridColumn: "1 / -1" }}>
          {project.client && <Reveal className="project-fact"><span>CLIENT</span><p>{project.client}</p></Reveal>}
          {project.location && <Reveal className="project-fact" delay={0.05}><span>LOCATION</span><p><MapPin aria-hidden="true" size={14} /> {project.location}</p></Reveal>}
          {project.completion && <Reveal className="project-fact" delay={0.1}><span>COMPLETION</span><p>{project.completion}</p></Reveal>}
          <Reveal className="project-fact" delay={0.15}><span>PROJECT TYPE</span><p>{project.category}</p></Reveal>
        </div>
      </section>

      <section className="cta-band">
        <div className="cta-band-copy">
          <p className="wf-kicker"><span /> HAVE A SIMILAR REQUIREMENT?</p>
          <h2>Let&apos;s discuss <em>your project.</em></h2>
        </div>
        <Link className="wf-button wf-button-light" href="/contact">Talk to Willyfab <ArrowUpRight aria-hidden="true" size={16} /></Link>
      </section>
    </main>
  );
}
