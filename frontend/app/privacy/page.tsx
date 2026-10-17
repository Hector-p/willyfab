import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy information for visitors contacting Willyfab Engineering.",
};

const sections = [
  {
    id: "information-you-provide",
    title: "Information you provide",
    body: [
      "If you contact Willyfab Engineering by phone, WhatsApp, email or another published channel, the information you provide is used to respond to your enquiry and discuss the requested services.",
      "If you send an enquiry through the online form on the Contact page, we collect the details you enter: your name, email address, phone number, company, the service you are interested in, and your message.",
    ],
  },
  {
    id: "how-enquiries-are-used",
    title: "How enquiries are used",
    body: [
      "Enquiries submitted through the online form are stored in Willyfab Engineering's inquiry records so that our team can review them and reply. We use these details for that purpose only.",
    ],
  },
  {
    id: "website-activity",
    title: "Website activity",
    body: [
      "This public site does not advertise analytics, advertising trackers or account registration. The hosting platform and embedded Google Maps may process technical request data under their own privacy terms.",
    ],
  },
  {
    id: "sharing-and-retention",
    title: "Sharing and retention",
    body: [
      "Contact information is not published on this website. Enquiry information should be retained only as needed to respond and manage the business relationship, subject to applicable legal requirements.",
    ],
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    body: [
      "Google Maps is embedded on the Contact page and may receive connection data when the map loads. Use of Google Maps is subject to Google's terms and privacy policy. External links, including WhatsApp and Instagram, are governed by those providers' terms.",
    ],
  },
  {
    id: "questions",
    title: "Questions",
    body: [],
  },
];

export default function PrivacyPage() {
  return (
    <main className="wf-main">
      <section className="page-hero">
        <p className="wf-kicker"><span /> LEGAL INFORMATION</p>
        <h1>Privacy, <em>plainly stated.</em></h1>
        <p className="page-hero-lede">How Willyfab Engineering handles information shared through this website.</p>
      </section>

      <section className="privacy-layout">
        <nav aria-label="On this page" className="privacy-toc">
          <span>ON THIS PAGE</span>
          {sections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>{section.title}</a>
          ))}
        </nav>

        <div className="privacy-article">
          {sections.map((section, index) => (
            <section className="privacy-section" id={section.id} key={section.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{section.title}</h2>
              {section.id === "questions" ? (
                <p>For privacy questions, contact <a href="mailto:willyfabengineering@gmail.com">willyfabengineering@gmail.com</a>.</p>
              ) : (
                section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
              )}
            </section>
          ))}
          <p className="privacy-notice">Last reviewed: 15 October 2026.</p>
        </div>
      </section>
    </main>
  );
}
