"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, User, Lock, Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const [form, setForm] = useState({ name: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then(res => res.json())
      .then(data => {
        if (data.name) setForm(prev => ({ ...prev, name: data.name }));
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setMessage(data.message || (res.ok ? "Profile updated successfully!" : "Error updating profile credentials."));
    } catch {
      setMessage("Network connection error.");
    }
    setSaving(false);
  };
  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Centered Header section */}
      <header className="max-w-xl mx-auto text-center border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Customize display profile details, update usernames, or edit password combinations.
        </p>
      </header>

      {/* Centered Main card stack */}
      <div className="max-w-xl mx-auto space-y-6">
        {/* Profile Card details */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col items-center text-center gap-3 border-b border-slate-50 pb-5">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-650 flex items-center justify-center text-white font-bold text-xl shadow-inner">
              {form.name ? form.name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Admin Account Details</h3>
              <p className="text-xs text-slate-450 mt-0.5">Edit your custom administrative display labels.</p>
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Display Name</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-855 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm" 
            />
          </div>
        </div>

        {/* Change password card details */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-450 border border-slate-200">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Change Credentials</h3>
                <p className="text-xs text-slate-450 mt-0.5">Leave blank if password details should remain unchanged.</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setShowPasswords(!showPasswords)} 
              className="p-2 border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition active:scale-95 cursor-pointer shadow-sm animate-fade-in"
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Current Password</label>
              <input 
                type={showPasswords ? "text" : "password"} 
                value={form.currentPassword} 
                onChange={e => setForm({ ...form, currentPassword: e.target.value })} 
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 focus:border-indigo-500 transition outline-none shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">New Password Combination</label>
              <input 
                type={showPasswords ? "text" : "password"} 
                value={form.newPassword} 
                onChange={e => setForm({ ...form, newPassword: e.target.value })} 
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 focus:border-indigo-500 transition outline-none shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Confirm New Password</label>
              <input 
                type={showPasswords ? "text" : "password"} 
                value={form.confirmPassword} 
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} 
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 focus:border-indigo-500 transition outline-none shadow-sm" 
              />
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-xs font-bold border shadow-sm flex items-center gap-2 animate-fade-in ${
            message.includes("Error") || message.includes("match") || message.includes("Network")
              ? "bg-rose-50 text-rose-800 border-rose-100" 
              : "bg-emerald-50 text-emerald-800 border-emerald-100"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
              message.includes("Error") || message.includes("match") || message.includes("Network") ? "bg-rose-505" : "bg-emerald-550"
            }`} />
            {message}
          </div>
        )}

        {/* Centered Save Action Button */}
        <div className="flex justify-center pt-2">
          <button 
            type="button"
            onClick={handleSave} 
            disabled={saving} 
            className="inline-flex items-center justify-center gap-1.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer w-full"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving Changes..." : "Save Profile Details"}
          </button>
        </div>
      </div>
    </div>
  );
}
