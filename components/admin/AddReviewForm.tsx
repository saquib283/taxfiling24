"use client";

import { useState } from "react";
import { Plus, X, Loader2, Star, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import MediaImageInput from "./MediaImageInput";

export default function AddReviewForm() {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", role: "", content: "", rating: 5, avatar: "" });
  const router = useRouter();

  const handleCreate = async () => {
    if (!form.name.trim() || !form.content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role.trim() || null,
          content: form.content.trim(),
          rating: form.rating,
          avatar: form.avatar.trim() || null,
          isApproved: true,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save review.");
      }
      setForm({ name: "", role: "", content: "", rating: 5, avatar: "" });
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setShowForm(true);
        }}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer active:scale-98"
      >
        <Plus className="h-4 w-4" /> Add Review
      </button>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs"
          onClick={() => !saving && setShowForm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Review</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Client Name *"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-indigo-500 transition outline-none shadow-sm"
              />
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Company / Designation"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-indigo-500 transition outline-none shadow-sm"
              />
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Review testimonial content details *..."
                rows={3}
                className="sm:col-span-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-indigo-500 transition outline-none resize-none shadow-sm"
              />

              <div className="sm:col-span-2">
                <MediaImageInput
                  label="Client Avatar / Photo (Optional)"
                  description="Upload client headshot or provide image URL"
                  value={form.avatar}
                  aspectRatio="square"
                  onChange={(url) => setForm((prev) => ({ ...prev, avatar: url }))}
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-1.5 border-t border-slate-50">
                <span className="text-xs font-semibold text-slate-500">Star Rating:</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm({ ...form, rating: r })}
                      className="focus:outline-none cursor-pointer hover:scale-110 transition active:scale-95"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          r <= form.rating ? "text-amber-400 fill-current" : "text-slate-200 fill-none"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold text-xs transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !form.name.trim() || !form.content.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
