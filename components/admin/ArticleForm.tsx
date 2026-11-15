"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Save, ArrowLeft, Eye, Edit3, Upload, Sparkles, X, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "./RichTextEditor";
import { sanitizeHtml } from "@/lib/sanitize-html";
import MediaImageInput from "./MediaImageInput";

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
    tags: Array.isArray(article?.tags) ? (article.tags as string[]).join(", ") : "",
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
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
      {/* Header element */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/articles" 
            className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {isEdit ? "Edit Article" : "Create Article"}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-slate-500">
                ~{autoReadTime} min read
              </span>
              <span>•</span>
              <span>{formData.content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length} words</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle preview button */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-inner">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                !previewMode
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                previewMode
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60 cursor-pointer active:scale-98"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Article"}
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-100 animate-fade-in flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          {error}
        </div>
      )}

      {previewMode ? (
        /* ─── Preview Mode layout ─── */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in max-w-4xl mx-auto">
          {formData.thumbnailUrl && (
            <div className="aspect-video w-full bg-slate-50 border-b border-slate-100 overflow-hidden">
              <img src={formData.thumbnailUrl} alt={formData.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-8 md:p-12 space-y-6">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                {formData.category.replace(/_/g, " ")}
              </span>
              {formData.isFeatured && (
                <span className="px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                  Featured
                </span>
              )}
              <span className="text-xs text-slate-400 font-semibold">~{autoReadTime} min read</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {formData.title || "Untitled Article"}
            </h1>
            
            {formData.excerpt && (
              <p className="text-lg text-slate-500 font-medium leading-relaxed border-l-4 border-slate-200 pl-4">
                {formData.excerpt}
              </p>
            )}
            
            <div className="h-px bg-slate-100 my-6" />
            
            <div
              className="tiptap prose prose-slate max-w-none text-slate-800 focus:outline-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.content) || "<p class='text-slate-400 font-medium italic'>No content written yet.</p>" }}
            />
          </div>
        </div>
      ) : (
        /* ─── Edit Mode Layout ─── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main content forms columns (span 2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image Upload & URL Area */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <MediaImageInput
                label="Article Cover Image"
                description="Upload an image file (PNG, JPG, WebP) or enter an image URL. Recommended 1200×630px."
                value={formData.thumbnailUrl}
                defaultImage={article?.thumbnailUrl || "/images/hero_bg.png"}
                aspectRatio="banner"
                onChange={(url) => setFormData((prev) => ({ ...prev, thumbnailUrl: url }))}
              />
            </div>

            {/* Title, slug, content rich text editor */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Article Title</label>
                <input
                  type="text"
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none text-lg font-bold text-slate-800 placeholder-slate-400 shadow-sm"
                  placeholder="e.g., 5 Essential Tax Compliance Updates"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Live Route URL Slug</label>
                <div className="flex items-center">
                  <span className="bg-slate-50 border border-r-0 border-slate-200 px-3.5 py-3 rounded-l-xl text-xs font-mono font-semibold text-slate-400 shrink-0">
                    /articles/
                  </span>
                  <input
                    type="text"
                    required
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-r-xl font-mono text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition shadow-inner bg-slate-50/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Body Content</label>
                  <button
                    type="button"
                    onClick={() => { setAiTopic(formData.title || ""); setAiModalOpen(true); }}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 border border-indigo-100/50 text-indigo-700 hover:bg-indigo-100 transition shadow-sm active:scale-98 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiLoading ? "Generating..." : "Generate with AI"}
                  </button>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all duration-200 shadow-sm">
                  <RichTextEditor 
                    value={formData.content} 
                    onChange={(html) => setFormData(p => ({ ...p, content: html }))} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Excerpt Summary</label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none text-xs text-slate-800 placeholder-slate-400 resize-none shadow-sm"
                  placeholder="Short descriptive summary shown on list card summaries."
                />
              </div>
            </div>
          </div>

          {/* Sidebar parameters & SEO options (span 1) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card 1: Article Properties */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                Attributes
              </h3>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3.5 py-3 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="taxes, business, compliance"
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm placeholder-slate-400"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Separate tags using commas.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Read Time</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 font-bold tabular-nums">
                    ~{autoReadTime} min
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Auto-calculated</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Featured Article</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-4 after:w-4 after:h-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Publishing Status</span>
                <select
                  name="published"
                  value={formData.published ? "true" : "false"}
                  onChange={(e) => setFormData(p => ({ ...p, published: e.target.value === "true" }))}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white cursor-pointer transition shadow-sm outline-none focus:border-indigo-500"
                >
                  <option value="false">Draft</option>
                  <option value="true">Published</option>
                </select>
              </div>
            </div>

            {/* Card 2: SEO Meta Parameters */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">SEO Settings</h3>
                <button
                  type="button"
                  onClick={handleAIGenerateSEO}
                  disabled={aiSeoLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-indigo-50 border border-indigo-100/50 text-indigo-700 hover:bg-indigo-100 transition shadow-sm active:scale-98 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  {aiSeoLoading ? "Suggesting..." : "Suggest"}
                </button>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Meta Title Override</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  placeholder="Keep under 60 characters"
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Meta Description Override</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Keep under 160 characters"
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm placeholder-slate-400 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI generate modal overlay */}
      <AnimatePresence>
        {aiModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 m-0"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6 space-y-4 border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Generate content with AI
                </h3>
                <button 
                  type="button" 
                  onClick={() => setAiModalOpen(false)} 
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Prompt / Writing Instructions</label>
                <textarea
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  disabled={aiLoading}
                  placeholder="e.g. Write an informative guide about GST Registration eligibility, thresholds, and documents needed for private limited companies..."
                  rows={4}
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none resize-none shadow-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  disabled={aiLoading}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 cursor-pointer transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !aiTopic.trim()}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {aiLoading ? "Generating..." : "Generate Post"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating success/error Toasts */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4.5 py-3 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-2 z-50 animate-fade-in ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="h-4 w-4 text-rose-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
