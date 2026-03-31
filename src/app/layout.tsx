import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "ConnectHub — Социальная сеть для IT и стартапов",
  description: "Профессиональная социальная сеть для IT-специалистов, стартапов и бизнеса в СНГ. Посты, вакансии, опросы, нетворкинг.",
  keywords: ["социальная сеть", "IT", "стартапы", "вакансии", "нетворкинг", "СНГ"],
  openGraph: {
    title: "ConnectHub",
    description: "Профессиональная социальная сеть для IT и стартапов",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
