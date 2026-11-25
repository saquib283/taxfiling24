export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import {
  FileText,
  Briefcase,
  Eye,
  Inbox,
  ArrowRight,
  Settings,
  PenSquare,
  HelpCircle,
  Calendar,
  Star,
  Download,
} from "lucide-react";
import Link from "next/link";

async function getStats() {
  try {
    const [
      totalArticles,
      totalServices,
      articleViews,
      totalInquiries,
      pendingInquiries,
      totalReviews,
      totalAppointments,
      pendingAppointments
    ] = await Promise.all([
      prisma.article.count({ where: { published: true } }),
      prisma.service.count(),
      prisma.article.aggregate({ _sum: { views: true } }),
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { status: { in: ["NEW", "PENDING"] } } }),
      prisma.review.count(),
      prisma.appointment.count().catch(() => 0),
      prisma.appointment.count({ where: { status: "PENDING" } }).catch(() => 0),
    ]);

    const recentArticles = await prisma.article.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, views: true, published: true, createdAt: true },
    });

    const recentInquiries = await prisma.inquiry.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, service: true, status: true, createdAt: true },
    });

    return {
      totalArticles,
      totalServices,
      totalViews: articleViews._sum.views || 0,
      totalInquiries,
      pendingInquiries,
      totalReviews,
      totalAppointments,
      pendingAppointments,
      recentArticles,
      recentInquiries,
    };
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return {
      totalArticles: 0,
      totalServices: 0,
      totalViews: 0,
      totalInquiries: 0,
      pendingInquiries: 0,
      totalReviews: 0,
      totalAppointments: 0,
      pendingAppointments: 0,
      recentArticles: [],
      recentInquiries: [],
    };
  }
}

export default async function AdminDashboard() {
  const currentUser = await requirePageRole(["ADMIN", "EDITOR", "VIEWER"]);
  const stats = await getStats();
  const isAdmin = currentUser.role === "ADMIN";

  const statCards = [
    { 
      title: "Consultations", 
      value: stats.totalAppointments, 
      badge: stats.pendingAppointments > 0 ? `${stats.pendingAppointments} Pending` : undefined,
      badgeColor: "bg-amber-100 text-amber-800",
      icon: Calendar, 
      color: "bg-indigo-50 text-indigo-600", 
      link: "/admin/appointments" 
    },
    { 
      title: "Inquiries", 
      value: stats.totalInquiries, 
      badge: stats.pendingInquiries > 0 ? `${stats.pendingInquiries} New` : undefined,
      badgeColor: "bg-orange-100 text-orange-800",
      icon: Inbox, 
      color: "bg-orange-50 text-orange-600", 
      link: "/admin/inquiries" 
    },
    { title: "Active Services", value: stats.totalServices, icon: Briefcase, color: "bg-blue-50 text-blue-600", link: "/admin/services" },
    { title: "Published Articles", value: stats.totalArticles, icon: FileText, color: "bg-sky-50 text-sky-600", link: "/admin/articles" },
    { title: "Total Article Views", value: stats.totalViews.toLocaleString(), icon: Eye, color: "bg-emerald-50 text-emerald-600", link: "/admin/articles" },
    { title: "Client Reviews", value: stats.totalReviews, icon: Star, color: "bg-yellow-50 text-yellow-600", link: "/admin/reviews" },
  ];

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Dashboard Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700">
              Live Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back to your corporate compliance, client engagements, and tax management workspace.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/appointments"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" /> Bookings Studio
          </Link>
          {isAdmin && (
            <a
              href="/api/admin/export?type=inquiries&format=csv"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" /> Export Leads
            </a>
          )}
        </div>
      </div>

      {/* Actionable Pending Banner */}
      {(stats.pendingAppointments > 0 || stats.pendingInquiries > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
            <p className="text-xs sm:text-sm font-semibold text-amber-900">
              Action Required: You have {stats.pendingAppointments} pending consultation{stats.pendingAppointments === 1 ? "" : "s"} and {stats.pendingInquiries} new client inquir{stats.pendingInquiries === 1 ? "y" : "ies"}.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {stats.pendingAppointments > 0 && (
              <Link
                href="/admin/appointments"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Review Bookings
              </Link>
            )}
            {stats.pendingInquiries > 0 && (
              <Link
                href="/admin/inquiries"
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                View Leads
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              href={card.link}
              key={i}
              className="bg-white p-5 rounded-2xl shadow-2xs border border-slate-200 flex items-center justify-between hover:border-indigo-300 hover:shadow-xs transition group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.title}</p>
                  {card.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-slate-900">{card.value}</p>
              </div>
              <div className={`p-3 rounded-2xl ${card.color} group-hover:scale-105 transition-transform`}>
                <Icon className="h-5 w-5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Articles */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent Articles</h2>
            <Link href="/admin/articles" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recentArticles.length === 0 ? (
              <p className="p-8 text-xs text-slate-500 text-center">No articles available yet.</p>
            ) : (
              stats.recentArticles.map((article: any) => (
                <div key={article.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="min-w-0 pr-4">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{article.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{new Date(article.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} &bull; {article.views} views</p>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${article.published ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                    {article.published ? "Published" : "Draft"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Inquiries */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent Leads</h2>
              <Link href="/admin/inquiries" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {stats.recentInquiries.length === 0 ? (
                <p className="p-8 text-xs text-slate-500 text-center">No inquiries yet.</p>
              ) : (
                stats.recentInquiries.map((inq: any) => (
                  <div key={inq.id} className="p-3.5 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{inq.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inq.status === "WON"
                          ? "bg-emerald-50 text-emerald-700"
                          : inq.status === "NEW" || inq.status === "PENDING"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-slate-100 text-slate-700"
                      }`}>{inq.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{inq.email}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-5">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Quick Navigation</h2>
            <div className="space-y-1.5">
              {[
                { href: "/admin/articles", label: "Articles & Insights", icon: FileText },
                { href: "/admin/services", label: "Service Portfolio", icon: Briefcase },
                { href: "/admin/content", label: "Website Content", icon: PenSquare },
                { href: "/admin/faqs", label: "FAQ Manager", icon: HelpCircle },
                { href: "/admin/calendar", label: "Compliance Calendar", icon: Calendar },
                ...(isAdmin ? [{ href: "/admin/settings", label: "Global Settings", icon: Settings }] : []),
              ].map((action: any) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50/60 hover:text-indigo-700 rounded-xl text-xs font-bold text-slate-700 transition"
                >
                  <span>{action.label}</span>
                  <action.icon className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
