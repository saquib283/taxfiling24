"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Plus, Edit, Trash2, X } from "lucide-react";

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted: boolean;
}

export default function PricingEditorPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<PricingPlan>({ name: "", price: "", description: "", features: [], highlighted: false });
  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(data => {
        if (data.pricing_plans) {
          try { setPlans(JSON.parse(data.pricing_plans)); } catch (e) { setPlans([]); }
        }
        setLoaded(true);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { pricing_plans: JSON.stringify(plans) } }),
    });
    setSaving(false);
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setForm({ ...form, features: [...form.features, featureInput.trim()] });
    setFeatureInput("");
  };

  const removeFeature = (idx: number) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  };

  const savePlan = () => {
    if (editIndex !== null) {
      const updated = [...plans];
      updated[editIndex] = form;
      setPlans(updated);
    } else {
      setPlans([...plans, form]);
    }
    setEditIndex(null);
    setForm({ name: "", price: "", description: "", features: [], highlighted: false });
  };

  const deletePlan = (idx: number) => {
    if (!confirm("Delete this plan?")) return;
    setPlans(plans.filter((_, i) => i !== idx));
  };

  if (!loaded) return <div className="p-6 text-gray-400">Loading pricing plans...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Pricing Plans</h1>
          <p className="text-gray-600">Manage service pricing displayed on the website</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setForm({ name: "", price: "", description: "", features: [], highlighted: false }); setEditIndex(-1); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm">
            <Plus className="h-4 w-4" /> Add Plan
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save to Website"}
          </button>
        </div>
      </div>

      {editIndex !== null && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{editIndex === -1 ? "Add Plan" : "Edit Plan"}</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Plan Name" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="₹4,999" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addFeature()} placeholder="Add a feature and press Enter" className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={addFeature} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.features.map((f, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {f} <button onClick={() => removeFeature(i)}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.highlighted} onChange={e => setForm({ ...form, highlighted: e.target.checked })} className="rounded" />
              Highlight as recommended
            </label>
            <button onClick={savePlan} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
              {editIndex === -1 ? "Add" : "Update"}
            </button>
            <button onClick={() => setEditIndex(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => (
          <div key={i} className={`bg-white rounded-xl shadow-sm border p-6 ${plan.highlighted ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-200"}`}>
            {plan.highlighted && <span className="text-xs font-bold text-blue-600 mb-2 block">★ RECOMMENDED</span>}
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{plan.price}</p>
            <p className="text-sm text-gray-500 mt-1 mb-4">{plan.description}</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              {plan.features.map((f, fi) => <li key={fi} className="flex items-center gap-2">✓ {f}</li>)}
            </ul>
            <div className="flex gap-2">
              <button onClick={() => { setEditIndex(i); setForm({ ...plan }); }} className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 flex items-center justify-center gap-1"><Edit className="h-3 w-3" /> Edit</button>
              <button onClick={() => deletePlan(i)} className="px-3 py-2 hover:bg-red-50 rounded-lg text-xs font-medium text-red-500 flex items-center gap-1"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
