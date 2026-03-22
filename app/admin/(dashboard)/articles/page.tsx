export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Eye, FileText } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";



export default async function ArticlesListPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Articles</h1>
          <p className="text-gray-600">Manage your website blog posts and articles</p>
        </div>
        <Link href="/admin/articles/create" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">
          <Plus className="h-4 w-4" />
          Add Article
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {articles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="p-3 bg-gray-50 rounded-full inline-block mb-3">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No articles found.</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Get started by creating your first post.</p>
            <Link href="/admin/articles/create" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700">
              <Plus className="h-4 w-4" /> Create Article
            </Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold border-b border-gray-100">
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Stats</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {articles.map((article: any) => (
                <tr key={article.id} className="hover:bg-gray-50 text-sm">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{article.title}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">/{article.slug}</p>
                  </td>
                  <td className="p-4 capitalize text-gray-600 text-xs">
                    {article.category?.toLowerCase().replace(/_/g, " ")}
                  </td>
                  <td className="p-4 text-gray-600 text-xs flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-gray-400" /> {article.views} views
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      article.published 
                        ? "bg-green-50 text-green-600 border-green-200" 
                        : "bg-yellow-50 text-yellow-600 border-yellow-200"
                    }`}>
                      {article.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link href={`/admin/articles/${article.id}`} className="inline-flex p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <DeleteButton id={article.id} endpoint="/api/admin/articles" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
