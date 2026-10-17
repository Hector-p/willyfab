"""Seed the supplied company service catalogue for local development only."""

from sqlalchemy import select

from app.database.session import SessionLocal
from app.models.service import Service

SERVICES = [
    {
        "slug": "palm-oil-processing",
        "number": "01",
        "title": "Automated palm oil processing",
        "category": "Agro-processing",
        "capacity": "1 ml–5 MT/hr, as supplied",
        "summary": (
            "Automated palm oil production systems configured around the processing requirement."
        ),
        "description": (
            "Willyfab Engineering supplies automated palm oil processing plants. "
            "Plant configuration and capacity are discussed against the intended operation "
            "and site requirements."
        ),
    },
    {
        "slug": "cassava-flour-garri-mills",
        "number": "02",
        "title": "Cassava flour & garri mills",
        "category": "Agro-processing",
        "capacity": "1–3 MT/hr",
        "summary": "Automated cassava processing systems for flour and garri production.",
        "description": (
            "Cassava flour and garri producing mills are designed around the required process "
            "flow, throughput and available site conditions."
        ),
    },
    {
        "slug": "animal-fish-feed-mills",
        "number": "03",
        "title": "Animal & fish feed mills",
        "category": "Agro-processing",
        "capacity": "1 ml–10 MT/hr, as supplied",
        "summary": "Complete automated feed milling systems for animal and fish feed production.",
        "description": (
            "Willyfab Engineering provides complete animal and fish feed mill systems. "
            "Required ingredients, output and site conditions guide project specification."
        ),
    },
    {
        "slug": "palm-kernel-oil-extraction",
        "number": "04",
        "title": "Palm kernel oil extraction",
        "category": "Agro-processing",
        "capacity": "10–100 MT/day",
        "summary": (
            "Palm kernel oil extraction plant solutions across a range of stated daily capacities."
        ),
        "description": (
            "Palm kernel oil extraction plants are specified to the required daily capacity and "
            "operating context, with project requirements confirmed during consultation."
        ),
    },
    {
        "slug": "industrial-auxiliaries",
        "number": "05",
        "title": "Industrial auxiliaries",
        "category": "Industrial systems",
        "capacity": "Steam boilers: 1 MT/hr",
        "summary": "Supporting equipment for industrial and processing operations.",
        "description": (
            "The industrial auxiliaries range includes steam boilers, bucket elevators, screw "
            "conveyors, industrial blowers, separation cyclones and pneumatic conveyor systems."
        ),
    },
    {
        "slug": "fabrication-steel-work",
        "number": "06",
        "title": "Fabrication & steel work",
        "category": "Fabrication",
        "summary": (
            "Fabricated metal work and equipment made to a project’s specified requirements."
        ),
        "description": (
            "Willyfab Engineering undertakes fabrication and metal work as specified or "
            "recommended for a project. Scope and technical requirements are established with "
            "the client."
        ),
    },
    {
        "slug": "general-contracting-trade",
        "number": "07",
        "title": "General contracting & trade",
        "category": "Contracting & trade",
        "summary": "General contracting and import and export of general goods.",
        "description": (
            "The company provides general contracting services and import and export of "
            "general goods."
        ),
    },
]


def seed_services() -> int:
    """Insert or update the supplied service catalogue and publish it for local preview."""
    with SessionLocal.begin() as session:
        count = 0
        for index, values in enumerate(SERVICES):
            service = session.scalar(select(Service).where(Service.slug == values["slug"]))
            if service is None:
                service = Service(**values, sort_order=index, is_published=True)
                session.add(service)
            else:
                for key, value in values.items():
                    setattr(service, key, value)
                service.sort_order = index
                service.is_published = True
            count += 1
    return count


if __name__ == "__main__":
    seeded = seed_services()
    print(f"Seeded {seeded} supplied services for development.")