"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, ArrowLeft, Briefcase, Shield, FileHeart, TrendingUp, Settings, Users, Sparkles, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import Link from "next/link";
import MediaImageInput from "./MediaImageInput";

interface ServiceFormProps {
  service?: any;
  isEdit?: boolean;
}

const ICONS = {
  Briefcase, Shield, FileHeart, TrendingUp, Settings, Users
};

export default function ServiceForm({ service, isEdit = false }: ServiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: service?.title || "",
    description: service?.description || "",
    icon: service?.icon || "Briefcase",
    category: service?.category || "General",
    href: service?.href || "",
    heroBg: service?.heroBg || "",
    overview: service?.overview || "",
    benefits: Array.isArray(service?.benefits) ? service?.benefits : [],
    subServices: Array.isArray(service?.subServices) ? service?.subServices : [],
    documentsRequired: Array.isArray(service?.documentsRequired) ? service?.documentsRequired : [],
    process: Array.isArray(service?.process) ? service?.process : [],
    faqs: Array.isArray(service?.faqs) ? service?.faqs : [],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field: keyof typeof formData, index: number, value: any) => {
    setFormData(p => {
      const arr = [...(p[field] as any[])];
      arr[index] = value;
      return { ...p, [field]: arr };
    });
  };

  const handleArrayAdd = (field: keyof typeof formData, emptyItem: any) => {
    setFormData(p => ({ ...p, [field]: [...(p[field] as any[]), emptyItem] }));
  };

  const handleArrayRemove = (field: keyof typeof formData, index: number) => {
    setFormData(p => {
      const arr = [...(p[field] as any[])];
      arr.splice(index, 1);
      return { ...p, [field]: arr };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEdit ? `/api/admin/services/${service.id}` : "/api/admin/services";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/admin/services");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save service");
      }
    } catch (err) {
      setError("Something went wrong saving the service.");
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerateDesc = async () => {
    if (!formData.title) {
      setError("Please enter a service title first to generate an AI description.");
      return;
    }
    setError("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title, topic: formData.title, category: formData.category, type: "service" })
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        // Strip HTML tag setups if AI returns it, for plaintext <textarea>
        const plainText = data.reply.replace(/<[^>]*>/g, "");
        setFormData(p => ({ ...p, description: plainText.trim() }));
      } else {
        setError(data.error || "Failed to generate description");
      }
    } catch {
      setError("Something went wrong with AI generation. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
      {/* Action Header */}
      <header className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/services" 
            className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isEdit ? "Edit Service Layout" : "Publish New Service"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Configure layout pages, dynamic process workflows, and client parameters.</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all duration-150 disabled:opacity-50 cursor-pointer active:scale-98"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {loading ? "Saving..." : "Save Service"}
        </motion.button>
      </header>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold border border-rose-100/80 shadow-sm flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {/* Meta config section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Service Title</label>
          <input
            type="text"
            required
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm"
            placeholder="e.g., Company Registration (Pvt Ltd)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Category Label</label>
            <input
              type="text"
              required
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm"
              placeholder="e.g., Registration"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Visual Icon representation</label>
            <select
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none bg-white shadow-sm"
            >
              {Object.keys(ICONS).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Brief Overview Description</label>
            <button
              type="button"
              onClick={handleAIGenerateDesc}
              disabled={aiLoading || !formData.title}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-indigo-50 border border-indigo-100/50 text-indigo-700 hover:bg-indigo-100 transition shadow-inner active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
              {aiLoading ? "AI Writing..." : "Write with AI"}
            </button>
          </div>
          <textarea
            required
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none resize-none shadow-sm"
            placeholder="Summarize the service offerings for directory page cards..."
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Redirection URL Link (Optional)</label>
          <input
            type="text"
            name="href"
            value={formData.href}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-850 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none font-mono shadow-sm"
            placeholder="e.g., /services/company-registration"
          />
        </div>

        <div>
          <MediaImageInput
            label="Service Banner Image / Visual"
            description="Upload a custom header image or provide an image URL. Reverts to default hero image if cleared."
            value={formData.heroBg && (formData.heroBg.startsWith("/") || formData.heroBg.startsWith("http")) ? formData.heroBg : ""}
            defaultImage="/images/hero_bg.png"
            aspectRatio="banner"
            placeholder="e.g., /images/hero_bg.png or https://..."
            onChange={(url) => setFormData(prev => ({ ...prev, heroBg: url }))}
          />
        </div>
      </div>

      {/* --- ADVANCED JSON FIELDS --- */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-8">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Detailed Service Layout Content</h2>
          <p className="text-xs text-slate-500 mt-0.5">Customize long-form documentation blocks, parameters, and lists.</p>
          <div className="h-px bg-slate-100 mt-4" />
        </div>
        
        {/* OVERVIEW */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Service Overview (Extended Details)</label>
          <textarea
            name="overview"
            value={formData.overview}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none resize-none shadow-sm"
            placeholder="Provide extended descriptions that explain filing policies and legal guidelines..."
          />
        </div>

        {/* BENEFITS ARRAY */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Key Benefits Offered</label>
            <button 
              type="button" 
              onClick={() => handleArrayAdd("benefits", "")} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/70 text-indigo-700 text-[10px] font-extrabold rounded-lg transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add Benefit
            </button>
          </div>
          <div className="space-y-2">
            {formData.benefits.map((benefit: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => handleArrayChange("benefits", idx, e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 transition outline-none shadow-sm"
                  placeholder="e.g. 100% Online Hassle-free Filing Process"
                />
                <button 
                  type="button" 
                  onClick={() => handleArrayRemove("benefits", idx)} 
                  className="p-3 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {formData.benefits.length === 0 && (
              <p className="text-xs text-slate-400 italic">No benefits added yet.</p>
            )}
          </div>
        </div>

        {/* REQUIRED DOCUMENTS ARRAY */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Required Client Documents</label>
            <button 
              type="button" 
              onClick={() => handleArrayAdd("documentsRequired", "")} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/70 text-indigo-700 text-[10px] font-extrabold rounded-lg transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add Document
            </button>
          </div>
          <div className="space-y-2">
            {formData.documentsRequired.map((doc: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={doc}
                  onChange={(e) => handleArrayChange("documentsRequired", idx, e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 transition outline-none shadow-sm"
                  placeholder="e.g. Copy of PAN Card & Proof of Registered Office Address"
                />
                <button 
                  type="button" 
                  onClick={() => handleArrayRemove("documentsRequired", idx)} 
                  className="p-3 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {formData.documentsRequired.length === 0 && (
              <p className="text-xs text-slate-400 italic">No documents added yet.</p>
            )}
          </div>
        </div>

        {/* SUB-SERVICES ARRAY */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Included Sub-Services</label>
              <p className="text-[11px] text-slate-500 mt-0.5">Define subcomponents rendered on service detail lists.</p>
            </div>
            <button 
              type="button" 
              onClick={() => handleArrayAdd("subServices", { title: "", description: "" })} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/70 text-emerald-700 text-[10px] font-extrabold rounded-lg transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add Sub-Service
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.subServices.map((sub: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-start bg-slate-50/50 p-4 border border-slate-200 rounded-2xl hover:border-slate-300 transition duration-150 shadow-sm relative">
                <GripVertical className="h-5 w-5 text-slate-400 mt-2 shrink-0 cursor-grab active:cursor-grabbing" />
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={sub.title}
                    onChange={(e) => handleArrayChange("subServices", idx, { ...sub, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 transition outline-none"
                    placeholder="Sub-Service Title"
                  />
                  <textarea
                    value={sub.description}
                    onChange={(e) => handleArrayChange("subServices", idx, { ...sub, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 transition outline-none resize-none"
                    placeholder="Provide short notes..."
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleArrayRemove("subServices", idx)} 
                  className="p-2.5 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PROCESS STEPS ARRAY */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Execution Process Steps</label>
              <p className="text-[11px] text-slate-500 mt-0.5">Map dynamic work process milestones for client visibility.</p>
            </div>
            <button 
              type="button" 
              onClick={() => handleArrayAdd("process", { step: String(formData.process.length + 1).padStart(2, '0'), title: "", description: "" })} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 border border-violet-100 hover:bg-violet-100/70 text-violet-700 text-[10px] font-extrabold rounded-lg transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add Process Step
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.process.map((step: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-start bg-violet-50/15 border border-violet-100/80 rounded-2xl p-4 transition hover:border-violet-250 shadow-sm relative">
                <div className="font-extrabold text-xs text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-lg shrink-0 mt-1">
                  {step.step}
                </div>
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => handleArrayChange("process", idx, { ...step, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 transition outline-none"
                    placeholder="Step Title (e.g. Document Collection & Verifications)"
                  />
                  <textarea
                    value={step.description}
                    onChange={(e) => handleArrayChange("process", idx, { ...step, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 transition outline-none resize-none"
                    placeholder="What happens in this milestone?"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleArrayRemove("process", idx)} 
                  className="p-2.5 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQS ARRAY */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Frequently Asked Questions (FAQs)</label>
              <p className="text-[11px] text-slate-500 mt-0.5">Configure page question segments dynamically.</p>
            </div>
            <button 
              type="button" 
              onClick={() => handleArrayAdd("faqs", { question: "", answer: "" })} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/70 text-indigo-700 text-[10px] font-extrabold rounded-lg transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add FAQ
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.faqs.map((faq: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-start bg-indigo-50/15 border border-indigo-100/80 rounded-2xl p-4 transition hover:border-indigo-300 shadow-sm relative">
                <GripVertical className="h-5 w-5 text-slate-400 mt-2 shrink-0 cursor-grab active:cursor-grabbing" />
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => handleArrayChange("faqs", idx, { ...faq, question: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 font-bold placeholder-slate-400 focus:border-indigo-500 transition outline-none"
                    placeholder="Question?"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) => handleArrayChange("faqs", idx, { ...faq, answer: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 transition outline-none resize-none"
                    placeholder="Detailed Answer..."
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleArrayRemove("faqs", idx)} 
                  className="p-2.5 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </form>
  );
}
