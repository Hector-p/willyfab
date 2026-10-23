export type Service = {
  slug: string;
  number: string;
  title: string;
  category: string;
  capacity?: string;
  summary: string;
  description: string;
};

export const services: Service[] = [
  {
    slug: "palm-oil-processing",
    number: "01",
    title: "Palm Oil Fabrication",
    category: "Agro Processing Fabrication",
    capacity: "1 ml–5 MT/hr, as supplied",
    summary: "Automated palm oil production systems configured around the processing requirement.",
    description: "Willyfab Engineering fabricates automated palm oil processing plants. Plant configuration and capacity are discussed against the intended operation and site requirements.",
  },
  {
    slug: "cassava-flour-garri-mills",
    number: "02",
    title: "Fabrication of Cassava Processing & Garri Mills (Small, Medium & Large)",
    category: "Agro Processing Fabrication",
    capacity: "1–3 MT/hr",
    summary: "Automated cassava processing systems for flour and garri production.",
    description: "Cassava flour and garri producing mills are designed around the required process flow, throughput and available site conditions.",
  },
  {
    slug: "animal-fish-feed-mills",
    number: "03",
    title: "Animal & fish feed mills",
    category: "Agro Processing Fabrication",
    capacity: "1 ml–10 MT/hr, as supplied",
    summary: "Complete automated feed milling systems for animal and fish feed production.",
    description: "Willyfab Engineering provides complete animal and fish feed mill systems. Required ingredients, output and site conditions guide project specification.",
  },
  {
    slug: "palm-kernel-oil-extraction",
    number: "04",
    title: "Fabrication of Palm Kernel Extraction Machines",
    category: "Agro Processing Fabrication",
    capacity: "10–100 MT/day",
    summary: "Palm kernel oil extraction plant solutions across a range of stated daily capacities.",
    description: "Palm kernel oil extraction plants are specified to the required daily capacity and operating context, with project requirements confirmed during consultation.",
  },
  {
    slug: "industrial-auxiliaries",
    number: "05",
    title: "Industrial auxiliaries",
    category: "Industrial Systems Fabrication",
    capacity: "Steam boilers: 1 MT/hr",
    summary: "Supporting equipment for industrial and processing operations.",
    description: "The industrial auxiliaries range includes steam boilers, bucket elevators, screw conveyors, industrial blowers, separation cyclones, pneumatic conveyor systems, garri graters, cabin dryers, blower machines, mixer machines, jaw crusher machines, oil grain extractor machines and block moulding machines.",
  },
  {
    slug: "fabrication-steel-work",
    number: "06",
    title: "Fabrication & steel work",
    category: "Fabrication",
    summary: "Fabricated metal work and equipment made to a project’s specified requirements.",
    description: "Willyfab Engineering undertakes fabrication and metal work as specified or recommended for a project. Scope and technical requirements are established with the client.",
  },
  {
    slug: "general-contracting-trade",
    number: "07",
    title: "General contracting & trade",
    category: "Contracting & trade",
    summary: "General contracting and import and export of general goods.",
    description: "The company provides general contracting services and import and export of general goods.",
  },
];