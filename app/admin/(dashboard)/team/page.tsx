"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, Loader2, Users } from "lucide-react";

interface Member {
  id: string;
  name: string;
  designation: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function TeamManagerPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", designation: "", image: "" });
  const [saving, setSaving] = useState(false);

  const fetchMembers = async () => {
    const res = await fetch("/api/admin/team");
    setMembers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleAdd = async () => {
    setSaving(true);
    await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sortOrder: members.length }),
    });
    setForm({ name: "", designation: "", image: "" });
    setShowAdd(false);
    setSaving(false);
    fetchMembers();
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    await fetch(`/api/admin/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEditingId(null);
    setSaving(false);
    fetchMembers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this team member?")) return;
    await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
    fetchMembers();
  };

  if (loading) return <div className="p-6 text-gray-400">Loading team members...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Team Members</h1>
          <p className="text-gray-600">Manage team profiles displayed on the About page</p>
        </div>
        <button onClick={() => { setShowAdd(true); setForm({ name: "", designation: "", image: "" }); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm">
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add Team Member</h3>
          <div className="grid grid-cols-3 gap-4">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="Designation (e.g., Senior CA)" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="Image URL (optional)" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} disabled={saving || !form.name || !form.designation} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.length === 0 ? (
          <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
            <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No team members added yet.</p>
          </div>
        ) : (
          members.map(m => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                  {m.image ? <img src={m.image} alt={m.name} className="h-full w-full rounded-full object-cover" /> : m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm">{m.name}</h4>
                  <p className="text-xs text-gray-500">{m.designation}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditingId(m.id); setForm({ name: m.name, designation: m.designation, image: m.image || "" }); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
