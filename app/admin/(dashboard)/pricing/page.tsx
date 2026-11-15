"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  Plus,
  Edit,
  Trash2,
  X,
  Star,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Check,
} from "lucide-react";

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
  const [form, setForm] = useState<PricingPlan>({
    name: "",
    price: "",
    description: "",
    features: [],
    highlighted: false,
  });
  const [featureInput, setFeatureInput] = useState("");
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.pricing_plans) {
          try {
            setPlans(JSON.parse(data.pricing_plans));
          } catch {
            setPlans([]);
          }
        }
        setLoaded(true);
      });
  }, []);

  const handleSave = async (customPlans?: PricingPlan[]) => {
    setSaving(true);
    setSaveSuccess(false);
    const plansToSave = customPlans || plans;
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { pricing_plans: JSON.stringify(plansToSave) },
        }),
      });
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to save pricing plans:", e);
    } finally {
      setSaving(false);
    }
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
    if (!form.name.trim() || !form.price.trim()) return;
    let updated: PricingPlan[];
    if (editIndex === -1) {
      updated = [...plans, form];
    } else if (editIndex !== null) {
      updated = [...plans];
      updated[editIndex] = form;
    } else {
      return;
    }
    setPlans(updated);
    setIsDirty(true);
    setEditIndex(null);
    setForm({
      name: "",
      price: "",
      description: "",
      features: [],
      highlighted: false,
    });
  };

  const deletePlan = (idx: number) => {
    const updated = plans.filter((_, i) => i !== idx);
    setPlans(updated);
    setIsDirty(true);
    setDeleteConfirmIdx(null);
  };

  const movePlan = (idx: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= plans.length) return;
    const updated = [...plans];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setPlans(updated);
    setIsDirty(true);
  };

  if (!loaded) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center text-slate-400 font-medium">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
        Loading pricing plans...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pricing Plans</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {plans.length} tiers
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Publish client pricing tiers, included deliverables, and highlight recommended packages.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-fade-in">
              <Check className="h-3.5 w-3.5" /> Published Live
            </span>
          )}
          {isDirty && !saveSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5" /> Unsaved Changes
            </span>
          )}
          <button
            onClick={() => {
              setForm({
                name: "",
                price: "",
                description: "",
                features: [],
                highlighted: false,
              });
              setEditIndex(-1);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs transition active:scale-95 cursor-pointer shadow-2xs"
          >
            <Plus className="h-4 w-4" /> Add Plan
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving || (!isDirty && !saveSuccess)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? "Publishing..." : "Save to Website"}
          </button>
        </div>
      </div>

      {/* Edit Form Card */}
      {editIndex !== null && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">
              {editIndex === -1 ? "Add Pricing Tier" : "Edit Pricing Tier"}
            </h3>
            <button
              onClick={() => setEditIndex(null)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Plan Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Starter, Premium, Enterprise"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Display Price
              </label>
              <input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="e.g. ₹4,999 / year or Custom"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Summary Description
              </label>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Best for salaried individuals with capital gains"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">
              Deliverables & Included Services
            </label>
            <div className="flex items-center gap-2">
              <input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                placeholder="Type an included deliverable and press Enter..."
                className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none shadow-sm"
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-4 py-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {form.features.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-medium"
                >
                  {f}
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="hover:bg-indigo-100 rounded text-indigo-900 transition p-0.5 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {form.features.length === 0 && (
                <span className="text-xs text-slate-400 italic">
                  No deliverables added yet.
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.highlighted}
                onChange={(e) =>
                  setForm({ ...form, highlighted: e.target.checked })
                }
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300"
              />
              Mark as Recommended Tier
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditIndex(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold text-xs transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePlan}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer"
              >
                {editIndex === -1 ? "Add Tier" : "Apply Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid listing */}
      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition duration-200 ${
              plan.highlighted
                ? "border-indigo-400 ring-2 ring-indigo-100"
                : "border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {plan.name}
                </h3>
                {plan.highlighted && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    <Star className="h-3 w-3 fill-current" /> Recommended
                  </span>
                )}
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {plan.price}
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-5 leading-normal">
                {plan.description}
              </p>
              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2 leading-relaxed">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-auto space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => movePlan(i, "left")}
                    disabled={i === 0}
                    title="Move Left"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePlan(i, "right")}
                    disabled={i === plans.length - 1}
                    title="Move Right"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditIndex(i);
                      setForm({ ...plan });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </button>

                  {deleteConfirmIdx === i ? (
                    <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg">
                      <span className="text-[11px] font-semibold text-rose-700 px-1">
                        Delete?
                      </span>
                      <button
                        type="button"
                        onClick={() => deletePlan(i)}
                        className="px-2 py-0.5 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 transition cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmIdx(null)}
                        className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded text-xs transition cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmIdx(i)}
                      className="p-1.5 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-lg transition active:scale-95 cursor-pointer shadow-sm"
                      title="Delete tier"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
