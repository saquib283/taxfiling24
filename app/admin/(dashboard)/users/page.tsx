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
  return "bg-slate-150 text-slate-700 border-slate-200/80";
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "ADMIN" });
  const [editForm, setEditForm] = useState({ name: "", role: "ADMIN" });

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", username: "", password: "", role: "ADMIN" });
    setShowAdd(false);
    setSaving(false);
    fetchUsers();
  };

  const handleEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    await fetch(`/api/admin/users/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    setSaving(false);
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    fetchUsers();
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
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header section */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
            User Accounts
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage administrator credentials, team permissions, roles, and staff login entries.
          </p>
        </div>
        <button 
          onClick={() => { setShowAdd(true); setEditingId(null); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer self-start sm:self-center active:scale-98"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </header>

      {/* Add User overlay card */}
      {showAdd && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Add New User</h3>
            <button 
              onClick={() => setShowAdd(false)} 
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-650 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-indigo-500 transition outline-none shadow-sm" />
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username" className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-indigo-500 transition outline-none shadow-sm" />
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-indigo-500 transition outline-none shadow-sm" />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-indigo-500 transition outline-none bg-white shadow-sm">
              <option value="ADMIN">ADMIN</option>
              <option value="EDITOR">EDITOR</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleCreate} disabled={saving || !form.username || !form.password} className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4.5 py-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer shadow-inner">Cancel</button>
          </div>
        </div>
      )}

      {/* Edit User overlay card */}
      {editingId && (
        <div className="bg-white rounded-3xl border border-indigo-200 shadow-md p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
            <h3 className="font-bold text-indigo-955 text-sm">Edit User Parameters</h3>
            <button 
              onClick={() => setEditingId(null)} 
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-650 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full Name" className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-indigo-500 transition outline-none shadow-sm" />
            <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-indigo-500 transition outline-none bg-white shadow-sm">
              <option value="ADMIN">ADMIN</option>
              <option value="EDITOR">EDITOR</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleEdit} disabled={saving} className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Update
            </button>
            <button onClick={() => setEditingId(null)} className="px-4.5 py-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer shadow-inner">Cancel</button>
          </div>
        </div>
      )}

      {/* Main user table listing */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="p-4 bg-slate-50 rounded-2xl inline-block mb-4 border border-slate-100">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No users found</h3>
            <p className="text-slate-400 text-xs mt-1 mb-5 leading-relaxed">
              Create and manage administrative login credentials.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80">
                  <th className="p-4 pl-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Display Name</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username ID</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Permission</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created Date</th>
                  <th className="p-4 pr-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-55/30 transition duration-150 text-sm">
                    <td className="p-4 pl-6 font-bold text-slate-800">
                      {u.name || "Anonymous Admin"}
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-mono">
                      {u.username}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getRoleStyle(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-450 text-xs">
                      {new Date(u.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => { setEditingId(u.id); setEditForm({ name: u.name || "", role: u.role }); setShowAdd(false); }} 
                          className="p-2 border border-slate-100 text-slate-500 hover:bg-slate-55 hover:text-slate-700 rounded-xl transition active:scale-95 cursor-pointer shadow-sm"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id)} 
                          className="p-2 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-95 cursor-pointer shadow-sm"
                        >
                          <Trash2 className="h-4 w-4" />
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
