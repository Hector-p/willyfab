import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, User } from "lucide-react";
import { Reveal } from "../components/reveal";
import { PlaceholderImage } from "../components/placeholder-image";
import { getPublicBoardMembers } from "../lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About the Company",
  description: "Learn about Willyfab Engineering, its mission, vision and values.",
};

const values = ["Professionalism", "Integrity", "Excellence", "Innovation", "Quality", "Safety", "Customer satisfaction", "Sustainability"];

export default async function AboutPage() {
  const board = await getPublicBoardMembers();

  return (
    <main className="wf-main">
      <section className="about-hero">
        <div className="about-hero-inner">
          <p className="wf-kicker"><span /> THE COMPANY · EST. 2019</p>
          <h1>Experience<br />with <em>purpose.</em></h1>
          <p>Professional expertise, reliable delivery and a commitment to doing the work properly.</p>
          <Link className="wf-text-link" href="#company-profile">Read our story <ArrowDownRight aria-hidden="true" size={16} /></Link>
          <div className="about-hero-facts">
            <div><span>INCORPORATED</span><strong>17 Sept 2019</strong></div>
            <div><span>REGISTRATION</span><strong>CAC RC 2975508</strong></div>
            <div><span>BASED IN</span><strong>Owerri, Imo State</strong></div>
          </div>
        </div>
        <div className="about-hero-band">
          <PlaceholderImage alt="Kernel silo with dryer at an operational unit" src="/images/hero-02-engineering.jpg" />
        </div>
      </section>

      <section className="about-story" id="company-profile">
        <Reveal className="about-story-aside">
          <p className="wf-kicker"><span /> WHO WE ARE</p>
          <h2>A practical partner for industry.</h2>
          <p className="about-story-note">CORPORATE AFFAIRS COMMISSION<br />RC 2975508</p>
        </Reveal>
        <Reveal className="about-story-copy" delay={0.1}>
          <p>WILLYFAB ENGINEERING is a duly registered engineering company incorporated on 17 September 2019 with Nigeria&apos;s Corporate Affairs Commission (CAC), under the provisions of the Companies and Allied Matters Act.</p>
          <p>Since its establishment, the company has maintained professional relationships with a diverse range of clients, delivering engineering services in line with industry standards and professional ethics.</p>
          <p>Our competent, experienced technical professionals work alongside efficient administrative personnel. Together, the team brings the capacity and expertise to execute projects to a high professional standard.</p>
          <p>We aim to provide dependable, cost-effective and sustainable solutions while maintaining quality, safety, integrity and professionalism in every engagement.</p>
        </Reveal>
      </section>

      <section className="about-purpose">
        <Reveal className="about-purpose-mission">
          <p className="wf-kicker"><span /> 01 · MISSION</p>
          <h2>Our <em>mission.</em></h2>
          <p>To provide reliable, innovative, cost-effective and high-quality engineering services through professional expertise, modern technology, adherence to international standards, and a commitment to client satisfaction, safety and sustainable development.</p>
        </Reveal>
        <Reveal className="about-purpose-vision" delay={0.08}>
          <p className="wf-kicker"><span /> 02 · VISION</p>
          <h2>Our <em>vision.</em></h2>
          <p>To become a leading and highly trusted engineering company, recognised for excellence, innovation, quality and sustainable solutions that contribute to the development of communities and industries.</p>
        </Reveal>
      </section>

      <section className="about-values">
        <div className="about-values-inner">
          <p className="wf-kicker"><span /> THE PRINCIPLES WE WORK BY</p>
          <ul className="about-values-grid">
            {values.map((value, index) => (
              <li key={value}><span>0{index + 1}</span>{value}</li>
            ))}
          </ul>
        </div>
      </section>

      {board.items.length > 0 && (
        <section className="about-board" aria-labelledby="about-board-heading">
          <div className="about-board-inner">
            <Reveal className="about-board-head">
              <p className="wf-kicker"><span /> LEADERSHIP</p>
              <h2 id="about-board-heading">Board of <em>members.</em></h2>
            </Reveal>
            <ul className="about-board-grid">
              {board.items.map((member, index) => (
                <li key={member.id}>
                  <Reveal className="board-card" delay={index * 0.06}>
                    <div className="board-portrait">
                      {member.imageUrl ? (
                        <img alt={member.imageAlt ?? member.name} loading="lazy" src={member.imageUrl} />
                      ) : (
                        <User aria-hidden="true" size={52} strokeWidth={1.2} />
                      )}
                    </div>
                    <h3>{member.name}</h3>
                    <p className="board-position">{member.position}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="cta-band">
        <div className="cta-band-copy">
          <p className="wf-kicker"><span /> READY TO DISCUSS A REQUIREMENT?</p>
          <h2>Bring us the <em>details.</em></h2>
        </div>
        <Link className="wf-button wf-button-light" href="/contact">Contact Willyfab <ArrowUpRight aria-hidden="true" size={17} /></Link>
      </section>
    </main>
  );
}
