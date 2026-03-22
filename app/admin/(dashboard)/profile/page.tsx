"use client";

import { useState } from "react";
import { Save, Loader2, User, Lock, Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const [form, setForm] = useState({ name: "Admin", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

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
      setMessage(data.message || (res.ok ? "Profile updated!" : "Error updating profile."));
    } catch {
      setMessage("Network error.");
    }
    setSaving(false);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Profile & Password</h1>
        <p className="text-gray-600">Update your admin profile and change password</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {form.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Admin Profile</h3>
              <p className="text-xs text-gray-500">Manage your display name</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Password */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900">Change Password</h3>
                <p className="text-xs text-gray-500">Leave blank if you don&apos;t want to change</p>
              </div>
            </div>
            <button onClick={() => setShowPasswords(!showPasswords)} className="text-gray-400 hover:text-gray-600">
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
              <input type={showPasswords ? "text" : "password"} value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <input type={showPasswords ? "text" : "password"} value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <input type={showPasswords ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm font-medium ${message.includes("Error") || message.includes("match") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {message}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
