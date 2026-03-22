"use client";

import { useState } from "react";
import { Plus, X, Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddReviewForm() {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", content: "", rating: 5 });
  const router = useRouter();

  const handleCreate = async () => {
    if (!form.name || !form.content) return;
    setSaving(true);
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, isApproved: true }),
    });
    setForm({ name: "", role: "", content: "", rating: 5 });
    setShowForm(false);
    setSaving(false);
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">
        <Plus className="h-4 w-4" /> Add Review
      </button>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Add New Review</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Client Name *" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Company / Role" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Review content *" rows={3} className="col-span-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rating:</span>
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => setForm({ ...form, rating: r })} className="focus:outline-none">
                  <Star className={`h-5 w-5 ${r <= form.rating ? "text-yellow-500 fill-current" : "text-gray-300"}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} disabled={saving || !form.name || !form.content} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Review"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
