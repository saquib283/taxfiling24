import PreHeaderBar from "@/components/layout/PreHeaderBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import ChatBot from "@/components/ChatBot";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PreHeaderBar />
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <ChatBot />
    </>
  );
}
