import type { VolunteerProgram } from "@/lib/models";

export const volunteerContributionOptions = [
  "Spreading awareness",
  "Social media and outreach",
  "Event volunteering",
  "Education and community initiatives",
  "Fundraising and partnerships",
] as const;

export const volunteerPrograms: VolunteerProgram[] = [
  {
    id: "valora-community",
    slug: "community",
    title: "Valora Foundation Community",
    cardTitle: "Community Volunteer",
    description:
      "Join Valora Foundation’s volunteer community and contribute to future learning, outreach and community initiatives.",
    active: true,
  },
];

export function getVolunteerProgram(idOrSlug: string) {
  return volunteerPrograms.find(
    (program) => program.id === idOrSlug || program.slug === idOrSlug
  );
}
