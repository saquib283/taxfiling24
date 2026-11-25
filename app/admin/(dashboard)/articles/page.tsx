export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import Link from "next/link";
import { Plus, Edit, Eye, FileText, Calendar, BookOpen, ChevronRight, ExternalLink } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";

const getCategoryStyle = (category: string) => {
  const cat = category?.toUpperCase() || "";
  if (cat.includes("TAX")) return "bg-amber-50 text-amber-700 border-amber-100";
  if (cat.includes("REGISTRATION") || cat.includes("STARTUP") || cat.includes("ROC")) return "bg-indigo-50 text-indigo-700 border-indigo-100";
  if (cat.includes("GST") || cat.includes("COMPLIANCE") || cat.includes("PAYROLL")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (cat.includes("LEGAL") || cat.includes("AUDIT") || cat.includes("TRADEMARK")) return "bg-rose-50 text-rose-700 border-rose-100";
  return "bg-slate-100 text-slate-700 border-slate-200/60";
};

export default async function ArticlesListPage() {
  await requirePageRole(["ADMIN", "EDITOR", "VIEWER"]);

  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Articles & Insights</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {articles.length} posts
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Publish tax tips, compliance guidelines, company updates, or business registration articles.
          </p>
        </div>
        <Link 
          href="/admin/articles/create" 
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Article
        </Link>
      </div>

      {/* Main Articles Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {articles.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="p-4 bg-slate-50 rounded-2xl inline-block mb-4 border border-slate-200">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No articles found</h3>
            <p className="text-slate-400 text-xs mt-1 mb-5 leading-relaxed">
              Get started by drafting your first post. Share updates, guides, and tax tips with your users.
            </p>
            <Link 
              href="/admin/articles/create" 
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-98"
            >
              <Plus className="h-3.5 w-3.5" /> Create Article
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="p-4 pl-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Article Title</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Metrics</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 pr-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((article: any) => (
                  <tr key={article.id} className="hover:bg-slate-50/50 transition duration-150 text-sm">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {article.thumbnailUrl ? (
                            <img src={article.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-indigo-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate max-w-[280px] sm:max-w-md">{article.title}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                            <span>/{article.slug}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${getCategoryStyle(article.category)}`}>
                        {article.category?.toLowerCase().replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          {article.views || 0} views
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-300" />
                          {new Date(article.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        article.published 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${article.published ? "bg-emerald-500" : "bg-amber-400"}`} />
                        {article.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {article.slug && (
                          <Link 
                            href={`/articles/${article.slug}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View live article"
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition active:scale-95 cursor-pointer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                        <Link 
                          href={`/admin/articles/${article.id}`} 
                          title="Edit article"
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition active:scale-95 cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DeleteButton id={article.id} endpoint="/api/admin/articles" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
