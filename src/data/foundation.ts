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
      name: "Dialogue & leadership",
      label: "IN DEVELOPMENT",
      description:
        "Practical opportunities to build communication, confidence and collaborative leadership.",
      status: "In development",
      href: "/initiatives#learning",
      icon: "globe",
    },
    {
      id: "learning",
      number: "02",
      name: "Learning & development",
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
  announcements: [] as { id: string; date: string; title: string; description: string; href: string }[],
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
