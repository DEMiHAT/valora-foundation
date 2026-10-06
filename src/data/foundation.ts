export const foundation = {
  name: "Valora Foundation",
  values: "Knowledge. Growth. Empathy.",
  mission:
    "Learning and leadership opportunities for young people, guided by knowledge, growth and empathy.",
  instagram: "https://www.instagram.com/valora_foundation/",
  initiatives: [
    {
      id: "dialogue",
      number: "01",
      name: "Dialogue & diplomacy",
      label: "OUR FIRST INITIATIVE",
      description:
        "Debate and negotiation at Valora MUN, with six committees and two training sessions.",
      status: "Launching November 2026",
      href: "/events/valora-mun",
      icon: "globe",
    },
    {
      id: "learning",
      number: "02",
      name: "Learning & leadership",
      label: "PLANNED",
      description:
        "Education and skills programmes for young people.",
      status: "In development",
      href: "/initiatives#learning",
      icon: "book",
    },
    {
      id: "community",
      number: "03",
      name: "Community & impact",
      label: "PLANNED",
      description:
        "Opportunities for young people to contribute to their communities.",
      status: "In development",
      href: "/initiatives#community",
      icon: "heart",
    },
  ],
  team: [] as { name: string; role: string; bio: string }[],
  partners: [] as { name: string; role: string; url: string; logo: string }[],
  announcements: [
    {
      id: "mun-launch",
      date: "2026-10-03",
      title: "Valora MUN — 14 November 2026",
      description:
        "Our inaugural conference brings six committees together on 14 November 2026.",
      href: "/events/valora-mun",
    },
  ],
  media: [
    {
      id: "vision",
      title: "The Valora vision",
      category: "FROM THE FOUNDATION",
      image: "/brand/vision.webp",
      description:
        "The foundation’s approach to learning and leadership.",
    },
    {
      id: "values",
      title: "Knowledge. Growth. Empathy.",
      category: "OUR IDENTITY",
      image: "/brand/values.webp",
      description:
        "The three values behind Valora Foundation.",
    },
  ],
};
