"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  Users,
  AlertTriangle,
  Search,
} from "lucide-react";
import MediaImageInput from "@/components/admin/MediaImageInput";

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
  const [form, setForm] = useState({ name: "", designation: "", image: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/admin/team");
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data)) {
        setMembers(data);
      } else {
        setFeedback({ text: data?.error || "Failed to load team members.", type: "error" });
      }
    } catch {
      setFeedback({ text: "Failed to load team members.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMembers();
  }, []);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.designation.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/team", {
        body: JSON.stringify({ ...form, sortOrder: members.length }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to create team member");

      setForm({ designation: "", image: "", isActive: true, name: "" });
      setShowAdd(false);
      setFeedback({ text: "Team member added successfully.", type: "success" });
      await fetchMembers();
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Failed to add member.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!form.name.trim() || !form.designation.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to update team member");

      setEditingId(null);
      setFeedback({ text: "Team member updated successfully.", type: "success" });
      await fetchMembers();
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Failed to update member.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to delete member");

      setConfirmDeleteId(null);
      setFeedback({ text: "Team member removed.", type: "success" });
      await fetchMembers();
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Failed to delete member.",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center text-slate-500 font-medium">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mr-2" />
        Loading team profiles...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team Members</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {members.length} members
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage chartered accountants, tax consultants, and partner profiles displayed on the About page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
            setForm({ designation: "", image: "", isActive: true, name: "" });
            setFeedback(null);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-sm font-bold transition active:scale-98 cursor-pointer shrink-0 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Add Team Member
        </button>
      </div>

      {/* Floating feedback alert */}
      {feedback && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-xs sm:text-sm flex items-center justify-between gap-3 ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                feedback.type === "success" ? "bg-emerald-600" : "bg-rose-600"
              }`}
            />
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Inline Form to Add Team Member */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Add New Team Member</h3>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Full Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. CA Rajesh Verma"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Designation / Qualifications *
              </label>
              <input
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="e.g. Senior Tax Partner, FCA"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Photo Upload & URL */}
            <div className="sm:col-span-2 lg:col-span-1">
              <MediaImageInput
                label="Profile Photo"
                description="Upload headshot or provide image URL"
                value={form.image}
                defaultImage="/images/team_consulting.png"
                aspectRatio="square"
                onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-slate-300 text-slate-900"
              />
              Show profile publicly on About page
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving || !form.name.trim() || !form.designation.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Form to Edit Team Member */}
      {editingId && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Edit Team Member</h3>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Full Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Designation / Qualifications *
              </label>
              <input
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Photo Upload & URL */}
            <div className="sm:col-span-2 lg:col-span-1">
              <MediaImageInput
                label="Profile Photo"
                description="Upload headshot or provide image URL"
                value={form.image}
                defaultImage="/images/team_consulting.png"
                aspectRatio="square"
                onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-slate-300 text-slate-900"
              />
              Show profile publicly on About page
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdate(editingId)}
                disabled={saving || !form.name.trim() || !form.designation.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Update Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search toolbar */}
      {members.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search member name or designation..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500"
          />
        </div>
      )}

      {/* Grid listing */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-sm mx-auto shadow-xs">
            <Users className="h-10 w-10 mx-auto mb-3 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900">No team members found</h3>
            <p className="text-slate-500 text-xs mt-1">
              {searchTerm ? "No members match your search query." : "Add partner profiles or legal consultants to feature them on the website."}
            </p>
          </div>
        ) : (
          filteredMembers.map((m) => (
            <div
              key={m.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition hover:border-slate-300 ${
                m.isActive ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-700 shrink-0 overflow-hidden">
                  {m.image ? (
                    <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    m.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{m.name}</h4>
                    {!m.isActive && (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{m.designation}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(m.id);
                      setShowAdd(false);
                      setForm({
                        designation: m.designation,
                        image: m.image || "",
                        isActive: m.isActive,
                        name: m.name,
                      });
                      setFeedback(null);
                    }}
                    className="p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition cursor-pointer"
                    title="Edit profile"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(confirmDeleteId === m.id ? null : m.id)}
                    className="p-1.5 border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-lg transition cursor-pointer"
                    title="Delete profile"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Two-step delete confirmation */}
              {confirmDeleteId === m.id && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs flex items-center justify-between gap-2">
                  <span className="text-rose-900 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    Delete {m.name}?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 rounded-md text-slate-600 hover:bg-white text-[11px] font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                      className="px-2 py-1 rounded-md bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700"
                    >
                      {deletingId === m.id ? "Deleting..." : "Confirm"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
