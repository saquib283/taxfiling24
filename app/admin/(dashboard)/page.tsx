export const dynamic = 'force-dynamic';

import { PrismaClient } from "@prisma/client";
import { 
  FileText, 
  Briefcase, 
  Eye, 
  TrendingUp,
  ArrowRight,
  Settings
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const prisma = new PrismaClient();

async function getStats() {
  const [totalArticles, totalServices, articleViews] = await Promise.all([
    prisma.article.count(),
    prisma.service.count(),
    prisma.article.aggregate({
      _sum: { views: true }
    })
  ]);

  const recentArticles = await prisma.article.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      views: true,
      published: true,
      createdAt: true
    }
  });

  return {
    totalArticles,
    totalServices,
    totalViews: articleViews._sum.views || 0,
    recentArticles
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { 
      title: "Total Articles", 
      value: stats.totalArticles, 
      icon: FileText, 
      color: "bg-blue-50 text-blue-600",
      link: "/admin/articles"
    },
    { 
      title: "Active Services", 
      value: stats.totalServices, 
      icon: Briefcase, 
      color: "bg-indigo-50 text-indigo-600",
      link: "/admin/services"
    },
    { 
      title: "Total Article Views", 
      value: stats.totalViews, 
      icon: Eye, 
      color: "bg-green-50 text-green-600",
      link: "/admin/articles"
    },
    { 
      title: "Conversion Target", 
      value: "N/A", 
      icon: TrendingUp, 
      color: "bg-orange-50 text-orange-600",
      link: "/admin"
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back to your content management workspace.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Articles */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Articles</h2>
            <Link href="/admin/articles" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentArticles.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 text-center">No articles available yet.</p>
            ) : (
              stats.recentArticles.map((article) => (
                <div key={article.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{article.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(article.createdAt).toLocaleDateString()} • {article.views} views
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    article.published 
                      ? "bg-green-50 text-green-600 border-green-200" 
                      : "bg-yellow-50 text-yellow-600 border-yellow-200"
                  }`}>
                    {article.published ? "Published" : "Draft"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/admin/articles" className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
              <span>Create New Article</span>
              <FileText className="h-4 w-4 text-gray-400" />
            </Link>
            <Link href="/admin/services" className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
              <span>Add New Service</span>
              <Briefcase className="h-4 w-4 text-gray-400" />
            </Link>
            <Link href="/admin/theme" className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
              <span>Customize Theme</span>
              <Settings className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
