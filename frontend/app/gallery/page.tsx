import type { Metadata } from "next";
import { PlaceholderImage } from "../components/placeholder-image";
import { Reveal } from "../components/reveal";
import { getPublicGallery } from "../lib/public-content";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Willyfab Engineering's fabrication and industrial gallery.",
};

const BENTO_CLASSES = ["gallery-tile-large", "gallery-tile-tall", "gallery-tile-wide", "gallery-tile-small"];

export default async function GalleryPage() {
  const gallery = await getPublicGallery();
  const featured = gallery.items.slice(0, BENTO_CLASSES.length);
  const more = gallery.items.slice(BENTO_CLASSES.length);

  return (
    <main className="wf-main">
      <section className="gallery-hero">
        <p className="wf-kicker"><span /> WORKSHOP / EQUIPMENT / DETAIL</p>
        <h1>Look <em>closer.</em></h1>
        <p className="gallery-hero-lede">Fabrication, equipment and engineering in context, through company-approved imagery.</p>
      </section>

      <div className="gallery-hero-band" aria-hidden="true">
        <span>Workshop</span><span>Engineering</span><span>Equipment</span><span>Detail</span>
      </div>

      {featured.length > 0 ? (
        <section className="gallery-bento">
          {featured.map((item, index) => (
            <Reveal key={item.id} className={`gallery-tile ${BENTO_CLASSES[index]}`} delay={index * 0.06}>
              <PlaceholderImage alt={item.imageAlt} src={item.imageUrl} />
            </Reveal>
          ))}
        </section>
      ) : (
        <p className="gallery-hero-lede">Photos are on their way. Check back soon.</p>
      )}

      {more.length > 0 && (
        <section className="gallery-more">
          {more.map((item, index) => (
            <Reveal key={item.id} className="gallery-tile gallery-tile-more" delay={(index % 3) * 0.06}>
              <PlaceholderImage alt={item.imageAlt} src={item.imageUrl} />
            </Reveal>
          ))}
        </section>
      )}
    </main>
  );
}
