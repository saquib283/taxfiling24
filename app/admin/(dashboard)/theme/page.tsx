"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [settings, setSettings] = useState({
    theme_primary: "#0F4C81",
    theme_accent: "#0088CC",
    theme_radius: "1",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        setSettings(prev => ({
          theme_primary: data.theme_primary || prev.theme_primary,
          theme_accent: data.theme_accent || prev.theme_accent,
          theme_radius: data.theme_radius || prev.theme_radius,
        }));
        setLoading(false);
      })
      .catch(() => {
        setMessage({ text: "Failed to load theme settings", type: "error" });
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setMessage({ text: "Theme updated! Refresh the page to see full changes.", type: "success" });
      } else {
        setMessage({ text: "Failed to save theme settings.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Something went wrong.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Theme & Styles</h1>
          <p className="text-gray-600">Customize the colors and borders of your application</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 mb-6 rounded-lg text-sm border ${
          message.type === "success" 
            ? "bg-green-50 text-green-600 border-green-100" 
            : "bg-red-50 text-red-600 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Brand Colors</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="theme_primary"
                  value={settings.theme_primary}
                  onChange={handleChange}
                  className="h-10 w-12 border border-gray-300 rounded-lg cursor-pointer p-1"
                />
                <input
                  type="text"
                  name="theme_primary"
                  value={settings.theme_primary}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="theme_accent"
                  value={settings.theme_accent}
                  onChange={handleChange}
                  className="h-10 w-12 border border-gray-300 rounded-lg cursor-pointer p-1"
                />
                <input
                  type="text"
                  name="theme_accent"
                  value={settings.theme_accent}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Aesthetics</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                <span>Corner Radius (Borders)</span>
                <span className="font-mono text-gray-500">{settings.theme_radius}rem</span>
              </label>
              <input
                type="range"
                name="theme_radius"
                min="0"
                max="2"
                step="0.1"
                value={settings.theme_radius}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
