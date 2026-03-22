export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
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
  Users,
  Star,
  Download,
} from "lucide-react";
import Link from "next/link";

async function getStats() {
  const [totalArticles, totalServices, articleViews, totalInquiries, pendingInquiries, totalReviews, totalFaqs, totalTeam] = await Promise.all([
    prisma.article.count(),
    prisma.service.count(),
    prisma.article.aggregate({ _sum: { views: true } }),
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: "PENDING" } }),
    prisma.review.count(),
    prisma.fAQ.count(),
    prisma.teamMember.count(),
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
    totalFaqs,
    totalTeam,
    recentArticles,
    recentInquiries,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { title: "Total Articles", value: stats.totalArticles, icon: FileText, color: "bg-blue-50 text-blue-600", link: "/admin/articles" },
    { title: "Active Services", value: stats.totalServices, icon: Briefcase, color: "bg-indigo-50 text-indigo-600", link: "/admin/services" },
    { title: "Article Views", value: stats.totalViews, icon: Eye, color: "bg-green-50 text-green-600", link: "/admin/articles" },
    { title: "Pending Inquiries", value: stats.pendingInquiries, icon: Inbox, color: "bg-orange-50 text-orange-600", link: "/admin/inquiries" },
    { title: "Total Reviews", value: stats.totalReviews, icon: Star, color: "bg-yellow-50 text-yellow-600", link: "/admin/reviews" },
    { title: "Team Members", value: stats.totalTeam, icon: Users, color: "bg-purple-50 text-purple-600", link: "/admin/team" },
  ];

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back to your content management workspace.</p>
        </div>
        <a href="/api/admin/export?type=inquiries&format=csv" className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors">
          <Download className="h-4 w-4" /> Export Leads CSV
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link href={card.link} key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Articles */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Articles</h2>
            <Link href="/admin/articles" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentArticles.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 text-center">No articles available yet.</p>
            ) : (
              stats.recentArticles.map((article: any) => (
                <div key={article.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{article.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{new Date(article.createdAt).toLocaleDateString()} • {article.views} views</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${article.published ? "bg-green-50 text-green-600 border-green-200" : "bg-yellow-50 text-yellow-600 border-yellow-200"}`}>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Inquiries</h2>
              <Link href="/admin/inquiries" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {stats.recentInquiries.length === 0 ? (
                <p className="p-6 text-sm text-gray-500 text-center">No inquiries yet.</p>
              ) : (
                stats.recentInquiries.map((inq: any) => (
                  <div key={inq.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{inq.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        inq.status === "PENDING" ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"
                      }`}>{inq.status}</span>
                    </div>
                    <p className="text-xs text-gray-400">{inq.email}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: "/admin/articles", label: "Create Article", icon: FileText },
                { href: "/admin/services", label: "Add Service", icon: Briefcase },
                { href: "/admin/content", label: "Edit Homepage", icon: PenSquare },
                { href: "/admin/faqs", label: "Manage FAQs", icon: HelpCircle },
                { href: "/admin/calendar", label: "Add Deadline", icon: Calendar },
                { href: "/admin/settings", label: "Settings", icon: Settings },
              ].map((action: any) => (
                <Link key={action.href} href={action.href} className="w-full flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                  <span>{action.label}</span>
                  <action.icon className="h-4 w-4 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
