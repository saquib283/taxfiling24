import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import {
  SITE_URL,
  buildPageMetadataFromSettings,
  getDefaultDescription,
  getSiteName,
  normalizeGoogleVerification,
} from "@/lib/seo";

export const viewport: Viewport = {
  themeColor: "#0A2540",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

async function getSiteSettings() {
  return getSettings();
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = getSiteName(settings);
  const homeMetadata = buildPageMetadataFromSettings(settings, "home", {
    description:
      "TaxFiling24 provides CA-led Income Tax (ITR) filing, GST registration & returns, company incorporation, ROC compliance, and Virtual CFO services across India.",
    path: "/",
    title: `${siteName} | Complete Business, Tax & Compliance Solutions`,
  });

  const googleVerification = normalizeGoogleVerification(settings.seo_google_verification);
  const bingVerification = settings.seo_other_verification?.trim() || undefined;

  return {
    ...homeMetadata,
    metadataBase: new URL(SITE_URL),
    title: {
      default: homeMetadata.title as string,
      template: `%s | ${siteName}`,
    },
    applicationName: siteName,
    authors: [{ name: siteName, url: SITE_URL }],
    creator: siteName,
    publisher: siteName,
    description:
      settings.seo_home_description?.trim() ||
      (typeof homeMetadata.description === "string" && homeMetadata.description) ||
      getDefaultDescription(settings),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icons/icon-48.png", type: "image/png", sizes: "48x48" },
        { url: "/icons/icon-96.png", type: "image/png", sizes: "96x96" },
        { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      ],
      shortcut: [{ url: "/favicon.ico" }],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.webmanifest",
    referrer: "origin-when-cross-origin",
    verification: {
      google: googleVerification,
      other: bingVerification
        ? {
            "msvalidate.01": bingVerification,
          }
        : undefined,
    },
    category: "finance",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getSiteSettings();

  const primary = /^#[0-9a-fA-F]{3,8}$/.test((theme.theme_primary || "").trim())
    ? theme.theme_primary.trim()
    : "#0A2540";
  const accent = /^#[0-9a-fA-F]{3,8}$/.test((theme.theme_accent || "").trim())
    ? theme.theme_accent.trim()
    : "#D4AF37";
  const parsedRadius = Number(theme.theme_radius);
  const radius =
    Number.isFinite(parsedRadius) && parsedRadius >= 0 && parsedRadius <= 1.5
      ? `${parsedRadius}rem`
      : "0.5rem";
  const fontFamily = (theme.theme_font || "Outfit").replace(/[^A-Za-z0-9 -]/g, "").trim() || "Outfit";
  const parsedFontSize = Number(theme.theme_font_size);
  const fontSize =
    Number.isFinite(parsedFontSize) && parsedFontSize >= 12 && parsedFontSize <= 22
      ? `${parsedFontSize}px`
      : "15px";
  const shadowStyle = theme.theme_shadow || "subtle";

  // Map shadow style to actual CSS values
  const shadowMap: Record<string, { sm: string; md: string; lg: string; xl: string }> = {
    none: {
      sm: "none",
      md: "none",
      lg: "none",
      xl: "none",
    },
    subtle: {
      sm: "0 2px 4px rgba(10, 37, 64, 0.04)",
      md: "0 4px 12px rgba(10, 37, 64, 0.06), 0 1px 2px rgba(10, 37, 64, 0.04)",
      lg: "0 12px 24px -4px rgba(10, 37, 64, 0.08), 0 4px 8px -2px rgba(10, 37, 64, 0.04)",
      xl: "0 24px 48px -12px rgba(10, 37, 64, 0.14), 0 10px 20px -6px rgba(10, 37, 64, 0.06)",
    },
    medium: {
      sm: "0 2px 6px rgba(10, 37, 64, 0.06)",
      md: "0 6px 16px rgba(10, 37, 64, 0.08), 0 2px 4px rgba(10, 37, 64, 0.04)",
      lg: "0 16px 32px -4px rgba(10, 37, 64, 0.1), 0 6px 12px -2px rgba(10, 37, 64, 0.06)",
      xl: "0 28px 56px -12px rgba(10, 37, 64, 0.16), 0 12px 24px -6px rgba(10, 37, 64, 0.08)",
    },
    elevated: {
      sm: "0 4px 8px rgba(10, 37, 64, 0.08)",
      md: "0 8px 24px rgba(10, 37, 64, 0.1), 0 4px 8px rgba(10, 37, 64, 0.06)",
      lg: "0 20px 48px -4px rgba(10, 37, 64, 0.14), 0 8px 16px -4px rgba(10, 37, 64, 0.08)",
      xl: "0 32px 64px -12px rgba(10, 37, 64, 0.2), 0 14px 28px -8px rgba(10, 37, 64, 0.1)",
    },
  };

  const shadows = shadowMap[shadowStyle] || shadowMap.subtle;
  const googleFontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;

  return (
    <html lang="en-IN" className={outfit.variable} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        {fontFamily !== "Outfit" ? (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontUrl} />
          </>
        ) : null}
        <style>{`
          :root {
            --primary: ${primary};
            --primary-hover: color-mix(in srgb, ${primary} 86%, white);
            --primary-soft: color-mix(in srgb, ${primary} 8%, white);
            --primary-border: color-mix(in srgb, ${primary} 18%, transparent);
            --accent: ${accent};
            --accent-ink: color-mix(in srgb, ${accent} 60%, black);
            --accent-light: color-mix(in srgb, ${accent} 72%, white);
            --accent-soft: color-mix(in srgb, ${accent} 11%, white);
            --radius: ${radius};
            --radius-sm: calc(${radius} * 0.5);
            --radius-md: calc(${radius} * 0.75);
            --radius-lg: ${radius};
            --radius-xl: calc(${radius} * 1.25);
            --radius-2xl: calc(${radius} * 1.5);
            --radius-3xl: calc(${radius} * 2);
            --font-body: '${fontFamily}', var(--font-outfit), system-ui, sans-serif;
            --font-size-base: ${fontSize};
            --shadow-sm: ${shadows.sm};
            --shadow: ${shadows.md};
            --shadow-md: ${shadows.md};
            --shadow-lg: ${shadows.lg};
            --shadow-xl: ${shadows.xl};
          }
          body {
            font-family: var(--font-body);
            font-size: var(--font-size-base);
          }
        `}</style>
      </head>
      <body className={`${outfit.variable} antialiased selection:bg-[var(--primary)] selection:text-white`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[var(--primary)] focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

