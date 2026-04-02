import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
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
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var storedTheme = localStorage.getItem("connecthub-theme");
              var theme = storedTheme === "light" || storedTheme === "dark"
                ? storedTheme
                : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
              document.documentElement.dataset.theme = theme;
              document.documentElement.style.colorScheme = theme;
            } catch (error) {
              document.documentElement.dataset.theme = "dark";
              document.documentElement.style.colorScheme = "dark";
            }
          `}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
