import type { FoundationEvent, RegistrationField } from "@/lib/models";
import {
  internationalPortfolios,
  lokSabhaPortfolios,
  aippmPortfolios,
} from "./portfolios";
const fields: RegistrationField[] = [
  { key: "name", label: "Full Name", type: "text", required: true },
  {
    key: "institution",
    label: "School/Institution",
    type: "text",
    required: true,
  },
  { key: "class", label: "Class/Grade", type: "text", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "phone", label: "Contact Number", type: "tel", required: true },
  {
    key: "experience",
    label: "MUN experience",
    type: "select",
    required: true,
    options: ["Beginner", "Intermediate", "Experienced"],
  },
];
export const events: FoundationEvent[] = [
  {
    id: "valora-mun-2026",
    slug: "valora-mun",
    title: "Valora Model United Nations",
    shortTitle: "Valora MUN",
    type: "Conference",
    date: "2026-11-14T09:00:00+05:30",
    validUntil: "2026-11-14T23:59:59+05:30",
    venue: "To be announced",
    description:
      "A one-day Model United Nations conference with six committees and two training sessions. Beginners and experienced delegates are welcome.",
    tagline: "Model United Nations",
    categoryLabel: "committees",
    overview: {
      title: "Debate and diplomacy.",
      lead: "Represent a country or political perspective, debate policy and negotiate with other delegates.",
      paragraphs: [
        "Beginners and returning delegates receive general and committee-specific training before the conference.",
        "Join us on 14 November 2026 for a full day of committee participation, supported by two training sessions before the conference.",
      ],
    },
    summaryIncludes: [
      "2 training sessions",
      "Full committee participation",
      "Opening & closing ceremonies",
      "Lunch + 2 refreshments",
      "Complete delegate kit",
      "Official participation certificate",
    ],
    trainingNote:
      "One general training session and one committee-specific session are included. Session timings will be shared with registered delegates.",
    fee: 999,
    currency: "INR",
    preferenceCount: 3,
    fields,
    allocationRule: "ordered-preferences",
    idPrefix: "VM26",
    formEnvKey: "VALORA_MUN_FORM_URL",
    matrixApprovalEnvKey: "VALORA_MUN_MATRIX_APPROVED",
    categories: [
      {
        id: "who",
        name: "WHO",
        description:
          "World Health Organization",
        capacity: 30,
        portfolios: [...internationalPortfolios],
      },
      {
        id: "unga",
        name: "UNGA",
        description:
          "United Nations General Assembly",
        capacity: 30,
        portfolios: [...internationalPortfolios],
      },
      {
        id: "unhrc",
        name: "UNHRC",
        description:
          "United Nations Human Rights Council",
        capacity: 30,
        portfolios: [...internationalPortfolios],
      },
      {
        id: "lok-sabha",
        name: "Lok Sabha",
        description: "House of the People",
        capacity: 30,
        portfolios: lokSabhaPortfolios,
      },
      {
        id: "aippm",
        name: "AIPPM",
        description:
          "All India Political Parties Meet",
        capacity: 30,
        portfolios: aippmPortfolios,
      },
      {
        id: "unfccc",
        name: "UNFCCC",
        description:
          "United Nations Framework Convention on Climate Change",
        capacity: 30,
        portfolios: [...internationalPortfolios],
      },
    ],
    includes: [
      {
        title: "Learn before you lead",
        items: [
          "1 general MUN training session",
          "1 committee-specific training session",
        ],
      },
      {
        title: "The full conference",
        items: [
          "Opening and closing ceremonies",
          "Full committee participation",
        ],
      },
      {
        title: "Food & refreshments",
        items: ["Lunch", "2 snack / refreshment servings"],
      },
      {
        title: "Your delegate kit",
        items: [
          "Biodegradable pen, notebook and file",
          "Placard and delegate ID card",
        ],
      },
      { title: "Recognition", items: ["Official participation certificate"] },
    ],
    faqs: [
      {
        question: "Is this my first MUN? Am I welcome?",
        answer:
          "Absolutely. Beginners are welcome, and your fee includes a general MUN training session and a committee-specific session to help you prepare.",
      },
      {
        question: "How are committees and portfolios assigned?",
        answer:
          "Choose your committee preferences in the registration form. After your payment is verified, we check your choices in order and assign the next available portfolio. If all choices are full, our team will arrange an allocation.",
      },
      {
        question: "Where will the conference take place?",
        answer:
          "The venue is to be announced. Confirmed details will be shared on this page and with registered delegates.",
      },
      {
        question: "How do I pay?",
        answer:
          "Register on this website and pay securely through Razorpay using the payment methods available at checkout. Your payment is confirmed automatically.",
      },
      {
        question: "When will I receive my delegate ID?",
        answer:
          "After payment verification and committee allocation, your digital Valora E-ID will be issued with a secure verification QR.",
      },
      {
        question: "Can I choose a country or portfolio?",
        answer:
          "You can indicate your committee preferences. Portfolios are assigned in the predefined committee sequence and cannot be requested through the form.",
      },
      {
        question: "What are the cancellation and refund terms?",
        answer:
          "The cancellation and refund policy is displayed on the registration page before payment. Please review it along with the event terms before registering.",
      },
    ],
  },
];
export function getEvent(slugOrId: string) {
  return events.find((e) => e.slug === slugOrId || e.id === slugOrId);
}
export function formatFee(event: FoundationEvent) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: event.currency,
    maximumFractionDigits: 0,
  }).format(event.fee);
}
export function eventDate(event: FoundationEvent) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(event.date));
}
export function eventFormUrl(event: FoundationEvent): string | undefined {
  const value = process.env[event.formEnvKey];
  if (!value) return;
  try {
    const u = new URL(value);
    if (u.protocol === "https:") return u.toString();
  } catch {}
}
