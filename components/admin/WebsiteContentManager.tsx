"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  FilePlus2,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import {
  createRepeaterItem,
  createSectionFromTemplate,
  getManagedPageDefinitions,
  getManagedPageSections,
  ManagedPageKey,
  ManagedSection,
  RepeaterFieldDefinition,
} from "@/lib/managed-pages";
import MediaImageInput from "@/components/admin/MediaImageInput";

type PagesState = Record<ManagedPageKey, ManagedSection[]>;

function createPagesState(keys: ManagedPageKey[]): PagesState {
  return Object.fromEntries(keys.map((key) => [key, [] as ManagedSection[]])) as PagesState;
}

function resolvePreviewRoute(route: string) {
  if (!route || !route.startsWith("/")) return "/";
  if (route.includes("[slug]")) {
    return route.replace(/\/\[slug\].*$/, "") || "/";
  }
  return route;
}

function moveItem<T>(items: T[], index: number, direction: "up" | "down") {
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= items.length) {
    return items;
  }

  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function RepeaterEditor({
  field,
  items,
  onChange,
}: {
  field: RepeaterFieldDefinition;
  items: Array<Record<string, unknown>>;
  onChange: (items: Array<Record<string, unknown>>) => void;
}) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{field.label}</h4>
          <p className="text-xs text-slate-400 mt-0.5">Manage, reorder, or toggle visibility of sub-items.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...safeItems, createRepeaterItem(field)])}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm active:scale-98 cursor-pointer self-start"
        >
          <Plus className="h-3.5 w-3.5" />
          {field.addLabel || "Add item"}
        </button>
      </div>

      <div className="space-y-3">
        {safeItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-400 font-medium">
            No list items registered yet. Click &quot;{field.addLabel || "Add item"}&quot; to get started.
          </div>
        ) : null}

        {safeItems.map((item, index) => (
          <div key={String(item.id || index)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm relative transition hover:border-slate-300 duration-200">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  #{String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[180px] sm:max-w-xs">
                  {String(item.title || item.label || item.text || item.step || "Unlabeled item")}
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      safeItems.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, isVisible: entry.isVisible === false } : entry
                      )
                    )
                  }
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition ${
                    item.isVisible === false
                      ? "bg-slate-50 text-slate-500 border-slate-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-100"
                  }`}
                >
                  {item.isVisible === false ? "Hidden" : "Visible"}
                </button>
                <button
                  type="button"
                  onClick={() => onChange(moveItem(safeItems, index, "up"))}
                  className="rounded-lg p-1.5 border border-slate-100 text-slate-500 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                  title="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(moveItem(safeItems, index, "down"))}
                  className="rounded-lg p-1.5 border border-slate-100 text-slate-500 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                  title="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Remove this item from the list?")) {
                      onChange(safeItems.filter((_, entryIndex) => entryIndex !== index));
                    }
                  }}
                  className="rounded-lg p-1.5 border border-rose-100 text-rose-600 hover:bg-rose-50 transition active:scale-95 cursor-pointer"
                  title="Delete item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 pt-3 border-t border-slate-50">
              {field.fields.map((subField) => {
                const value = String(item[subField.key] ?? "");

                // Image field inside repeater
                if (subField.type === "image") {
                  return (
                    <div key={subField.key}>
                      <MediaImageInput
                        label={subField.label}
                        value={value}
                        defaultImage={subField.defaultImage}
                        aspectRatio="square"
                        onChange={(url) =>
                          onChange(
                            safeItems.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, [subField.key]: url } : entry
                            )
                          )
                        }
                      />
                    </div>
                  );
                }

                if (subField.type === "textarea") {
                  return (
                    <label key={subField.key} className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {subField.label}
                      </span>
                      <textarea
                        rows={subField.rows || 3}
                        value={value}
                        onChange={(event) =>
                          onChange(
                            safeItems.map((entry, entryIndex) =>
                              entryIndex === index ? { ...entry, [subField.key]: event.target.value } : entry
                            )
                          )
                        }
                        placeholder={subField.placeholder}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none placeholder-slate-400 focus:border-indigo-500 transition resize-none"
                      />
                    </label>
                  );
                }

                return (
                  <label key={subField.key} className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {subField.label}
                    </span>
                    <input
                      type="text"
                      value={value}
                      onChange={(event) =>
                        onChange(
                          safeItems.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, [subField.key]: event.target.value } : entry
                          )
                        )
                      }
                      placeholder={subField.placeholder}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none placeholder-slate-400 focus:border-indigo-500 transition"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WebsiteContentManager() {
  const definitions = useMemo(() => getManagedPageDefinitions(), []);
  const pageKeys = useMemo(() => definitions.map((definition) => definition.key), [definitions]);
  const [activePage, setActivePage] = useState<ManagedPageKey>(pageKeys[0] || "home");
  const [pages, setPages] = useState<PagesState>(() => createPagesState(pageKeys));
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [dirtyPages, setDirtyPages] = useState<ManagedPageKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const currentDefinition = definitions.find((definition) => definition.key === activePage)!;
  const currentSections = useMemo(() => pages[activePage] || [], [activePage, pages]);
  const selectedSection = currentSections.find((section) => section.id === selectedSectionId) || currentSections[0];
  const selectedTemplate = selectedSection
    ? currentDefinition.templates.find((template) => template.type === selectedSection.type)
    : undefined;

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load website settings");
        return response.json();
      })
      .then((data) => {
        setPages(
          Object.fromEntries(
            definitions.map((definition) => [definition.key, getManagedPageSections(definition.key, data)])
          ) as PagesState
        );
        setLoading(false);
      })
      .catch(() => {
        setPages(
          Object.fromEntries(
            definitions.map((definition) => [definition.key, getManagedPageSections(definition.key)])
          ) as PagesState
        );
        setMessage({ text: "Could not load saved page sections. Showing defaults.", type: "error" });
        setLoading(false);
      });
  }, [definitions]);

  useEffect(() => {
    if (!currentSections.length) {
      setSelectedSectionId("");
      return;
    }

    if (!currentSections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(currentSections[0].id);
    }
  }, [activePage, currentSections, selectedSectionId]);

  const availableTemplates = currentDefinition.templates.filter(
    (template) => template.allowMultiple || !currentSections.some((section) => section.type === template.type)
  );

  const updateCurrentSections = (nextSections: ManagedSection[]) => {
    setPages((current) => ({
      ...current,
      [activePage]: nextSections,
    }));
    setDirtyPages((prev) => (prev.includes(activePage) ? prev : [...prev, activePage]));
  };

  const updateSelectedSection = (updater: (section: ManagedSection) => ManagedSection) => {
    if (!selectedSection) {
      return;
    }

    updateCurrentSections(
      currentSections.map((section) => (section.id === selectedSection.id ? updater(section) : section))
    );
  };

  const saveAll = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const keysToSave = dirtyPages.length > 0 ? dirtyPages : [activePage];
      const settings = Object.fromEntries(
        definitions
          .filter((definition) => keysToSave.includes(definition.key))
          .map((definition) => [definition.settingKey, JSON.stringify(pages[definition.key] || [])])
      );

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const d = await response.json().catch(() => ({}));
        throw new Error(d.error || "Failed to save website content.");
      }

      setDirtyPages([]);
      setMessage({ text: "Website content saved and published successfully!", type: "success" });
      setTimeout(() => setMessage(null), 4000);
    } catch (error: unknown) {
      setMessage({ text: error instanceof Error ? error.message : "Something went wrong while saving.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 min-h-screen pb-24">
      {/* Header element with save action */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
            Website Content Manager
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Customize marketing sections, images, ordering, and block visibility across the entire public website.
          </p>
        </div>

        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-98 shrink-0"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Publishing to Website..." : "Save Website Content"}
        </button>
      </header>

      {/* Floating feedback alert */}
      {message && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-semibold flex items-center justify-between transition-all duration-300 shadow-sm animate-in fade-in ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                message.type === "success" ? "bg-emerald-500 animate-ping" : "bg-red-500"
              }`}
            />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Page Selector Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto whitespace-nowrap gap-1">
        {definitions.map((definition) => (
          <button
            key={definition.key}
            type="button"
            onClick={() => {
              setActivePage(definition.key);
              setSelectedSectionId("");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activePage === definition.key
                ? "bg-white text-indigo-600 shadow-md scale-[1.01]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            {definition.label}
          </button>
        ))}
      </div>

      {/* Page Info Banner */}
      <div className="bg-gradient-to-r from-indigo-50/40 via-white to-indigo-50/20 rounded-2xl border border-indigo-100 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            Configuring: {currentDefinition.label}
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-2xl">
            {currentDefinition.description}
          </p>
        </div>
        <a
          href={resolvePreviewRoute(currentDefinition.route)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline shrink-0 bg-white border border-indigo-100 px-4 py-2.5 rounded-xl shadow-xs transition active:scale-98"
        >
          <span>View Live Page</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Main Workspace Panels */}
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)] items-start">
        {/* Left Column: Sections manager & Add sections */}
        <div className="space-y-6">
          {/* Section listing cards */}
          <section className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-950">Page Layout Blocks</h2>
                <p className="text-xs text-slate-400 mt-0.5">Click any block to edit its content.</p>
              </div>
              <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                {currentSections.length} Blocks
              </span>
            </div>

            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {currentSections.map((section, index) => {
                const isSelected = selectedSection?.id === section.id;
                return (
                  <div
                    key={section.id}
                    className={`rounded-2xl border transition duration-200 relative overflow-hidden flex flex-col ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-start p-4 gap-2">
                      {/* Reorder Grip handle icon */}
                      <div className="text-slate-300 self-center p-1">
                        <GripVertical className="h-4 w-4" />
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedSectionId(section.id)}
                        className="flex-1 text-left min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? "text-indigo-950" : "text-slate-800"}`}>
                            {section.label}
                          </h4>
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${section.isVisible ? "bg-emerald-500" : "bg-slate-300"}`} />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate leading-normal">
                          {section.description}
                        </p>
                      </button>
                    </div>

                    {/* Footer actions inside block card */}
                    <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-slate-100/80 bg-slate-50/40 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          updateCurrentSections(
                            currentSections.map((entry) =>
                              entry.id === section.id ? { ...entry, isVisible: !entry.isVisible } : entry
                            )
                          )
                        }
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold border transition cursor-pointer ${
                          section.isVisible
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        {section.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {section.isVisible ? "Visible" : "Hidden"}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateCurrentSections(moveItem(currentSections, index, "up"))}
                          className="rounded-lg p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                          title="Move block up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCurrentSections(moveItem(currentSections, index, "down"))}
                          className="rounded-lg p-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                          title="Move block down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm(`Remove the "${section.label}" block from this page?`)) {
                              return;
                            }
                            const next = currentSections.filter((entry) => entry.id !== section.id);
                            updateCurrentSections(next);
                            if (selectedSectionId === section.id) {
                              setSelectedSectionId(next[0]?.id || "");
                            }
                          }}
                          className="rounded-lg p-1.5 border border-rose-100 text-rose-600 hover:bg-rose-50 transition active:scale-95 cursor-pointer"
                          title="Delete block"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Add optional templates */}
          <section className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <FilePlus2 className="h-5 w-5 text-indigo-500" />
              <div>
                <h2 className="text-base font-bold text-slate-950">Add Page Section</h2>
                <p className="text-xs text-slate-400 mt-0.5">Introduce optional content blocks onto the layout list.</p>
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {availableTemplates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs text-slate-400 font-semibold leading-relaxed">
                  All available section blocks for this page template are already added.
                </div>
              ) : (
                availableTemplates.map((template) => (
                  <button
                    key={template.type}
                    type="button"
                    onClick={() => {
                      const nextSection = createSectionFromTemplate(template);
                      const nextSections = [...currentSections, nextSection];
                      updateCurrentSections(nextSections);
                      setSelectedSectionId(nextSection.id);
                    }}
                    className="block w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer duration-200"
                  >
                    <p className="text-xs font-bold text-slate-800">{template.label}</p>
                    <p className="mt-1 text-[11px] text-slate-400 leading-normal">{template.description}</p>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Custom details canvas editor */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs min-h-[500px]">
          {!selectedSection || !selectedTemplate ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/20 border border-dashed border-slate-200 rounded-2xl min-h-[440px]">
              <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <FilePlus2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Select Section</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                Click on any page layout block in the left sidebar to display its inputs and manage content.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-900">{selectedSection.label}</h2>
                    <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {selectedSection.type}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{selectedSection.description}</p>
                </div>
              </div>

              <div className="space-y-5">
                {selectedTemplate.fields.map((field) => {
                  const value = selectedSection.data[field.key];

                  // Image field with dual upload/link and main image reference
                  if (field.type === "image") {
                    return (
                      <MediaImageInput
                        key={field.key}
                        label={field.label}
                        value={String(value ?? "")}
                        defaultImage={field.defaultImage}
                        placeholder={field.placeholder}
                        onChange={(url) =>
                          updateSelectedSection((section) => ({
                            ...section,
                            data: {
                              ...section.data,
                              [field.key]: url,
                            },
                          }))
                        }
                      />
                    );
                  }

                  if (field.type === "repeater") {
                    return (
                      <RepeaterEditor
                        key={field.key}
                        field={field}
                        items={Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []}
                        onChange={(items) =>
                          updateSelectedSection((section) => ({
                            ...section,
                            data: {
                              ...section.data,
                              [field.key]: items,
                            },
                          }))
                        }
                      />
                    );
                  }

                  if (field.type === "textarea") {
                    return (
                      <label key={field.key} className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          {field.label}
                        </span>
                        <textarea
                          rows={field.rows || 4}
                          value={String(value ?? "")}
                          onChange={(event) =>
                            updateSelectedSection((section) => ({
                              ...section,
                              data: {
                                ...section.data,
                                [field.key]: event.target.value,
                              },
                            }))
                          }
                          placeholder={field.placeholder}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition resize-none"
                        />
                      </label>
                    );
                  }

                  return (
                    <label key={field.key} className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        {field.label}
                      </span>
                      <input
                        type="text"
                        value={String(value ?? "")}
                        onChange={(event) =>
                          updateSelectedSection((section) => ({
                            ...section,
                            data: {
                              ...section.data,
                              [field.key]: event.target.value,
                            },
                          }))
                        }
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Sticky Bottom Save Action Bar */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl bg-slate-900/95 backdrop-blur-md px-6 py-3.5 text-white shadow-2xl border border-slate-700/60 mt-6 animate-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-200">
            Configuring: <strong className="text-white">{currentDefinition.label}</strong>
            {selectedSection && (
              <>
                {" "}&bull; <span className="text-indigo-300 font-semibold">{selectedSection.label}</span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={resolvePreviewRoute(currentDefinition.route)}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
          >
            <span>Preview Live</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saving ? "Saving Changes..." : "Save Website Content"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
