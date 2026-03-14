import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import PreHeaderBar from "@/components/layout/PreHeaderBar";
import Navbar from "@/components/layout/Navbar";
import WhatsAppCTA from "@/components/layout/WhatsAppCTA";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={`${poppins.variable} ${poppins.className} antialiased`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <PreHeaderBar />
        <Navbar />
        <main id="main">{children}</main>
        <WhatsAppCTA />
      </body>
    </html>
  );
}
