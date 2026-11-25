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
      "Your trusted partner for business registration, taxation, compliance, and financial advisory services across India.",
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
    description: settings.seo_home_description || getDefaultDescription(settings),
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
    Number.isFinite(parsedRadius) && parsedRadius >= 0 && parsedRadius <= 3
      ? `${parsedRadius}rem`
      : "0.75rem";
  const fontFamily = (theme.theme_font || "Outfit").replace(/[^A-Za-z0-9 -]/g, "").trim() || "Outfit";
  const parsedFontSize = Number(theme.theme_font_size);
  const fontSize =
    Number.isFinite(parsedFontSize) && parsedFontSize >= 12 && parsedFontSize <= 22
      ? `${parsedFontSize}px`
      : "15px";
  const shadowStyle = theme.theme_shadow || "subtle";

  // Map shadow style to actual CSS values
  const shadowMap: Record<string, { sm: string; md: string; lg: string }> = {
    none: {
      sm: "none",
      md: "none",
      lg: "none",
    },
    subtle: {
      sm: "0 2px 4px rgba(10, 37, 64, 0.04)",
      md: "0 4px 12px rgba(10, 37, 64, 0.06), 0 1px 2px rgba(10, 37, 64, 0.04)",
      lg: "0 12px 24px -4px rgba(10, 37, 64, 0.08), 0 4px 8px -2px rgba(10, 37, 64, 0.04)",
    },
    medium: {
      sm: "0 2px 6px rgba(0, 0, 0, 0.06)",
      md: "0 6px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
      lg: "0 16px 32px -4px rgba(0, 0, 0, 0.1), 0 6px 12px -2px rgba(0, 0, 0, 0.06)",
    },
    elevated: {
      sm: "0 4px 8px rgba(0, 0, 0, 0.08)",
      md: "0 8px 24px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06)",
      lg: "0 20px 48px -4px rgba(0, 0, 0, 0.14), 0 8px 16px -4px rgba(0, 0, 0, 0.08)",
    },
  };

  const shadows = shadowMap[shadowStyle] || shadowMap.subtle;
  const googleFontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;

  return (
    <html lang="en-IN" className={outfit.variable}>
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
            --accent: ${accent};
            --radius: ${radius};
            --font-body: '${fontFamily}', var(--font-outfit), system-ui, sans-serif;
            --font-size-base: ${fontSize};
            --shadow-sm: ${shadows.sm};
            --shadow: ${shadows.md};
            --shadow-md: ${shadows.md};
            --shadow-lg: ${shadows.lg};
          }
          body {
            font-family: var(--font-body);
            font-size: var(--font-size-base);
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
        {children}
      </body>
    </html>
  );
}

