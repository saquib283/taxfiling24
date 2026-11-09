"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  Calendar,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Sparkles,
} from "lucide-react";

interface Deadline {
  id: string;
  title: string;
  category: string;
  date: string;
  desc: string;
  isActive: boolean;
}

const CATEGORIES = ["Income Tax", "GST", "Labor Law", "ROC", "Other"] as const;

const RECURRING_PRESETS = [
  { category: "GST", title: "GSTR-1 (Outward Supplies)", desc: "Monthly return of outward supplies for regular taxpayers." },
  { category: "GST", title: "GSTR-3B (Summary Return)", desc: "Monthly self-assessment summary return and tax payment." },
  { category: "Income Tax", title: "TDS / TCS Deposit", desc: "Monthly deposit of tax deducted at source for preceding month." },
  { category: "Income Tax", title: "Advance Tax Instalment", desc: "Quarterly advance tax payment instalment for companies and individuals." },
  { category: "Labor Law", title: "PF & ESI Monthly Remittance", desc: "Monthly statutory contribution for Provident Fund & ESI." },
  { category: "ROC", title: "AOC-4 (Financial Statements)", desc: "Annual filing of financial statements with MCA / ROC." },
  { category: "ROC", title: "MGT-7 (Annual Return)", desc: "Annual company return filing with the Registrar of Companies." },
];

function getCategoryBadge(category: string) {
  const cat = category?.toUpperCase() || "";
  if (cat.includes("INCOME"))
    return { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
  if (cat.includes("GST"))
    return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
  if (cat.includes("ROC"))
    return { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" };
  if (cat.includes("LABOR"))
    return { bg: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" };
  return { bg: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" };
}

function getUrgencyBadge(dateStr: string) {
  const target = new Date(dateStr);
  const now = new Date();
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((targetMidnight - nowMidnight) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      style: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }
  if (diffDays === 0) {
    return { label: "Due Today", style: "bg-rose-100 text-rose-800 font-bold border-rose-300 animate-pulse" };
  }
  if (diffDays === 1) {
    return { label: "Due Tomorrow", style: "bg-amber-100 text-amber-800 font-bold border-amber-300" };
  }
  if (diffDays <= 7) {
    return { label: `Due in ${diffDays}d`, style: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  return { label: `In ${diffDays}d`, style: "bg-slate-100 text-slate-600 border-slate-200" };
}

export default function CalendarManagerPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: "Income Tax", date: "", desc: "", title: "" });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const fetchDeadlines = async () => {
    try {
      const res = await fetch("/api/admin/calendar");
      if (res.ok) {
        setDeadlines(await res.json());
      }
    } catch {
      setFeedback({ text: "Failed to load compliance deadlines.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDeadlines();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/calendar", {
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to add deadline");

      setForm({ category: "Income Tax", date: "", desc: "", title: "" });
      setShowAdd(false);
      setFeedback({ text: "Compliance deadline published.", type: "success" });
      await fetchDeadlines();
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Failed to add deadline.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/calendar/${id}`, {
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to update deadline");

      setEditingId(null);
      setFeedback({ text: "Compliance deadline updated.", type: "success" });
      await fetchDeadlines();
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Failed to update deadline.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/calendar/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete deadline");

      setConfirmDeleteId(null);
      setFeedback({ text: "Deadline removed successfully.", type: "success" });
      await fetchDeadlines();
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Failed to delete deadline.",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDeadlines = useMemo(() => {
    return deadlines.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.desc || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        selectedCategory === "ALL" || d.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [deadlines, searchTerm, selectedCategory]);

  if (loading) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center text-slate-500 font-medium">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mr-2" />
        Loading compliance schedule...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Compliance Calendar
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Statutory Deadlines
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Publish GST, Income Tax, ROC, and labor compliance filing due dates displayed on the client dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
            setForm({ category: "Income Tax", date: "", desc: "", title: "" });
            setFeedback(null);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" /> Add Due Date
        </button>
      </header>

      {/* Floating feedback alert */}
      {feedback && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-xs sm:text-sm flex items-center justify-between gap-3 ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                feedback.type === "success" ? "bg-emerald-600" : "bg-rose-600"
              }`}
            />
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add / Edit Form Card */}
      {(showAdd || editingId) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">
              {showAdd ? "Add Compliance Due Date" : "Edit Compliance Deadline"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setEditingId(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Presets for fast entry */}
          {showAdd && (
            <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Indian Presets:
              </span>
              {RECURRING_PRESETS.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      category: p.category,
                      desc: p.desc,
                      title: p.title,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 font-medium text-slate-700 transition cursor-pointer"
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => (showAdd ? handleAdd(e) : handleUpdate(editingId!, e))}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Deadline Title *
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. GSTR-3B Monthly Return"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Regulatory Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 outline-none bg-white font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Statutory Due Date *
                </label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 outline-none bg-white font-medium"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description / Applicability Notes
                </label>
                <textarea
                  rows={2}
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  placeholder="State which taxpayers must file, applicable penalties u/s 47 or 234F, etc."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.title.trim() || !form.date}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {showAdd ? "Publish Deadline" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search compliance deadlines by title, category, description..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 self-center">
            Showing <strong className="text-slate-800">{filteredDeadlines.length}</strong> of{" "}
            {deadlines.length} events
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Category:
          </span>
          {["ALL", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Deadlines Listing Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredDeadlines.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No compliance deadlines found</h3>
            <p className="text-slate-500 text-xs mt-1">
              {searchTerm || selectedCategory !== "ALL"
                ? "No due dates match your current search or category filter."
                : "Add GST, Income Tax, ROC, and labor compliance dates to populate the calendar."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-5">Statutory Due Date</th>
                  <th className="py-3 px-4">Compliance Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Applicability Notes</th>
                  <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeadlines.map((d) => {
                  const catBadge = getCategoryBadge(d.category);
                  const urgency = getUrgencyBadge(d.date);

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Due Date & Urgency */}
                      <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {new Date(d.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${urgency.style}`}
                        >
                          {urgency.label}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {d.title}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catBadge.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${catBadge.dot}`} />
                          {d.category}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {d.desc || "Standard statutory filing deadline"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(d.id);
                              setShowAdd(false);
                              setForm({
                                category: d.category,
                                date: new Date(d.date).toISOString().split("T")[0],
                                desc: d.desc || "",
                                title: d.title,
                              });
                              setFeedback(null);
                            }}
                            className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition cursor-pointer"
                            title="Edit deadline"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDeleteId(confirmDeleteId === d.id ? null : d.id)
                            }
                            className="p-1.5 border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-lg transition cursor-pointer"
                            title="Delete deadline"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Inline delete confirmation */}
                        {confirmDeleteId === d.id && (
                          <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs flex items-center justify-end gap-2">
                            <span className="text-rose-900 font-semibold text-[11px]">
                              Delete?
                            </span>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 hover:bg-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(d.id)}
                              disabled={deletingId === d.id}
                              className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700"
                            >
                              {deletingId === d.id ? "..." : "Confirm"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
