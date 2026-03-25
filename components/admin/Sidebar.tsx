"use client";

import Link from "next/link";
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
} from "lucide-react";

const menuSections = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/appointments", label: "Appointments", icon: Calendar },
      { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
      { href: "/admin/campaigns", label: "Campaigns", icon: Mail },
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

export default function Sidebar() {
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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">TaxFiling24</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">{role}</span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {filteredSections.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1.5">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                      {item.label}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          Logout
        </button>
      </div>
    </div>
  );
}
