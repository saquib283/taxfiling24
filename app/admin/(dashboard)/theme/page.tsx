"use client";

import { useState, useEffect, useMemo } from "react";
import { Save, Loader2, Palette, Type, SunMoon, Sparkles, RotateCcw, Eye, Columns2, SquareRoundCorner } from "lucide-react";
import { motion } from "framer-motion";

/* ─── Preset Themes ─── */
const THEME_PRESETS = [
  {
    name: "Navy Gold",
    desc: "Premium & trustworthy",
    primary: "#0A2540",
    accent: "#D4AF37",
    bg: "#F8FAFC",
    fgMuted: "#475569",
  },
  {
    name: "Ocean Blue",
    desc: "Clean & professional",
    primary: "#0F4C81",
    accent: "#0088CC",
    bg: "#F8FAFC",
    fgMuted: "#475569",
  },
  {
    name: "Forest Green",
    desc: "Nature & growth",
    primary: "#14532D",
    accent: "#22C55E",
    bg: "#F9FAFB",
    fgMuted: "#4B5563",
  },
  {
    name: "Charcoal Rose",
    desc: "Modern & elegant",
    primary: "#1F2937",
    accent: "#F43F5E",
    bg: "#FAFAFB",
    fgMuted: "#6B7280",
  },
  {
    name: "Royal Purple",
    desc: "Creative & bold",
    primary: "#4C1D95",
    accent: "#A78BFA",
    bg: "#FAFAFE",
    fgMuted: "#6B7280",
  },
  {
    name: "Warm Amber",
    desc: "Friendly & inviting",
    primary: "#78350F",
    accent: "#F59E0B",
    bg: "#FFFBEB",
    fgMuted: "#92400E",
  },
];

/* ─── Font Options ─── */
const FONT_OPTIONS = [
  { value: "Outfit", label: "Outfit", style: "font-sans", sample: "Aa Bb Cc 123" },
  { value: "Inter", label: "Inter", style: "font-sans", sample: "Aa Bb Cc 123" },
  { value: "Poppins", label: "Poppins", style: "font-sans", sample: "Aa Bb Cc 123" },
  { value: "DM Sans", label: "DM Sans", style: "font-sans", sample: "Aa Bb Cc 123" },
  { value: "Roboto", label: "Roboto", style: "font-sans", sample: "Aa Bb Cc 123" },
  { value: "Playfair Display", label: "Playfair Display", style: "font-serif", sample: "Aa Bb Cc 123" },
  { value: "Merriweather", label: "Merriweather", style: "font-serif", sample: "Aa Bb Cc 123" },
  { value: "Source Code Pro", label: "Source Code Pro", style: "font-mono", sample: "Aa Bb Cc 123" },
];

const FONT_SIZE_OPTIONS = [
  { value: "14", label: "Small (14px)" },
  { value: "15", label: "Default (15px)" },
  { value: "16", label: "Medium (16px)" },
  { value: "17", label: "Large (17px)" },
  { value: "18", label: "Extra Large (18px)" },
];

const SHADOW_STYLES = [
  { value: "none", label: "None", desc: "Flat design with no shadows" },
  { value: "subtle", label: "Subtle", desc: "Minimal depth with soft shadows" },
  { value: "medium", label: "Medium", desc: "Balanced shadow depth" },
  { value: "elevated", label: "Elevated", desc: "Prominent lifted card look" },
];

const DEFAULTS = {
  theme_primary: "#0A2540",
  theme_accent: "#D4AF37",
  theme_radius: "0.75",
  theme_font: "Outfit",
  theme_font_size: "15",
  theme_shadow: "subtle",
  theme_mode: "light",
};

export default function ThemePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [settings, setSettings] = useState({ ...DEFAULTS });
  const [activeTab, setActiveTab] = useState<"presets" | "colors" | "typography" | "layout">("presets");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings((prev) => ({
          theme_primary: data.theme_primary || prev.theme_primary,
          theme_accent: data.theme_accent || prev.theme_accent,
          theme_radius: data.theme_radius || prev.theme_radius,
          theme_font: data.theme_font || prev.theme_font,
          theme_font_size: data.theme_font_size || prev.theme_font_size,
          theme_shadow: data.theme_shadow || prev.theme_shadow,
          theme_mode: data.theme_mode || prev.theme_mode,
        }));
        setLoading(false);
      })
      .catch(() => {
        setMessage({ text: "Failed to load theme settings", type: "error" });
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: (typeof THEME_PRESETS)[0]) => {
    setSettings((prev) => ({
      ...prev,
      theme_primary: preset.primary,
      theme_accent: preset.accent,
    }));
  };

  const resetToDefaults = () => {
    setSettings({ ...DEFAULTS });
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
        setMessage({
          text: "Theme updated! Refresh the page to see full changes.",
          type: "success",
        });
      } else {
        setMessage({ text: "Failed to save theme settings.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Something went wrong.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Live preview style computation
  const previewStyle = useMemo(
    () => ({
      "--preview-primary": settings.theme_primary,
      "--preview-accent": settings.theme_accent,
      "--preview-radius": `${settings.theme_radius}rem`,
      "--preview-font-size": `${settings.theme_font_size}px`,
      fontFamily: `${settings.theme_font}, system-ui, sans-serif`,
    }),
    [settings]
  ) as React.CSSProperties;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="text-sm text-gray-400">Loading theme settings…</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "presets" as const, label: "Presets", icon: Sparkles },
    { id: "colors" as const, label: "Colors", icon: Palette },
    { id: "typography" as const, label: "Typography", icon: Type },
    { id: "layout" as const, label: "Layout", icon: Columns2 },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-0.5">Theme & Styles</h1>
          <p className="text-sm text-gray-500">
            Customize the look and feel of your website
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-3 mb-5 rounded-lg text-sm border ${
            message.type === "success"
              ? "bg-green-50 text-green-600 border-green-100"
              : "bg-red-50 text-red-600 border-red-100"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Left: Controls ─── */}
          <div className="lg:col-span-2 space-y-0">
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-t-xl p-1 gap-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white border border-gray-200 border-t-0 rounded-b-xl shadow-sm p-6">
              {/* ─── Presets Tab ─── */}
              {activeTab === "presets" && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Theme Presets
                  </h3>
                  <p className="text-xs text-gray-400 mb-5">
                    Select a preset to quickly apply a coordinated color scheme
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {THEME_PRESETS.map((preset) => {
                      const isActive =
                        settings.theme_primary === preset.primary &&
                        settings.theme_accent === preset.accent;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className={`group text-left p-4 rounded-xl border-2 transition-all ${
                            isActive
                              ? "border-blue-500 bg-blue-50/30 shadow-sm"
                              : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
                          }`}
                        >
                          {/* Color Swatches */}
                          <div className="flex gap-1.5 mb-3">
                            <div
                              className="h-8 w-8 rounded-lg shadow-sm border border-black/5"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <div
                              className="h-8 w-8 rounded-lg shadow-sm border border-black/5"
                              style={{ backgroundColor: preset.accent }}
                            />
                            <div
                              className="h-8 flex-1 rounded-lg border border-gray-200"
                              style={{ backgroundColor: preset.bg }}
                            />
                          </div>
                          <p className="text-sm font-bold text-gray-900 mb-0.5 leading-tight">
                            {preset.name}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {preset.desc}
                          </p>
                          {isActive && (
                            <span className="inline-block mt-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── Colors Tab ─── */}
              {activeTab === "colors" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      Brand Colors
                    </h3>
                    <p className="text-xs text-gray-400 mb-5">
                      Fine-tune your primary and accent colors
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Primary */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Primary Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={settings.theme_primary}
                            onChange={(e) =>
                              handleChange("theme_primary", e.target.value)
                            }
                            className="h-10 w-12 border border-gray-300 rounded-lg cursor-pointer p-1"
                          />
                          <input
                            type="text"
                            value={settings.theme_primary}
                            onChange={(e) =>
                              handleChange("theme_primary", e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-700 uppercase"
                          />
                        </div>
                      </div>

                      {/* Accent */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Accent Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={settings.theme_accent}
                            onChange={(e) =>
                              handleChange("theme_accent", e.target.value)
                            }
                            className="h-10 w-12 border border-gray-300 rounded-lg cursor-pointer p-1"
                          />
                          <input
                            type="text"
                            value={settings.theme_accent}
                            onChange={(e) =>
                              handleChange("theme_accent", e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-700 uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mode Toggle */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      Appearance Mode
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Light mode is default. Dark mode support is coming soon.
                    </p>
                    <div className="flex gap-2">
                      {["light", "dark"].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handleChange("theme_mode", mode)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                            settings.theme_mode === mode
                              ? "border-blue-500 bg-blue-50/30 text-gray-900"
                              : "border-gray-100 text-gray-500 hover:border-gray-200"
                          }`}
                        >
                          <SunMoon className="h-4 w-4" />
                          {mode === "light" ? "Light" : "Dark"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Typography Tab ─── */}
              {activeTab === "typography" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      Font Family
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                      Choose a typeface that matches your brand personality
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_OPTIONS.map((font) => (
                        <button
                          key={font.value}
                          type="button"
                          onClick={() => handleChange("theme_font", font.value)}
                          className={`text-left p-3 rounded-xl border-2 transition-all ${
                            settings.theme_font === font.value
                              ? "border-blue-500 bg-blue-50/30"
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <p
                            className="text-lg font-bold text-gray-900 mb-0.5"
                            style={{ fontFamily: `${font.value}, system-ui` }}
                          >
                            {font.sample}
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium">
                            {font.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      Base Font Size
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Controls the default text size across the site
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {FONT_SIZE_OPTIONS.map((size) => (
                        <button
                          key={size.value}
                          type="button"
                          onClick={() =>
                            handleChange("theme_font_size", size.value)
                          }
                          className={`px-4 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                            settings.theme_font_size === size.value
                              ? "border-blue-500 bg-blue-50/30 text-gray-900"
                              : "border-gray-100 text-gray-500 hover:border-gray-200"
                          }`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Layout Tab ─── */}
              {activeTab === "layout" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      Corner Radius
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Control the roundness of buttons, cards and inputs
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2 flex-1">
                        {[
                          { val: "0", label: "Sharp", preview: "rounded-none" },
                          { val: "0.375", label: "Slight", preview: "rounded-sm" },
                          { val: "0.75", label: "Default", preview: "rounded-xl" },
                          { val: "1", label: "Rounded", preview: "rounded-2xl" },
                          { val: "1.5", label: "Pill", preview: "rounded-3xl" },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() =>
                              handleChange("theme_radius", opt.val)
                            }
                            className={`flex-1 flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all ${
                              settings.theme_radius === opt.val
                                ? "border-blue-500 bg-blue-50/30"
                                : "border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            <div
                              className={`h-8 w-8 border-2 border-gray-400 ${opt.preview}`}
                            />
                            <span className="text-[10px] font-semibold text-gray-500">
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      Shadow Style
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Choose the depth effect for cards and elements
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {SHADOW_STYLES.map((shadow) => (
                        <button
                          key={shadow.value}
                          type="button"
                          onClick={() =>
                            handleChange("theme_shadow", shadow.value)
                          }
                          className={`text-left p-4 rounded-xl border-2 transition-all ${
                            settings.theme_shadow === shadow.value
                              ? "border-blue-500 bg-blue-50/30"
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-8 w-12 rounded-lg bg-white border border-gray-200"
                              style={{
                                boxShadow:
                                  shadow.value === "none"
                                    ? "none"
                                    : shadow.value === "subtle"
                                    ? "0 1px 3px rgba(0,0,0,0.06)"
                                    : shadow.value === "medium"
                                    ? "0 4px 12px rgba(0,0,0,0.08)"
                                    : "0 8px 24px rgba(0,0,0,0.12)",
                              }}
                            />
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {shadow.label}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {shadow.desc}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-5">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </motion.button>
            </div>
          </div>

          {/* ─── Right: Live Preview ─── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <Eye className="h-3.5 w-3.5" />
                Live Preview
              </div>

              <div
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                style={previewStyle}
              >
                {/* Mini Navbar */}
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: settings.theme_primary }}
                >
                  <span className="text-white text-xs font-bold tracking-wide">
                    TaxFiling24
                  </span>
                  <div className="flex gap-2">
                    {["Home", "Services", "About"].map((l) => (
                      <span
                        key={l}
                        className="text-white/70 text-[10px] font-medium"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mini Hero */}
                <div className="px-4 py-5 bg-gray-50/50">
                  <div
                    className="h-1.5 rounded-full mb-2 w-3/4"
                    style={{ backgroundColor: settings.theme_primary }}
                  />
                  <div className="h-1.5 rounded-full bg-gray-200 mb-4 w-1/2" />
                  <div
                    className="inline-block px-3 py-1.5 text-white text-[9px] font-bold"
                    style={{
                      backgroundColor: settings.theme_accent,
                      borderRadius: `var(--preview-radius)`,
                    }}
                  >
                    Get Started →
                  </div>
                </div>

                {/* Mini Card Grid */}
                <div className="px-4 py-4 grid grid-cols-2 gap-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="bg-white border border-gray-100 p-3"
                      style={{
                        borderRadius: `var(--preview-radius)`,
                        boxShadow:
                          settings.theme_shadow === "none"
                            ? "none"
                            : settings.theme_shadow === "subtle"
                            ? "0 1px 3px rgba(0,0,0,0.04)"
                            : settings.theme_shadow === "medium"
                            ? "0 4px 8px rgba(0,0,0,0.06)"
                            : "0 6px 16px rgba(0,0,0,0.1)",
                      }}
                    >
                      <div
                        className="h-1 rounded-full mb-2 w-2/3"
                        style={{ backgroundColor: settings.theme_primary }}
                      />
                      <div className="h-1 rounded-full bg-gray-200 mb-1 w-full" />
                      <div className="h-1 rounded-full bg-gray-200 w-4/5" />
                    </div>
                  ))}
                </div>

                {/* Mini Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  <div className="flex gap-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-1 w-6 rounded-full bg-gray-300"
                      />
                    ))}
                  </div>
                  <div
                    className="h-1 w-8 rounded-full"
                    style={{ backgroundColor: settings.theme_accent }}
                  />
                </div>
              </div>

              {/* Current Values Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Current Settings
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Primary</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-3 w-3 rounded-sm border border-black/10"
                        style={{ backgroundColor: settings.theme_primary }}
                      />
                      <span className="font-mono text-gray-600">
                        {settings.theme_primary}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Accent</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-3 w-3 rounded-sm border border-black/10"
                        style={{ backgroundColor: settings.theme_accent }}
                      />
                      <span className="font-mono text-gray-600">
                        {settings.theme_accent}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Font</span>
                    <span className="text-gray-600 font-medium">
                      {settings.theme_font}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Font Size</span>
                    <span className="text-gray-600 font-medium">
                      {settings.theme_font_size}px
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Radius</span>
                    <span className="text-gray-600 font-medium">
                      {settings.theme_radius}rem
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shadow</span>
                    <span className="text-gray-600 font-medium capitalize">
                      {settings.theme_shadow}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
