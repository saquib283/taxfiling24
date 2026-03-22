"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Shield, X, Loader2, Users } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  username: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "ADMIN" });

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  if (loading) return <div className="p-6 text-gray-400">Loading users...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">User Management</h1>
          <p className="text-gray-600">Manage administrator and staff accounts with Role-Based Access</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add New User</h3>
          <div className="grid grid-cols-2 gap-4">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username" className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ADMIN">ADMIN</option>
              <option value="EDITOR">EDITOR</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} disabled={saving || !form.username || !form.password} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No users found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold border-b border-gray-100">
                <th className="p-4">Name</th>
                <th className="p-4">Username</th>
                <th className="p-4">Role</th>
                <th className="p-4">Created At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 text-sm">
                  <td className="p-4 font-medium text-gray-900">{u.name || "Anonymous"}</td>
                  <td className="p-4 text-gray-500">{u.username}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${u.role === "ADMIN" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
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
