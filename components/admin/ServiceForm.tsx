"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, ArrowLeft, Briefcase, Shield, FileHeart, TrendingUp, Settings, Users, Sparkles, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";

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
    if (!formData.title) return alert("Please enter a service title first.");
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
        alert(data.error || "Failed to generate description");
      }
    } catch {
      alert("Something went wrong with AI generation");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/services" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Service" : "Add Service"}</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save Service"}
        </motion.button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            required
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Income Tax Filing"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              required
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
              placeholder="Taxation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <select
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
            >
              {Object.keys(ICONS).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <button
              type="button"
              onClick={handleAIGenerateDesc}
              disabled={aiLoading || !formData.title}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              {aiLoading ? "Suggesting..." : "Suggest with AI"}
            </button>
          </div>
          <textarea
            required
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
            placeholder="Description of the service..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Redirect Link (Optional)</label>
          <input
            type="text"
            name="href"
            value={formData.href}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm"
            placeholder="/services/tax-filing"
          />
        </div>
      </div>

      {/* --- ADVANCED JSON FIELDS --- */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-8">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-3">Service Details & Content</h2>
        
        {/* OVERVIEW */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Overview (Extended)</label>
          <textarea
            name="overview"
            value={formData.overview}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
            placeholder="Detailed overview for the service page..."
          />
        </div>

        {/* BENEFITS ARRAY */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">Key Benefits</label>
            <button type="button" onClick={() => handleArrayAdd("benefits", "")} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded-md">
              <Plus className="h-3 w-3" /> Add Benefit
            </button>
          </div>
          <div className="space-y-2">
            {formData.benefits.map((benefit: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => handleArrayChange("benefits", idx, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g. 100% Audit Assistance"
                />
                <button type="button" onClick={() => handleArrayRemove("benefits", idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {formData.benefits.length === 0 && <p className="text-xs text-gray-400 italic">No benefits added yet.</p>}
          </div>
        </div>

        {/* REQUIRED DOCUMENTS ARRAY */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">Required Documents</label>
            <button type="button" onClick={() => handleArrayAdd("documentsRequired", "")} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded-md">
              <Plus className="h-3 w-3" /> Add Document
            </button>
          </div>
          <div className="space-y-2">
            {formData.documentsRequired.map((doc: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={doc}
                  onChange={(e) => handleArrayChange("documentsRequired", idx, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g. PAN Card copy"
                />
                <button type="button" onClick={() => handleArrayRemove("documentsRequired", idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {formData.documentsRequired.length === 0 && <p className="text-xs text-gray-400 italic">No documents added yet.</p>}
          </div>
        </div>

        {/* SUB-SERVICES ARRAY */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">Included Sub-Services</label>
            <button type="button" onClick={() => handleArrayAdd("subServices", { title: "", description: "" })} className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md">
              <Plus className="h-3 w-3" /> Add Sub-Service
            </button>
          </div>
          <div className="space-y-4">
            {formData.subServices.map((sub: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                <GripVertical className="h-5 w-5 text-gray-400 mt-2 cursor-move flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={sub.title}
                    onChange={(e) => handleArrayChange("subServices", idx, { ...sub, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Sub-Service Title"
                  />
                  <textarea
                    value={sub.description}
                    onChange={(e) => handleArrayChange("subServices", idx, { ...sub, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Short description..."
                  />
                </div>
                <button type="button" onClick={() => handleArrayRemove("subServices", idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PROCESS STEPS ARRAY */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">Execution Process Steps</label>
            <button type="button" onClick={() => handleArrayAdd("process", { step: String(formData.process.length + 1).padStart(2, '0'), title: "", description: "" })} className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-semibold bg-purple-50 px-2 py-1 rounded-md">
              <Plus className="h-3 w-3" /> Add Process Step
            </button>
          </div>
          <div className="space-y-4">
            {formData.process.map((step: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-start bg-purple-50/30 p-4 rounded-xl border border-purple-100">
                <div className="font-bold text-sm text-purple-700 mt-2 w-6 shrink-0">{step.step}</div>
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => handleArrayChange("process", idx, { ...step, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Step Title (e.g. Document Collection)"
                  />
                  <textarea
                    value={step.description}
                    onChange={(e) => handleArrayChange("process", idx, { ...step, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="What happens in this step?"
                  />
                </div>
                <button type="button" onClick={() => handleArrayRemove("process", idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQS ARRAY */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">Frequently Asked Questions</label>
            <button type="button" onClick={() => handleArrayAdd("faqs", { question: "", answer: "" })} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold bg-indigo-50 px-2 py-1 rounded-md">
              <Plus className="h-3 w-3" /> Add FAQ
            </button>
          </div>
          <div className="space-y-4">
            {formData.faqs.map((faq: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-start bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                <GripVertical className="h-5 w-5 text-gray-400 mt-2 cursor-move flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => handleArrayChange("faqs", idx, { ...faq, question: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                    placeholder="Question?"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) => handleArrayChange("faqs", idx, { ...faq, answer: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Detailed Answer..."
                  />
                </div>
                <button type="button" onClick={() => handleArrayRemove("faqs", idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0">
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
