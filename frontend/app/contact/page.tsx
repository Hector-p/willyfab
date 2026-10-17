import type { Metadata } from "next";
import { ArrowUpRight, Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { InquiryForm } from "../components/inquiry-form";
import { Reveal } from "../components/reveal";
import { apiBase, getPublicServices } from "../lib/public-content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Willyfab Engineering in Owerri, Imo State, Nigeria.",
};

const contactChannels = [
  {
    label: "PHONE / WHATSAPP",
    value: "+234 803 540 8843",
    href: "https://wa.me/2348035408843",
    icon: Phone,
    external: true,
  },
  {
    label: "EMAIL",
    value: "willyfabengineering@gmail.com",
    href: "mailto:willyfabengineering@gmail.com",
    icon: Mail,
    external: false,
  },
  {
    label: "INSTAGRAM",
    value: "@will_yfab",
    href: "https://instagram.com/will_yfab",
    icon: MessageCircle,
    external: true,
  },
];

const businessAddress = "No 6 Chief Obioma Uzor Crescent, Owerri, Imo State, Nigeria";
const encodedAddress = encodeURIComponent(businessAddress);
const mapEmbedUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

type ContactPageProps = {
  searchParams: Promise<{ service?: string | string[] }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { service } = await searchParams;
  const requestedService = Array.isArray(service) ? service[0] : service;
  const services = await getPublicServices();

  return (
    <main className="wf-main">
      <section className="contact-split">
        <div className="contact-info is-dark">
          <div className="contact-info-inner">
            <Reveal>
              <p className="wf-kicker">
                <span /> Contact Willyfab Engineering
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1>
                Let&apos;s get <em>to work.</em>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="contact-info-lede">
                Tell us what you are planning. Share the details, we will understand the requirement and suggest a
                practical next step.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="contact-channels">
                {contactChannels.map(({ label, value, href, icon: Icon, external }) => (
                  <a
                    className="contact-channel"
                    href={href}
                    key={label}
                    rel={external ? "noreferrer" : undefined}
                    target={external ? "_blank" : undefined}
                  >
                    <Icon aria-hidden="true" className="contact-channel-icon" size={22} strokeWidth={1.5} />
                    <span>
                      <span className="contact-channel-label">{label}</span>
                      <strong>{value}</strong>
                    </span>
                    <ArrowUpRight aria-hidden="true" size={18} />
                  </a>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="contact-address">
                <p className="contact-address-line">
                  <MapPin aria-hidden="true" size={18} />
                  <span>
                    No 6 Chief Obioma Uzor Crescent
                    <br />
                    Owerri, Imo State, Nigeria
                  </span>
                </p>
                <p className="contact-response">
                  <Clock3 aria-hidden="true" size={15} />
                  For a useful first conversation, include the equipment or service, capacity requirement and project
                  location.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="contact-form-panel">
          <div className="contact-form-card">
            <p className="wf-kicker">
              <span /> Project inquiry
            </p>
            <h2>Send us the brief.</h2>
            <p>Your details go straight to our team. We reply by email or phone, usually within one business day.</p>
            <InquiryForm
              apiBase={apiBase}
              initialService={requestedService ?? ""}
              services={services.items}
            />
          </div>
        </div>
      </section>

      <section aria-label="Map of our office" className="contact-map">
        <iframe
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapEmbedUrl}
          title="Google Map showing Willyfab Engineering at No 6 Chief Obioma Uzor Crescent, Owerri"
        />
        <a className="contact-map-bar" href={directionsUrl} rel="noreferrer" target="_blank">
          Open directions in Google Maps <ArrowUpRight aria-hidden="true" size={16} />
        </a>
      </section>
    </main>
  );
}
