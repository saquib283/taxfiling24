"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { Menu, Globe, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminLayoutProps {
  children: ReactNode;
}

const ROUTE_TITLES: Record<string, string> = {
  "/admin": "Dashboard Overview",
  "/admin/appointments": "Appointments & Bookings",
  "/admin/inquiries": "Leads & CRM Studio",
  "/admin/whatsapp": "WhatsApp Logs",
  "/admin/campaigns": "Email Campaigns",
  "/admin/campaigns/audience": "Audience & Leads",
  "/admin/content": "Website Content Manager",
  "/admin/articles": "Articles & Insights",
  "/admin/articles/create": "Draft New Article",
  "/admin/services": "Services Portfolio",
  "/admin/services/create": "Add New Service",
  "/admin/faqs": "FAQ Manager",
  "/admin/reviews": "Client Reviews & Ratings",
  "/admin/team": "Team Members",
  "/admin/calendar": "Compliance Calendar",
  "/admin/pricing": "Pricing Plans",
  "/admin/pages": "Static Pages",
  "/admin/settings": "Global Settings",
  "/admin/theme": "Theme & Styles",
  "/admin/integrations": "System Integrations",
  "/admin/seo": "SEO Manager",
  "/admin/code-injection": "Code Injection",
  "/admin/profile": "Profile & Security",
  "/admin/activity-log": "Audit Activity Log",
  "/admin/users": "User Accounts",
};

function getPageTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith("/admin/inquiries/")) {
    if (pathname.includes("/proposals/")) return "Quotation Studio";
    return "Lead Profile & Dossier";
  }
  if (pathname.startsWith("/admin/articles/")) return "Edit Article";
  if (pathname.startsWith("/admin/services/")) return "Edit Service";
  return "Administration Panel";
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50/60 overflow-hidden font-sans">
      {/* Desktop Sidebar Navigation */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl md:hidden"
            >
              <Sidebar onClose={() => setMobileSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 truncate">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                Admin
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                {getPageTitle(pathname)}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition shadow-2xs"
              title="Open public website in new tab"
            >
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span>Live Site</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>

            <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-200">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-2xs">
                A
              </div>
              <span className="text-xs font-bold text-slate-700 hidden sm:inline-block">
                Admin Desk
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Wrapper */}
        <main id="main" className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
