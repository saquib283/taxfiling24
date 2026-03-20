import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import prisma from "@/lib/prisma";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://taxfiling24.com"),
  title: "TaxFiling24 | Complete Business, Tax & Compliance Solutions",
  description:
    "Your Trusted Partner for Business Registration, Taxation, Compliance & Financial Advisory. Serving Startups, MSMEs, NGOs, and Corporates across India with expert CA & CS consultancy services.",
  openGraph: {
    title: "TaxFiling24 | Complete Business, Tax & Compliance Solutions",
    description:
      "Your Trusted Partner for Business Registration, Taxation, Compliance & Financial Advisory across India.",
    url: "https://taxfiling24.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaxFiling24 | Complete Business, Tax & Compliance Solutions",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dbSettings = await prisma.setting.findMany();
  const theme = dbSettings.reduce((acc: any, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  const primary = theme.theme_primary || "#0F4C81";
  const accent = theme.theme_accent || "#0088CC";
  const radius = theme.theme_radius ? `${theme.theme_radius}rem` : "1rem";

  return (
    <html lang="en" className={outfit.variable}>
      <head>
        <style>{`
          :root {
            --primary: ${primary};
            --accent: ${accent};
            --radius: ${radius};
          }
        `}</style>
      </head>
      <body className={`${outfit.variable} ${outfit.className} antialiased selection:bg-[var(--accent)] selection:text-white`}>
        {/* Ambient Background Glows */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] h-80 w-80 rounded-full bg-blue-400 opacity-[0.07] blur-[100px]" />
          <div className="absolute top-[40%] right-[10%] h-96 w-96 rounded-full bg-cyan-400 opacity-[0.08] blur-[120px]" />
          <div className="absolute bottom-[20%] left-[10%] h-64 w-64 rounded-full bg-indigo-400 opacity-[0.05] blur-[80px]" />
          <div className="absolute top-[70%] right-[15%] h-80 w-80 rounded-full bg-blue-300 opacity-[0.06] blur-[110px]" />
        </div>

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--primary)] focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}

