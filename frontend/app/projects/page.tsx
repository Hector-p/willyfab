import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "../components/reveal";
import { getPublicProjects } from "../lib/public-content";

export const metadata: Metadata = {
  title: "Projects",
  description: "Project portfolio for Willyfab Engineering.",
};

export const revalidate = 60;

export default async function ProjectsPage() {
  const projectContent = await getPublicProjects();
  const projects = projectContent.items;

  return (
    <main className="wf-main">
      <section className="projects-hero is-dark">
        <div className="projects-hero-inner">
          <p className="wf-kicker"><span /> PROJECT ARCHIVE</p>
          <h1>Built work.<br /><em>Clear record.</em></h1>
          <p>Selected work across agro-processing, industrial systems and fabrication.</p>
          <Link className="wf-text-link is-dark" href="#project-records">Explore records <ArrowDownRight aria-hidden="true" size={15} /></Link>
          <div className="projects-hero-meta">
            <div><span>BASED IN</span><strong>Owerri, Nigeria</strong></div>
            <div><span>RECORDS</span><strong>{String(projects.length).padStart(2, "0")}</strong></div>
          </div>
        </div>
      </section>

      <section className="projects-board" id="project-records">
        <div className="projects-board-inner">
          <div className="projects-board-heading">
            <p className="wf-kicker"><span /> {projectContent.source === "api" ? "PUBLISHED PROJECTS" : "CASE STUDY TEMPLATES"}</p>
            <span>{projectContent.source === "api" ? `${projects.length} PUBLISHED` : "REPLACE WITH APPROVED RECORDS"}</span>
          </div>
          <p className="projects-board-intro">
            {projectContent.source === "development-preview"
              ? "These are development templates. Replace with confirmed project names, scope, locations, dates and company-approved photographs before launch."
              : projectContent.source === "unavailable"
                ? "Project records are temporarily unavailable. Please contact Willyfab Engineering for current capabilities."
                : "Published project records from Willyfab Engineering."}
          </p>

          {projects.length > 0 ? (
            <>
              <div className="projects-grid">
                {projects.map((project, index) => (
                  <Reveal delay={index * 0.08} key={project.slug}>
                    <Link aria-label={`More info: ${project.title}`} className="project-card" href={`/projects/${project.slug}`}>
                      <div className="project-card-media">
                        <img alt={project.imageAlt} loading={index === 0 ? "eager" : "lazy"} src={project.image} />
                        <span className="project-card-index">{project.number}</span>
                        <span className="project-card-more">More info <ArrowUpRight aria-hidden="true" size={16} /></span>
                      </div>
                      <div className="project-card-body">
                        <span className="project-category-tag">{project.category}</span>
                        <h2>{project.title}</h2>
                        <p>{project.shortDescription}</p>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
              <div className="projects-board-foot">
                <span>01 — {String(projects.length).padStart(2, "0")}</span>
                <p>{projectContent.source === "development-preview" ? "Template records only. Replace with company-approved project information." : "Published project records."}</p>
                <Link className="wf-text-link" href="/contact">Discuss a project <ArrowUpRight aria-hidden="true" size={15} /></Link>
              </div>
            </>
          ) : (
            <div className="projects-no-records">
              <span>NO PUBLISHED PROJECT RECORDS</span>
              <p>When verified project details and approved images are added, they will appear here as case-study records.</p>
              <Link className="wf-text-link" href="/contact">Ask about our capabilities <ArrowUpRight aria-hidden="true" size={15} /></Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
