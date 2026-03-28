import PreHeaderBar from "@/components/layout/PreHeaderBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import ChatBot from "@/components/ChatBot";
import prisma from "@/lib/prisma";

import { getSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <>
      <PreHeaderBar settings={settings} />
      <Navbar settings={settings} dynamicServices={services} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
      <ChatBot />
    </>
  );
}
