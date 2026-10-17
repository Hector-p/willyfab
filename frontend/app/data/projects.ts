export type ProjectRecord = {
  slug: string;
  number: string;
  category: string;
  title: string;
  image: string;
  imageAlt: string;
  shortDescription: string;
  brief: string;
  scope: string;
  client: string | null;
  location: string | null;
  completion: string | null;
  isTemplate: boolean;
  imageIsPlaceholder: boolean;
};

export const projects: ProjectRecord[] = [
  {
    slug: "agro-processing-plant",
    number: "01",
    category: "AGRO-PROCESSING",
    title: "Project title to be supplied",
    image: "/images/hero-03-industrial.jpg",
    imageAlt: "Replaceable illustrative image for an agro-processing project record",
    shortDescription: "Add a verified project summary and approved project image.",
    brief: "Add the client-approved project brief, the production requirement and the operating context.",
    scope: "List only the work Willyfab Engineering completed on this project.",
    client: "Add client name only with approval.",
    location: "Add verified project location.",
    completion: "Add confirmed completion date or project period.",
    isTemplate: true,
    imageIsPlaceholder: true,
  },
  {
    slug: "industrial-systems",
    number: "02",
    category: "INDUSTRIAL SYSTEMS",
    title: "Project title to be supplied",
    image: "/images/hero-04-machinery.jpg",
    imageAlt: "Replaceable illustrative image for an industrial systems project record",
    shortDescription: "Add a verified equipment or industrial systems case study.",
    brief: "Add the approved project brief, process requirements and the site conditions.",
    scope: "Describe verified supply, installation, fabrication or commissioning work as applicable.",
    client: "Add client name only with approval.",
    location: "Add verified project location.",
    completion: "Add confirmed completion date or project period.",
    isTemplate: true,
    imageIsPlaceholder: true,
  },
  {
    slug: "fabrication-steelwork",
    number: "03",
    category: "FABRICATION & STEELWORK",
    title: "Project title to be supplied",
    image: "/images/hero-01-fabrication.jpg",
    imageAlt: "Replaceable illustrative image for a fabrication project record",
    shortDescription: "Add a verified fabrication project summary and approved photography.",
    brief: "Add the client-approved description of the fabrication requirement.",
    scope: "List the confirmed fabrication and metal work completed for the project.",
    client: "Add client name only with approval.",
    location: "Add verified project location.",
    completion: "Add confirmed completion date or project period.",
    isTemplate: true,
    imageIsPlaceholder: true,
  },
];