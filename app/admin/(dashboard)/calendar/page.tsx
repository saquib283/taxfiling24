"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, Loader2, Calendar } from "lucide-react";

interface Deadline {
  id: string;
  title: string;
  category: string;
  date: string;
  desc: string;
  isActive: boolean;
}

const CATEGORIES = ["Income Tax", "GST", "Labor Law", "ROC", "Other"];

export default function CalendarManagerPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", category: "Income Tax", date: "", desc: "" });
  const [saving, setSaving] = useState(false);

  const fetchDeadlines = async () => {
    const res = await fetch("/api/admin/calendar");
    setDeadlines(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchDeadlines(); }, []);

  const handleAdd = async () => {
    setSaving(true);
    await fetch("/api/admin/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", category: "Income Tax", date: "", desc: "" });
    setShowAdd(false);
    setSaving(false);
    fetchDeadlines();
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    await fetch(`/api/admin/calendar/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditingId(null);
    setSaving(false);
    fetchDeadlines();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this deadline?")) return;
    await fetch(`/api/admin/calendar/${id}`, { method: "DELETE" });
    fetchDeadlines();
  };

  if (loading) return <div className="p-6 text-gray-400">Loading deadlines...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Compliance Calendar</h1>
          <p className="text-gray-600">Manage tax compliance deadlines shown on the website</p>
        </div>
        <button onClick={() => { setShowAdd(true); setForm({ title: "", category: "Income Tax", date: "", desc: "" }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm">
          <Plus className="h-4 w-4" /> Add Deadline
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Deadline</h3>
          <div className="grid grid-cols-2 gap-4">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Description" rows={2} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} disabled={saving || !form.title || !form.date} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      {editingId && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Edit Deadline</h3>
          <div className="grid grid-cols-2 gap-4">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Description" rows={2} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => handleUpdate(editingId)} disabled={saving || !form.title || !form.date} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Update
            </button>
            <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {deadlines.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No deadlines added yet.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold border-b border-gray-100">
                <th className="p-4">Date</th>
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deadlines.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50 text-sm">
                  <td className="p-4 font-medium text-gray-900 whitespace-nowrap">{new Date(d.date).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-gray-900">{d.title}</td>
                  <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600 border border-blue-200">{d.category}</span></td>
                  <td className="p-4 text-gray-500 text-xs line-clamp-1 max-w-xs">{d.desc}</td>
                  <td className="p-4 text-right flex items-center justify-end gap-1">
                    <button onClick={() => { setEditingId(d.id); setForm({ title: d.title, category: d.category, date: new Date(d.date).toISOString().split("T")[0], desc: d.desc }); setShowAdd(false); }} className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
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
