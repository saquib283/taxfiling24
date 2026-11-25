"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Shield, X, Loader2, Users, Edit, Save } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  username: string;
  role: string;
  createdAt: string;
}

const getRoleStyle = (role: string) => {
  const r = role || "";
  if (r === "ADMIN") return "bg-purple-50 text-purple-700 border-purple-100";
  if (r === "EDITOR") return "bg-blue-50 text-blue-700 border-blue-100";
  return "bg-slate-100 text-slate-700 border-slate-200/80";
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "EDITOR" });
  const [editForm, setEditForm] = useState({ name: "", role: "EDITOR" });

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(data)) {
        setFeedback({ text: data?.error || "Failed to load user accounts.", type: "error" });
        setUsers([]);
      } else {
        setUsers(data);
      }
    } catch {
      setFeedback({ text: "Network error loading user accounts.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ text: data.error || "Failed to create user.", type: "error" });
      } else {
        setForm({ name: "", username: "", password: "", role: "EDITOR" });
        setShowAdd(false);
        setFeedback({ text: "User account created successfully.", type: "success" });
        await fetchUsers();
      }
    } catch {
      setFeedback({ text: "Network error creating user.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ text: data.error || "Failed to update user.", type: "error" });
      } else {
        setEditingId(null);
        setFeedback({ text: "User account updated.", type: "success" });
        await fetchUsers();
      }
    } catch {
      setFeedback({ text: "Network error updating user.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ text: data.error || "Failed to delete user.", type: "error" });
      } else {
        setFeedback({ text: "User deleted.", type: "success" });
        await fetchUsers();
      }
    } catch {
      setFeedback({ text: "Network error deleting user.", type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center text-slate-400 font-medium">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
        Loading user accounts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              User Accounts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700">
              {users.length} Users
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrator credentials, team roles, staff access permissions, and authentication accounts.
          </p>
        </div>
        <button 
          onClick={() => { setShowAdd(true); setEditingId(null); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-xs cursor-pointer self-start sm:self-center"
        >
          <Plus className="h-3.5 w-3.5" /> Add User
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold border shadow-2xs ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Add User overlay card */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Add New Administrator Account</h3>
            <button 
              onClick={() => setShowAdd(false)} 
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none font-medium" />
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username ID" className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none font-medium font-mono" />
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none font-medium" />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none font-bold">
              <option value="ADMIN">ADMIN</option>
              <option value="EDITOR">EDITOR</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleCreate} disabled={saving || !form.username || !form.password} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Account
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-xs transition cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      {/* Edit User overlay card */}
      {editingId && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Edit User Parameters</h3>
            <button 
              onClick={() => setEditingId(null)} 
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full Name" className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none font-medium" />
            <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none font-bold">
              <option value="ADMIN">ADMIN</option>
              <option value="EDITOR">EDITOR</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleEdit} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Update Account
            </button>
            <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-xs transition cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      {/* Main user table listing */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="p-3.5 bg-slate-50 rounded-2xl inline-block mb-3 border border-slate-100">
              <Users className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No users found</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Create and manage administrative login credentials.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Display Name</th>
                  <th className="p-4">Username ID</th>
                  <th className="p-4">Role Permission</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition duration-150 text-xs">
                    <td className="p-4 pl-6 font-bold text-slate-900">
                      {u.name || "Anonymous Admin"}
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-mono">
                      {u.username}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleStyle(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { dateStyle: 'medium' })}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => { setEditingId(u.id); setEditForm({ name: u.name || "", role: u.role }); setShowAdd(false); }} 
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit user"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id)} 
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
