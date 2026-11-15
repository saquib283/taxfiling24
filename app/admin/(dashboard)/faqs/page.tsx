"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, GripVertical, Save, X, Loader2, Sparkles, HelpCircle } from "lucide-react";

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFAQs = async () => {
    const res = await fetch("/api/admin/faqs");
    const data = await res.json();
    setFaqs(data);
    setLoading(false);
  };

  useEffect(() => { fetchFAQs(); }, []);

  const handleAIGenerateAnswer = async () => {
    if (!form.question) {
      setErrorMsg("Please enter a question first to generate an answer.");
      return;
    }
    setErrorMsg(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.question, topic: form.question, type: "faq" })
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        const plainText = data.reply.replace(/<[^>]*>/g, ""); // Strip HTML tags
        setForm(p => ({ ...p, answer: plainText.trim() }));
      } else {
        setErrorMsg(data.error || "Failed to generate answer");
      }
    } catch {
      setErrorMsg("Something went wrong with AI generation. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.question || !form.answer) return;
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
    if (!form.question || !form.answer) return;
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

  const confirmDelete = async (id: string) => {
    await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    setDeletingId(null);
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

  if (loading) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center text-slate-400 font-medium">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
        Loading FAQs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">FAQ Manager</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {faqs.length} questions
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Publish, edit, and reorganize frequently asked questions displayed across the website pages.
          </p>
        </div>
        <button 
          onClick={() => { setShowAdd(true); setForm({ question: "", answer: "" }); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" /> Add FAQ
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200 shadow-2xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button 
            onClick={() => setErrorMsg(null)}
            className="text-rose-600 hover:text-rose-800 cursor-pointer p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Inline Form Card to Add FAQ */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Add New FAQ</h3>
            <button 
              onClick={() => setShowAdd(false)} 
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <input 
              value={form.question} 
              onChange={e => setForm({ ...form, question: e.target.value })} 
              placeholder="Question details..." 
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-50 transition outline-none shadow-2xs" 
            />
            
            <div className="relative">
              <textarea 
                value={form.answer} 
                onChange={e => setForm({ ...form, answer: e.target.value })} 
                placeholder="Write detailed answers here..." 
                rows={4} 
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-50 transition outline-none pr-28 resize-none shadow-2xs" 
              />
              <button
                type="button"
                onClick={handleAIGenerateAnswer}
                disabled={aiLoading || !form.question.trim()}
                className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-indigo-50 border border-indigo-200/60 text-indigo-700 hover:bg-indigo-100 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <Sparkles className="h-3 w-3 text-indigo-600" />
                {aiLoading ? "Drafting..." : "Suggest AI"}
              </button>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleAdd} 
                disabled={saving || !form.question || !form.answer} 
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save FAQ
              </button>
              <button 
                onClick={() => setShowAdd(false)} 
                className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display List of FAQ Items */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {faqs.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="p-4 bg-slate-50 rounded-2xl inline-block mb-4 border border-slate-200">
              <HelpCircle className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No FAQs found</h3>
            <p className="text-slate-400 text-xs mt-1 mb-5 leading-relaxed">
              Add FAQ questions with descriptions that clients search for during filing processes.
            </p>
            <button 
              onClick={() => setShowAdd(true)} 
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add FAQ
            </button>
          </div>
        ) : (
          faqs.map((faq) => (
            <div key={faq.id} className="p-5 md:p-6 transition hover:bg-slate-50/50">
              {editingId === faq.id ? (
                <div className="space-y-4 animate-fade-in">
                  <input 
                    value={form.question} 
                    onChange={e => setForm({ ...form, question: e.target.value })} 
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm" 
                  />
                  <div className="relative">
                    <textarea 
                      value={form.answer} 
                      onChange={e => setForm({ ...form, answer: e.target.value })} 
                      rows={3} 
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none pr-28 resize-none shadow-sm" 
                    />
                    <button
                      type="button"
                      onClick={handleAIGenerateAnswer}
                      disabled={aiLoading || !form.question.trim()}
                      className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm animate-pulse"
                    >
                      <Sparkles className="h-3 w-3 text-indigo-600" />
                      {aiLoading ? "Drafting..." : "Suggest AI"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdate(faq.id)} 
                      className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      Save Changes
                    </button>
                    <button 
                      onClick={() => setEditingId(null)} 
                      className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-inner"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm leading-snug">{faq.question}</h4>
                      {!faq.isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 border border-slate-200 text-slate-500">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">{faq.answer}</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => toggleActive(faq.id, faq.isActive)} 
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer transition ${
                        faq.isActive 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                    >
                      {faq.isActive ? "Active" : "Hidden"}
                    </button>
                    
                    <button 
                      onClick={() => { setEditingId(faq.id); setForm({ question: faq.question, answer: faq.answer }); }} 
                      className="p-2 border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition active:scale-95 cursor-pointer"
                      title="Edit FAQ"
                      aria-label="Edit FAQ"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    {deletingId === faq.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg">
                        <span className="text-[11px] font-bold text-rose-700 px-1">Delete?</span>
                        <button
                          type="button"
                          onClick={() => confirmDelete(faq.id)}
                          className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-0.5 rounded-md bg-white text-slate-600 text-[11px] font-bold hover:bg-slate-100 transition border border-slate-200 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setDeletingId(faq.id)} 
                        className="p-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition active:scale-95 cursor-pointer"
                        title="Delete FAQ"
                        aria-label="Delete FAQ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
