"use client";

import { useState } from "react";
import { Plus, X, Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import MediaImageInput from "./MediaImageInput";

export default function AddReviewForm() {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", content: "", rating: 5, avatar: "" });
  const router = useRouter();

  const handleCreate = async () => {
    if (!form.name || !form.content) return;
    setSaving(true);
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, isApproved: true }),
    });
    setForm({ name: "", role: "", content: "", rating: 5, avatar: "" });
    setShowForm(false);
    setSaving(false);
    router.refresh();
  };

  return (
    <>
      <button 
        onClick={() => setShowForm(true)} 
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer active:scale-98"
      >
        <Plus className="h-4 w-4" /> Add Review
      </button>

      {showForm && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 mt-6 animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Add New Review</h3>
            <button 
              onClick={() => setShowForm(false)} 
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <input 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              placeholder="Client Name *" 
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-indigo-500 transition outline-none shadow-sm" 
            />
            <input 
              value={form.role} 
              onChange={e => setForm({ ...form, role: e.target.value })} 
              placeholder="Company / Designation" 
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-indigo-500 transition outline-none shadow-sm" 
            />
            <textarea 
              value={form.content} 
              onChange={e => setForm({ ...form, content: e.target.value })} 
              placeholder="Review testimonial content details *..." 
              rows={3} 
              className="col-span-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-indigo-500 transition outline-none resize-none shadow-sm" 
            />

            <div className="col-span-2">
              <MediaImageInput
                label="Client Avatar / Photo (Optional)"
                description="Upload client headshot or provide image URL"
                value={form.avatar}
                defaultImage="/images/team_consulting.png"
                aspectRatio="square"
                onChange={(url) => setForm(prev => ({ ...prev, avatar: url }))}
              />
            </div>
            
            <div className="col-span-2 flex items-center gap-2 pt-1.5 border-t border-slate-50">
              <span className="text-xs font-semibold text-slate-500">Star Rating:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(r => (
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
          
          <div className="flex gap-2 pt-2">
            <button 
              onClick={handleCreate} 
              disabled={saving || !form.name || !form.content} 
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Review"}
            </button>
            <button 
              onClick={() => setShowForm(false)} 
              className="px-4 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold text-xs transition active:scale-95 cursor-pointer shadow-inner"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
