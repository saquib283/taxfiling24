"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { SITE_CONTENT_DEFAULTS, ABOUT_FEATURES, FEATURES, PROCESS_STEPS } from "@/lib/constants";

const CONTENT_SECTIONS = [
  {
    label: "Hero Section",
    fields: [
      { key: "hero_badge", label: "Badge Text", placeholder: "Complete Business Solutions", defaultValue: "Complete Business Solutions" },
      { key: "hero_headline", label: "Headline", placeholder: SITE_CONTENT_DEFAULTS.hero_headline, defaultValue: SITE_CONTENT_DEFAULTS.hero_headline },
      { key: "hero_subheading", label: "Subheading", placeholder: SITE_CONTENT_DEFAULTS.hero_subheading, defaultValue: SITE_CONTENT_DEFAULTS.hero_subheading },
      { key: "hero_cta_primary", label: "Primary Button Text", placeholder: "Talk To Expert", defaultValue: "Talk To Expert" },
      { key: "hero_cta_secondary", label: "Secondary Button Text", placeholder: "Explore Services", defaultValue: "Explore Services" },
    ]
  },
  {
    label: "About Section",
    fields: [
      { key: "about_title", label: "Title", placeholder: SITE_CONTENT_DEFAULTS.about_title, defaultValue: SITE_CONTENT_DEFAULTS.about_title },
      { key: "about_description", label: "Description", placeholder: SITE_CONTENT_DEFAULTS.about_description, defaultValue: SITE_CONTENT_DEFAULTS.about_description, type: "textarea" },
      { 
        key: "about_features_json", 
        label: "Features List", 
        type: "json_array", 
        defaultValue: JSON.stringify(ABOUT_FEATURES),
        itemFields: [
          { key: "title", label: "Title", placeholder: "Accuracy" },
          { key: "description", label: "Description", placeholder: "100% Guaranteed", type: "textarea" },
        ]
      },
    ]
  },
  {
    label: "Stats (Numbers)",
    fields: [
      { key: "stats_clients", label: "Happy Clients", placeholder: SITE_CONTENT_DEFAULTS.stats_clients, defaultValue: SITE_CONTENT_DEFAULTS.stats_clients },
      { key: "stats_experience", label: "Years Experience", placeholder: SITE_CONTENT_DEFAULTS.stats_experience, defaultValue: SITE_CONTENT_DEFAULTS.stats_experience },
      { key: "stats_services", label: "Services Offered", placeholder: "50+", defaultValue: "50+" },
      { key: "stats_satisfaction", label: "Satisfaction Rate", placeholder: "99%", defaultValue: "99%" },
    ]
  },
  {
    label: "CTA Section",
    fields: [
      { key: "cta_headline", label: "Headline", placeholder: "Ready to Get Started?", defaultValue: "Ready to Get Started?" },
      { key: "cta_subtext", label: "Subtext", placeholder: "Book a free consultation...", defaultValue: "Book a free consultation..." },
      { key: "cta_button_text", label: "Button Text", placeholder: "Schedule Consultation", defaultValue: "Schedule Consultation" },
    ]
  },
  {
    label: "Contact Info",
    fields: [
      { key: "contact_phone", label: "Phone", placeholder: "+91 7011246157", defaultValue: "+91 7011246157" },
      { key: "contact_email", label: "Email", placeholder: "support@taxfiling24.com", defaultValue: "support@taxfiling24.com" },
      { key: "contact_address", label: "Address", placeholder: "E-244/G First Floor...", defaultValue: "E-244/G First Floor Shaheen Bagh, Okhla New Delhi 110025", type: "textarea" },
      { key: "contact_whatsapp", label: "WhatsApp Number", placeholder: "917011246157", defaultValue: "917011246157" },
    ]
  },
  {
    label: "Social Links",
    fields: [
      { key: "social_facebook", label: "Facebook URL", placeholder: "https://facebook.com/...", defaultValue: "" },
      { key: "social_linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/...", defaultValue: "" },
      { key: "social_twitter", label: "Twitter / X URL", placeholder: "https://x.com/...", defaultValue: "" },
      { key: "social_instagram", label: "Instagram URL", placeholder: "https://instagram.com/...", defaultValue: "" },
    ]
  },
  {
    label: "Footer",
    fields: [
      { key: "footer_tagline", label: "Footer Tagline", placeholder: "Taxfiling24 makes tax and compliance simple...", defaultValue: "Taxfiling24 makes tax and compliance simple. We handle filings, registrations, and GST work so you can focus on your business." },
      { key: "footer_copyright", label: "Copyright Text", placeholder: "© 2025 TaxFiling24. All rights reserved.", defaultValue: `© ${new Date().getFullYear()} TaxFiling24. All rights reserved.` },
    ]
  },
  {
    label: "Pricing Plans",
    fields: [
      { 
        key: "pricing_plans", 
        label: "Plans Configuration", 
        type: "json_array", 
        defaultValue: "[]",
        itemFields: [
          { key: "name", label: "Plan Name", placeholder: "Standard" },
          { key: "price", label: "Price Text", placeholder: "₹9,999" },
          { key: "description", label: "Description", placeholder: "For growing businesses" },
          { key: "features", label: "Features (Comma Separated)", placeholder: "Feature 1, Feature 2" },
          { key: "highlighted", label: "Highlighted (true/false)", placeholder: "false" },
        ]
      },
    ]
  },
  {
    label: "Announcement Banner",
    fields: [
      { key: "announcement_active", label: "Banner Active (true/false)", placeholder: "false", defaultValue: "false" },
      { key: "announcement_text", label: "Banner Text", placeholder: "ITR filing deadline extended!", defaultValue: "" },
      { key: "announcement_link", label: "Banner Link (optional)", placeholder: "/services", defaultValue: "" },
      { key: "announcement_bg", label: "Banner Color", placeholder: "#0F4C81", defaultValue: "#0F4C81" },
    ]
  },
  {
    label: "Services Section",
    fields: [
      { key: "services_title", label: "Title", placeholder: "Services We Offer", defaultValue: "Services We Offer" },
      { key: "services_subtext", label: "Subtext", placeholder: "Explore our comprehensive tax and legal services.", defaultValue: "Explore our comprehensive tax and legal services." },
    ]
  },
  {
    label: "Process Section",
    fields: [
      { key: "process_badge", label: "Badge Text", placeholder: "How It Works", defaultValue: "How It Works" },
      { key: "process_title", label: "Title", placeholder: "Our Strategic Operating Model", defaultValue: "Our Strategic Operating Model" },
      { key: "process_subtext", label: "Subtext", placeholder: "Our four-stage framework ensures absolute compliance...", defaultValue: "Our four-stage framework ensures absolute compliance..." },
      { 
        key: "process_steps_json", 
        label: "Steps Configuration", 
        type: "json_array", 
        defaultValue: JSON.stringify(PROCESS_STEPS),
        itemFields: [
          { key: "step", label: "Step Number", placeholder: "01" },
          { key: "title", label: "Title", placeholder: "Strategic Discovery" },
          { key: "description", label: "Description", placeholder: "Initial consultation...", type: "textarea" },
          { key: "image", label: "Image URL / Path", placeholder: "/images/process_discovery.png" },
        ]
      },
    ]
  },
  {
    label: "Features Section",
    fields: [
      { key: "features_title", label: "Title", placeholder: SITE_CONTENT_DEFAULTS.features_title, defaultValue: SITE_CONTENT_DEFAULTS.features_title },
      { key: "features_description", label: "Description", placeholder: SITE_CONTENT_DEFAULTS.features_description, defaultValue: SITE_CONTENT_DEFAULTS.features_description },
      { 
        key: "features_list", 
        label: "Detailed Features", 
        type: "json_array", 
        defaultValue: JSON.stringify(FEATURES),
        itemFields: [
          { key: "title", label: "Title", placeholder: "Strategic Compliance" },
          { key: "description", label: "Description", placeholder: "We go beyond periodic filings...", type: "textarea" },
        ]
      },
    ]
  },
  {
    label: "Testimonials Section",
    fields: [
      { key: "testimonials_title", label: "Title", placeholder: "What Our Clients Say", defaultValue: "What Our Clients Say" },
      { key: "testimonials_subtext", label: "Subtext", placeholder: "Trusted by thousands of businesses across India.", defaultValue: "Trusted by thousands of businesses across India." },
    ]
  },
  {
    label: "Articles Section",
    fields: [
      { key: "articles_title", label: "Title", placeholder: "Latest Insights", defaultValue: "Latest Insights" },
      { key: "articles_subtext", label: "Subtext", placeholder: "Stay updated with the latest in tax, compliance, and corporate law.", defaultValue: "Stay updated with the latest in tax, compliance, and corporate law." },
    ]
  },
  {
    label: "Compliance Calendar",
    fields: [
      { key: "calendar_title", label: "Title", placeholder: "Tax Compliance Calendar", defaultValue: "Tax Compliance Calendar" },
      { key: "calendar_subtext", label: "Subtext", placeholder: "Never miss a due date. Stay ahead with our monthly compliance tracker.", defaultValue: "Never miss a due date. Stay ahead with our monthly compliance tracker." },
    ]
  },
  {
    label: "FAQ Section",
    fields: [
      { key: "faq_title", label: "Title", placeholder: "Frequently Asked Questions", defaultValue: "Frequently Asked Questions" },
      { key: "faq_subtext", label: "Subtext", placeholder: "Find answers to our most common queries regarding tax filing and incorporation.", defaultValue: "Find answers to our most common queries regarding tax filing and incorporation." },
    ]
  },
  {
    label: "Guidance Banner",
    fields: [
      { key: "guidance_title", label: "Headline", placeholder: "Need Expert Guidance?", defaultValue: "Need Expert Guidance?" },
      { key: "guidance_button", label: "Button Text", placeholder: "Request a Call Back", defaultValue: "Request a Call Back" },
    ]
  },
];

function JsonArrayEditor({ 
  value, 
  onChange, 
  itemFields 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  itemFields: any[] 
}) {
  let items = [];
  try {
    items = JSON.parse(value || "[]");
    if (!Array.isArray(items)) items = [];
  } catch (e) {
    items = [];
  }

  const updateItem = (index: number, fieldKey: string, val: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [fieldKey]: val };
    onChange(JSON.stringify(newItems));
  };

  const addItem = () => {
    onChange(JSON.stringify([...items, {}]));
  };

  const removeItem = (index: number) => {
    onChange(JSON.stringify(items.filter((_: any, i: number) => i !== index)));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    onChange(JSON.stringify(newItems));
  };

  return (
    <div className="space-y-4">
      {items.map((item: any, idx: number) => (
        <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative group">
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => moveItem(idx, 'up')} className="p-1 hover:bg-gray-200 rounded"><ChevronUp className="h-4 w-4 text-gray-500" /></button>
            <button onClick={() => moveItem(idx, 'down')} className="p-1 hover:bg-gray-200 rounded"><ChevronDown className="h-4 w-4 text-gray-500" /></button>
            <button onClick={() => removeItem(idx)} className="p-1 hover:bg-red-100 rounded text-red-500"><Trash2 className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {itemFields.map(f => (
              <div key={f.key}>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    value={item[f.key] || ""}
                    onChange={e => updateItem(idx, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={item[f.key] || ""}
                    onChange={e => updateItem(idx, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-sm font-medium">
        <Plus className="h-4 w-4" /> Add New Item
      </button>
    </div>
  );
}

export default function ContentEditorPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(data => { setValues(data); setLoaded(true); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: values }),
    });
    setSaving(false);
  };

  if (!loaded) return <div className="p-6 text-gray-400">Loading content settings...</div>;

  const section = CONTENT_SECTIONS[activeTab];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Content Editor</h1>
          <p className="text-gray-600">Manage all text content on the website</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Tabs */}
        <div className="w-56 shrink-0 space-y-1">
          {CONTENT_SECTIONS.map((s, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === i ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{section.label}</h2>
          <div className="space-y-5">
            {section.fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                {((field as any).type === "json_array") ? (
                  <JsonArrayEditor 
                    value={values[field.key] ?? (field as any).defaultValue ?? "[]"} 
                    onChange={val => setValues({ ...values, [field.key]: val })}
                    itemFields={(field as any).itemFields}
                  />
                ) : (field as any).type === "textarea" ? (
                  <textarea
                    value={values[field.key] ?? (field as any).defaultValue ?? ""}
                    onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <input
                    type="text"
                    value={values[field.key] ?? (field as any).defaultValue ?? ""}
                    onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
                <p className="text-xs text-gray-400 mt-1">Key: <code className="bg-gray-100 px-1 rounded">{field.key}</code></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
