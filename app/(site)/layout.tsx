import PreHeaderBar from "@/components/layout/PreHeaderBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import ChatBot from "@/components/ChatBot";

import { getSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  return (
    <>
      <PreHeaderBar settings={settings} />
      <Navbar settings={settings} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
      <ChatBot />
    </>
  );
}
