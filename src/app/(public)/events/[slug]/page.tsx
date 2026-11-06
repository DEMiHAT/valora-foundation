import { notFound } from "next/navigation";

export const metadata = { title: "Event not found" };

export default function Event() {
  notFound();
}
