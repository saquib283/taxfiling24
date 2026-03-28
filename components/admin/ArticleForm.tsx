"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Save, ArrowLeft, Eye, Edit3, Upload, Sparkles, X, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "./RichTextEditor";

interface ArticleFormProps {
  article?: any;
  isEdit?: boolean;
}

const CATEGORIES = [
  "BUSINESS_REGISTRATION", "INCOME_TAX_FILING", "GST_COMPLIANCE", 
  "ACCOUNTING_BOOKKEEPING", "AUDIT_ASSURANCE", "TRADEMARK_IP", 
  "LEGAL_AGREEMENTS", "ROC_COMPLIANCE", "CORPORATE_INVESTIGATION", 
  "STARTUP_FUNDING", "CERTIFICATIONS_ISO", "E_COMMERCE_BANKING", 
  "PAYROLL_PF_ESI", "NRI_TAXATION", "GENERAL_UPDATES"
];

export default function ArticleForm({ article, isEdit = false }: ArticleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiSeoLoading, setAiSeoLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [formData, setFormData] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    content: article?.content || "",
    excerpt: article?.excerpt || "",
    category: article?.category || "GENERAL_UPDATES",
    tags: article?.tags ? article.tags.join(", ") : "",
    readTime: article?.readTime || 5,
    isFeatured: article?.isFeatured || false,
    metaTitle: article?.metaTitle || "",
    metaDescription: article?.metaDescription || "",
    published: article?.published || false,
    thumbnailUrl: article?.thumbnailUrl || "",
  });

  // Auto-calculate read time from content
  const autoReadTime = useMemo(() => {
    const text = formData.content.replace(/<[^>]*>/g, "");
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [formData.content]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: isEdit ? prev.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const tagsArray = formData.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean);
    const payload = {
      ...formData,
      tags: tagsArray,
      readTime: autoReadTime,
    };

    try {
      const url = isEdit ? `/api/admin/articles/${article.id}` : "/api/admin/articles";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin/articles");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save article");
      }
    } catch (err) {
      setError("Something went wrong saving the article.");
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(p => ({ ...p, thumbnailUrl: data.url }));
      } else {
        const data = await res.json();
        setToast({ message: data.error || "Failed to upload thumbnail", type: "error" });
      }
    } catch (err: any) {
      setToast({ message: `Upload error: ${err.message}`, type: "error" });
    }
  };

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) return;

    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title, topic: aiTopic.trim(), category: formData.category })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setFormData(p => ({ ...p, content: data.reply }));
        setAiModalOpen(false);
        setAiTopic("");
      } else {
        setToast({ message: data.error || "Failed to generate AI content", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Something went wrong with AI generation", type: "error" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIGenerateSEO = async () => {
    setAiSeoLoading(true);
    try {
      const res = await fetch("/api/admin/ai/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title, content: formData.content })
      });

      const data = await res.json();
      if (res.ok && data.metaTitle && data.metaDescription) {
        setFormData(p => ({ 
          ...p, 
          metaTitle: data.metaTitle, 
          metaDescription: data.metaDescription 
        }));
      } else {
        setToast({ message: data.error || "Failed to generate SEO suggestions", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Something went wrong with AI SEO generation", type: "error" });
    } finally {
      setAiSeoLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/articles" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Article" : "Create Article"}</h1>
            <p className="text-xs text-gray-400 mt-0.5">~{autoReadTime} min read • {formData.content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length} words</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              previewMode
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {previewMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {previewMode ? "Edit" : "Preview"}
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Article"}
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {previewMode ? (
        /* ─── Preview Mode ─── */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {formData.thumbnailUrl && (
            <div className="aspect-video bg-gray-100">
              <img src={formData.thumbnailUrl} alt={formData.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                {formData.category.replace(/_/g, " ")}
              </span>
              {formData.isFeatured && (
                <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full text-xs font-medium">
                  Featured
                </span>
              )}
              <span className="text-xs text-gray-400">~{autoReadTime} min read</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{formData.title || "Untitled Article"}</h1>
            {formData.excerpt && (
              <p className="text-lg text-gray-500 mb-6 leading-relaxed">{formData.excerpt}</p>
            )}
            <div className="h-px bg-gray-100 mb-6" />
            <div
              className="tiptap prose prose-sm sm:prose-base max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: formData.content || "<p class='text-gray-400'>No content yet…</p>" }}
            />
          </div>
        </div>
      ) : (
        /* ─── Edit Mode ─── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
              {formData.thumbnailUrl ? (
                <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100 group">
                  <img src={formData.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/30 cursor-pointer transition-colors text-sm">
                      Change
                      <input type="file" onChange={handleThumbnailUpload} accept="image/*" className="hidden" />
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setFormData(p => ({ ...p, thumbnailUrl: "" }))}
                      className="p-2 bg-red-500/80 backdrop-blur-md rounded-lg text-white hover:bg-red-600 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition-colors bg-gray-50/50 hover:bg-gray-50">
                  <div className="flex flex-col items-center p-6 text-center">
                    <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 mb-2">
                      <Upload className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Add Cover Image</p>
                    <p className="text-xs text-gray-400 mt-1">Recommended size 1200×630 (aspect ratio 1.91:1)</p>
                  </div>
                  <input type="file" onChange={handleThumbnailUpload} accept="image/*" className="hidden" />
                </label>
              )}
            </div>

            {/* Title & Content */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 text-lg font-medium"
                  placeholder="An amazing article title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-blue-100 bg-blue-50/20 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <button
                    type="button"
                    onClick={() => { setAiTopic(formData.title || ""); setAiModalOpen(true); }}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiLoading ? "Generating..." : "Generate with AI"}
                  </button>
                </div>
                <RichTextEditor 
                  value={formData.content} 
                  onChange={(html) => setFormData(p => ({ ...p, content: html }))} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                  placeholder="Short descriptive summary for list view cards."
                />
              </div>
            </div>
          </div>

          {/* Sidebar Settings Column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Properties</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="taxes, business, compliance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Read Time</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium tabular-nums">
                    ~{autoReadTime} min
                  </span>
                  <span className="text-xs text-gray-400">auto-calculated</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Featured Article</label>
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  name="published"
                  value={formData.published ? "true" : "false"}
                  onChange={(e) => setFormData(p => ({ ...p, published: e.target.value === "true" }))}
                  className="px-2 py-1 rounded-md text-sm border border-gray-300"
                >
                  <option value="false">Draft</option>
                  <option value="true">Published</option>
                </select>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-semibold text-gray-900 border-none pb-0">SEO Fallbacks</h3>
                <button
                  type="button"
                  onClick={handleAIGenerateSEO}
                  disabled={aiSeoLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {aiSeoLoading ? "Suggesting..." : "Suggest with AI"}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal Overlay */}
      <AnimatePresence>
        {aiModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 m-0"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Generate with AI
                </h3>
                <button type="button" onClick={() => setAiModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Topic or Prompt</label>
                <textarea
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  disabled={aiLoading}
                  placeholder="e.g., 10 Essential Income Tax Savings for Salaried Employees in 2026..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  disabled={aiLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !aiTopic.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {aiLoading ? "Generating..." : "Generate"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

          {/* Custom Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 z-50 ${
                  toast.type === 'success' 
                    ? 'bg-green-50 border-green-100 text-green-800' 
                    : 'bg-red-50 border-red-100 text-red-800'
                }`}
              >
                {toast.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
    </form>
  );
}
