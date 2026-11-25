export const dynamic = "force-dynamic";

import PreHeaderBar from "@/components/layout/PreHeaderBar";
import Navbar from "@/components/layout/Navbar";
import SiteFooter from "@/components/sections/SiteFooter";
import ChatBot from "@/components/ChatBot";
import HtmlInjection from "@/components/seo/HtmlInjection";
import JsonLd, {
  localBusinessSchema,
  organizationSchema,
  webSiteSchema,
} from "@/components/seo/JsonLd";
import prisma from "@/lib/prisma";

import { getSettings, pickPublicSettings } from "@/lib/settings";
import { findManagedSection, getManagedPageSections } from "@/lib/managed-pages";
import { getSiteName } from "@/lib/seo";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  type NavbarContent = Parameters<typeof Navbar>[0]["content"];
  type FooterContent = Parameters<typeof SiteFooter>[0]["content"];
  type FooterNavbarContent = Parameters<typeof SiteFooter>[0]["navbarContent"];
  type ChatbotContent = Parameters<typeof ChatBot>[0]["content"];
  let settings = {};
  let services: { title: string; slug: string }[] = [];
  try {
    const [fetchedSettings, fetchedServices] = await Promise.all([
      getSettings(),
      prisma.service.findMany({
        select: {
          title: true,
          slug: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
    ]);
    settings = fetchedSettings;
    services = fetchedServices;
  } catch (error) {
    console.error("Failed to fetch global layout settings/services (DB offline):", error);
    try {
      settings = await getSettings(); // getSettings itself has try-catch
    } catch {}
  }
  const globalSections = getManagedPageSections("global", settings);
  const navbarContent =
    findManagedSection<Record<string, unknown>>(globalSections, "global.navbar")?.data as NavbarContent;
  const footerContent =
    findManagedSection<Record<string, unknown>>(globalSections, "global.footer")?.data as FooterContent;
  const chatbotContent =
    findManagedSection<Record<string, unknown>>(globalSections, "global.chatbot")?.data as ChatbotContent;

  const settingsRecord = settings as Record<string, string>;
  const publicSettings = pickPublicSettings(settingsRecord);
  const siteName = getSiteName(settingsRecord);
  const injectHead = settingsRecord.inject_head || "";
  const injectBody = settingsRecord.inject_body || "";
  const injectCss = (settingsRecord.inject_css || "")
    .replace(/[<>]/g, "")
    .replace(/@import\b/gi, "");
  const gaId = (settingsRecord.ga_id || "").trim().replace(/[^A-Za-z0-9_-]/g, "");

  return (
    <>
      {injectCss ? <style>{injectCss}</style> : null}
      {gaId ? (
        <>
          <link rel="preconnect" href="https://www.googletagmanager.com" />
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
            }}
          />
        </>
      ) : null}
      <HtmlInjection html={injectHead} />
      <JsonLd
        data={[
          organizationSchema(publicSettings),
          webSiteSchema(siteName),
          localBusinessSchema(publicSettings),
        ]}
      />
      <PreHeaderBar settings={publicSettings} />
      <Navbar settings={publicSettings} dynamicServices={services} content={navbarContent} />
      <main id="main">{children}</main>
      <SiteFooter settings={publicSettings} navbarContent={navbarContent as FooterNavbarContent} content={footerContent} />
      <ChatBot settings={publicSettings} content={chatbotContent} />
      <HtmlInjection html={injectBody} />
    </>
  );
}
