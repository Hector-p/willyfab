export type GalleryItem = {
  id: number;
  title: string;
  category: string;
  imageUrl: string;
  imageAlt: string;
  caption: string | null;
  featured: boolean;
};

// Development-only preview. Production shows only photos published in the admin.
export const galleryPreview: GalleryItem[] = [
  {
    id: 1,
    title: "Fabrication workshop",
    category: "Fabrication",
    imageUrl: "/images/hero-01-fabrication.jpg",
    imageAlt: "Fabrication workshop",
    caption: null,
    featured: true,
  },
  {
    id: 2,
    title: "Kernel silo with dryer",
    category: "Installation",
    imageUrl: "/images/hero-02-engineering.jpg",
    imageAlt: "Kernel silo with dryer at an operational unit",
    caption: null,
    featured: true,
  },
  {
    id: 3,
    title: "Industrial equipment",
    category: "Equipment",
    imageUrl: "/images/hero-03-industrial.jpg",
    imageAlt: "Industrial equipment",
    caption: null,
    featured: false,
  },
  {
    id: 4,
    title: "Fabricators and machines",
    category: "Engineering",
    imageUrl: "/images/hero-04-machinery.jpg",
    imageAlt: "Sketch of Willyfab fabricators and industrial machines",
    caption: null,
    featured: false,
  },
];
