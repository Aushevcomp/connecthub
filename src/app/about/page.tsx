import type { Metadata } from "next";
import { AboutPage } from "@/components/marketing/AboutPage";

export const metadata: Metadata = {
  title: "О ConnectHub",
  description: "Как устроен ConnectHub, для кого он создаётся и какие продуктовые направления развиваются дальше.",
};

export default function About() {
  return <AboutPage />;
}
