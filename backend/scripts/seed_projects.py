"""Seed three illustrative project records for local development only.

These records use the illustrative images in the frontend and generic descriptions.
Replace them with verified project details, client approval and real photographs
before publishing.
"""

from sqlalchemy import select

from app.database.session import SessionLocal
from app.models.project import Project

PROJECTS = [
    {
        "slug": "palm-oil-processing-line",
        "number": "01",
        "title": "Palm oil processing line",
        "category": "Agro-processing",
        "image_url": "/images/hero-04-machinery.jpg",
        "image_alt": "Illustrative production machinery for palm oil processing",
        "short_description": (
            "An automated palm oil processing line configured around the client's "
            "throughput and site conditions."
        ),
        "brief": (
            "The client required an automated line to process palm fruit consistently "
            "at a stated daily capacity, with equipment selected for the available site."
        ),
        "scope": (
            "Process design review, equipment supply, fabrication of supporting structures "
            "and commissioning support."
        ),
        "featured": True,
    },
    {
        "slug": "industrial-auxiliary-systems",
        "number": "02",
        "title": "Industrial auxiliary systems",
        "category": "Industrial systems",
        "image_url": "/images/hero-03-industrial.jpg",
        "image_alt": "Illustrative industrial auxiliary equipment",
        "short_description": (
            "Supporting equipment for an industrial processing operation, specified to "
            "the operating context."
        ),
        "brief": (
            "The operation needed auxiliary equipment that integrates with existing "
            "processing units without interrupting production."
        ),
        "scope": (
            "Requirement review, equipment specification, supply and installation "
            "coordination."
        ),
        "featured": True,
    },
    {
        "slug": "custom-steel-fabrication",
        "number": "03",
        "title": "Custom steel fabrication",
        "category": "Fabrication",
        "image_url": "/images/hero-01-fabrication.jpg",
        "image_alt": "Illustrative steel fabrication workshop",
        "short_description": (
            "Fabricated metal work and equipment made to a project's specified requirements."
        ),
        "brief": (
            "A project required fabricated steel components built to a specified drawing "
            "and finish standard."
        ),
        "scope": "Drawing review, cutting, forming, welding, finishing and delivery.",
        "featured": False,
    },
]


def seed_projects() -> int:
    """Insert or update the illustrative project records and publish them for local preview."""
    with SessionLocal.begin() as session:
        count = 0
        for index, values in enumerate(PROJECTS):
            project = session.scalar(select(Project).where(Project.slug == values["slug"]))
            if project is None:
                project = Project(**values, sort_order=index, is_published=True)
                session.add(project)
            else:
                for key, value in values.items():
                    setattr(project, key, value)
                project.sort_order = index
                project.is_published = True
            count += 1
    return count


if __name__ == "__main__":
    seeded = seed_projects()
    print(f"Seeded {seeded} illustrative project records for development.")
