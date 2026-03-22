import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import prisma from "@/lib/prisma";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

async function getSiteSettings() {
  try {
    const settings = await prisma.setting.findMany();
    return settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getSiteSettings();
  const title = theme.seo_home_title || "TaxFiling24 | Complete Business, Tax & Compliance Solutions";
  const description = theme.seo_home_description || "Your Trusted Partner for Business Registration, Taxation, Compliance & Financial Advisory. Serving Startups, MSMEs, NGOs, and Corporates across India with expert CA & CS consultancy services.";
  const ogImage = theme.seo_home_og_image || undefined;

  return {
    metadataBase: new URL("https://taxfiling24.com"),
    title,
    description,
    openGraph: {
      title,
      description,
      url: "https://taxfiling24.com",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getSiteSettings();

  const primary = theme.theme_primary || "#0A2540";
  const accent = theme.theme_accent || "#D4AF37";
  const radius = theme.theme_radius ? `${theme.theme_radius}rem` : "0.75rem";
  const fontFamily = theme.theme_font || "Outfit";
  const fontSize = theme.theme_font_size ? `${theme.theme_font_size}px` : "15px";
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

  // Code injection from admin
  const injectHead = theme.inject_head || "";
  const injectBody = theme.inject_body || "";
  const injectCss = theme.inject_css || "";
  const gaId = theme.ga_id || "";

  return (
    <html lang="en" className={outfit.variable}>
      <head>
        {fontFamily !== "Outfit" && (
          <link rel="stylesheet" href={googleFontUrl} />
        )}
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
          ${injectCss}
        `}</style>
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');` }} />
          </>
        )}
        {injectHead && <div dangerouslySetInnerHTML={{ __html: injectHead }} />}
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
        {injectBody && <div dangerouslySetInnerHTML={{ __html: injectBody }} />}
      </body>
    </html>
  );
}

