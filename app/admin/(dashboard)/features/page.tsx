"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Plus, Edit, Trash2 } from "lucide-react";

interface Feature {
  title: string;
  description: string;
}

export default function FeaturesEditorPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Feature>({ title: "", description: "" });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(data => {
        if (data.features_list) {
          try { setFeatures(JSON.parse(data.features_list)); } catch (e) { setFeatures([]); }
        }
        setLoaded(true);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { features_list: JSON.stringify(features) } }),
    });
    setSaving(false);
  };

  const saveFeature = () => {
    if (editIndex !== null && editIndex >= 0) {
      const updated = [...features];
      updated[editIndex] = form;
      setFeatures(updated);
    } else {
      setFeatures([...features, form]);
    }
    setEditIndex(null);
    setForm({ title: "", description: "" });
  };

  const deleteFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  if (!loaded) return <div className="p-6 text-gray-400">Loading features...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Features / Why Choose Us</h1>
          <p className="text-gray-600">Manage the feature cards displayed on the homepage</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setForm({ title: "", description: "" }); setEditIndex(-1); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm">
            <Plus className="h-4 w-4" /> Add Feature
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save to Website"}
          </button>
        </div>
      </div>

      {editIndex !== null && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{editIndex === -1 ? "Add Feature" : "Edit Feature"}</h3>
          <div className="space-y-4">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Feature title (e.g., 100% Compliance Guarantee)" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2">
              <button onClick={saveFeature} disabled={!form.title} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{editIndex === -1 ? "Add" : "Update"}</button>
              <button onClick={() => setEditIndex(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h4 className="font-semibold text-gray-900 text-sm mb-2">{f.title}</h4>
            <p className="text-xs text-gray-500 mb-4 line-clamp-3">{f.description}</p>
            <div className="flex gap-2">
              <button onClick={() => { setEditIndex(i); setForm({ ...f }); }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 flex items-center gap-1"><Edit className="h-3 w-3" /> Edit</button>
              <button onClick={() => deleteFeature(i)} className="px-3 py-1.5 hover:bg-red-50 rounded-lg text-xs font-medium text-red-500 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
