"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, User, Lock, Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const [form, setForm] = useState({ name: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.name) setForm(prev => ({ ...prev, name: data.name }));
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setFeedback(null);
    if (form.newPassword) {
      if (!form.currentPassword) {
        setFeedback({ text: "Enter your current password to set a new password.", type: "error" });
        return;
      }
      if (form.newPassword.length < 8) {
        setFeedback({ text: "New password must be at least 8 characters.", type: "error" });
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setFeedback({ text: "Passwords do not match.", type: "error" });
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFeedback({ text: data.message || "Profile updated successfully!", type: "success" });
        setForm(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      } else {
        setFeedback({ text: data.error || data.message || "Failed to update profile.", type: "error" });
      }
    } catch {
      setFeedback({ text: "Network connection error.", type: "error" });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Studio Header */}
      <div className="text-center sm:text-left border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Profile & Security Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize administrative display credentials and update account security passwords.
        </p>
      </div>

      {/* Main card stack */}
      <div className="space-y-6">
        {/* Profile Card details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b border-slate-100 pb-5">
            <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
              {form.name ? form.name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-slate-900 text-sm">Account Identity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Your visible administrative staff name.</p>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Display Name</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none font-medium" 
            />
          </div>
        </div>

        {/* Change password card details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 shrink-0">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Update Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">Leave blank to keep existing password.</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setShowPasswords(!showPasswords)} 
              className="p-2 border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition"
              title={showPasswords ? "Hide password characters" : "Show password characters"}
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Current Password</label>
              <input 
                type={showPasswords ? "text" : "password"} 
                value={form.currentPassword} 
                onChange={e => setForm({ ...form, currentPassword: e.target.value })} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none font-medium" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">New Password</label>
              <input 
                type={showPasswords ? "text" : "password"} 
                value={form.newPassword} 
                onChange={e => setForm({ ...form, newPassword: e.target.value })} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none font-medium" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
              <input 
                type={showPasswords ? "text" : "password"} 
                value={form.confirmPassword} 
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none font-medium" 
              />
            </div>
          </div>
        </div>

        {feedback && (
          <div className={`p-3.5 rounded-xl text-xs font-bold border shadow-2xs flex items-center gap-2 ${
            feedback.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200" 
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}>
            <span className={`h-2 w-2 rounded-full shrink-0 ${
              feedback.type === "error" ? "bg-rose-500" : "bg-emerald-500"
            }`} />
            {feedback.text}
          </div>
        )}

        {/* Save Action Button */}
        <div>
          <button 
            type="button"
            onClick={handleSave} 
            disabled={saving} 
            className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50 w-full"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving Changes..." : "Save Profile Details"}
          </button>
        </div>
      </div>
    </div>
  );
}
