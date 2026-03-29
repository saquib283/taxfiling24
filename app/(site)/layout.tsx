import PreHeaderBar from "@/components/layout/PreHeaderBar";
import Navbar from "@/components/layout/Navbar";
import SiteFooter from "@/components/sections/SiteFooter";
import ChatBot from "@/components/ChatBot";
import prisma from "@/lib/prisma";

import { getSettings } from "@/lib/settings";
import { findManagedSection, getManagedPageSections } from "@/lib/managed-pages";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  type NavbarContent = Parameters<typeof Navbar>[0]["content"];
  type FooterContent = Parameters<typeof SiteFooter>[0]["content"];
  type FooterNavbarContent = Parameters<typeof SiteFooter>[0]["navbarContent"];
  type ChatbotContent = Parameters<typeof ChatBot>[0]["content"];
  const [settings, services] = await Promise.all([
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
  const globalSections = getManagedPageSections("global", settings);
  const navbarContent =
    findManagedSection<Record<string, unknown>>(globalSections, "global.navbar")?.data as NavbarContent;
  const footerContent =
    findManagedSection<Record<string, unknown>>(globalSections, "global.footer")?.data as FooterContent;
  const chatbotContent =
    findManagedSection<Record<string, unknown>>(globalSections, "global.chatbot")?.data as ChatbotContent;

  return (
    <>
      <PreHeaderBar settings={settings} />
      <Navbar settings={settings} dynamicServices={services} content={navbarContent} />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} navbarContent={navbarContent as FooterNavbarContent} content={footerContent} />
      <ChatBot settings={settings} content={chatbotContent} />
    </>
  );
}
