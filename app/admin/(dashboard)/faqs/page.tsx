"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, GripVertical, Save, X, Loader2, Sparkles } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}

export default function FAQManagerPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: "", answer: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchFAQs = async () => {
    const res = await fetch("/api/admin/faqs");
    const data = await res.json();
    setFaqs(data);
    setLoading(false);
  };

  useEffect(() => { fetchFAQs(); }, []);

  const handleAIGenerateAnswer = async () => {
    if (!form.question) return alert("Please enter a question first.");
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.question, topic: form.question, type: "faq" })
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        const plainText = data.reply.replace(/<[^>]*>/g, ""); // Strip HTML tags template
        setForm(p => ({ ...p, answer: plainText.trim() }));
      } else {
        alert(data.error || "Failed to generate answer");
      }
    } catch {
      alert("Something went wrong with AI generation");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAdd = async () => {
    setSaving(true);
    await fetch("/api/admin/faqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sortOrder: faqs.length }),
    });
    setForm({ question: "", answer: "" });
    setShowAdd(false);
    setSaving(false);
    fetchFAQs();
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    await fetch(`/api/admin/faqs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditingId(null);
    setForm({ question: "", answer: "" });
    setSaving(false);
    fetchFAQs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    fetchFAQs();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/faqs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchFAQs();
  };

  if (loading) return <div className="p-6 text-gray-400">Loading FAQs...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">FAQ Manager</h1>
          <p className="text-gray-600">Manage frequently asked questions shown on the website</p>
        </div>
        <button onClick={() => { setShowAdd(true); setForm({ question: "", answer: "" }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">
          <Plus className="h-4 w-4" /> Add FAQ
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add New FAQ</h3>
          <div className="space-y-4">
            <input value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="Question" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="relative">
              <textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} placeholder="Answer" rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-24" />
              <button
                type="button"
                onClick={handleAIGenerateAnswer}
                disabled={aiLoading || !form.question.trim()}
                className="absolute right-3 top-3 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {aiLoading ? "Drafting..." : "Suggest AI"}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={saving || !form.question || !form.answer} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {faqs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="font-medium ">No FAQs added yet.</p>
            <p className="text-sm mt-1">Add your first FAQ to display on the website.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-5 hover:bg-gray-50">
                {editingId === faq.id ? (
                  <div className="space-y-3">
                    <input value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="relative">
                      <textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-24" />
                      <button
                        type="button"
                        onClick={handleAIGenerateAnswer}
                        disabled={aiLoading || !form.question.trim()}
                        className="absolute right-2 top-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {aiLoading ? "Drafts..." : "Suggest AI"}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(faq.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Save className="h-3 w-3" /> Save</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm">{faq.question}</h4>
                        {!faq.isActive && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Hidden</span>}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{faq.answer}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-4 shrink-0">
                      <button onClick={() => toggleActive(faq.id, faq.isActive)} className={`px-2 py-1 rounded text-xs font-medium ${faq.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                        {faq.isActive ? "Active" : "Hidden"}
                      </button>
                      <button onClick={() => { setEditingId(faq.id); setForm({ question: faq.question, answer: faq.answer }); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(faq.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
