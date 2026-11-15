"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  Briefcase,
  Settings,
  Palette,
  Shield,
  LogOut,
  LayoutDashboard,
  Star,
  Inbox,
  PenSquare,
  HelpCircle,
  Calendar,
  Users,
  FileCheck,
  DollarSign,
  Globe,
  Code,
  Lock,
  Activity,
  Mail,
  MessageSquare,
} from "lucide-react";

const menuSections = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/appointments", label: "Appointments", icon: Calendar },
      { href: "/admin/inquiries", label: "Leads & CRM", icon: Inbox },
      { href: "/admin/whatsapp", label: "WhatsApp Logs", icon: MessageSquare },
      { href: "/admin/campaigns", label: "Campaigns", icon: Mail },
      { href: "/admin/campaigns/audience", label: "Audience & Leads", icon: Users },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/content", label: "Website Content", icon: PenSquare },
      { href: "/admin/articles", label: "Articles", icon: FileText },
      { href: "/admin/services", label: "Services", icon: Briefcase },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/team", label: "Team Members", icon: Users },
      { href: "/admin/calendar", label: "Compliance Calendar", icon: Calendar },
      { href: "/admin/pricing", label: "Pricing Plans", icon: DollarSign },
      { href: "/admin/pages", label: "Static Pages", icon: FileCheck },
    ],
  },
  {
    title: "Configuration",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/theme", label: "Theme & Styles", icon: Palette },
      { href: "/admin/integrations", label: "Integrations", icon: Shield },
      { href: "/admin/seo", label: "SEO Manager", icon: Globe },
      { href: "/admin/code-injection", label: "Code Injection", icon: Code },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/profile", label: "Profile & Password", icon: Lock },
      { href: "/admin/activity-log", label: "Activity Log", icon: Activity },
      { href: "/admin/users", label: "User Management", icon: Users },
    ],
  },
];

import { useState, useEffect } from "react";
import { X as CloseIcon } from "lucide-react";

export default function Sidebar({ onClose, className = "" }: { onClose?: () => void; className?: string }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("ADMIN");

  useEffect(() => {
    fetch("/api/admin/profile")
      .then(res => res.json())
      .then(data => { if (data.role) setRole(data.role); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const filteredSections = menuSections.map(section => {
    if (role === "EDITOR") {
      if (section.title === "Configuration" || section.title === "System") return null;
    }
    return section;
  }).filter(Boolean) as typeof menuSections;

  return (
    <div className={`w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 ${className}`}>
      {/* Sidebar Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
        <Link href="/admin" onClick={onClose} className="flex items-center gap-2">
          <Image
            src="/brand-logo.png"
            alt="TaxFiling24"
            width={140}
            height={48}
            unoptimized
            className="h-9 w-auto object-contain"
            priority
          />
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            {role}
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg md:hidden"
            aria-label="Close menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {filteredSections.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-1.5">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href} onClick={onClose}>
                    <motion.div
                      whileHover={{ x: 3 }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                      <span className="truncate">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3.5 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 w-full transition cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
