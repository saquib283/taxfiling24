"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FilePlus2,
  Loader2,
  Plus,
  Save,
  Trash2,
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

type PagesState = Record<ManagedPageKey, ManagedSection[]>;

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
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{field.label}</h4>
          <p className="text-xs text-gray-500">Create, reorder, hide, or remove individual items.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...safeItems, createRepeaterItem(field)])}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {field.addLabel || "Add item"}
        </button>
      </div>

      <div className="space-y-3">
        {safeItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
            No items added yet.
          </div>
        ) : null}

        {safeItems.map((item, index) => (
          <div key={String(item.id || index)} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Item {index + 1}</p>
                <p className="text-xs text-gray-500">{String(item.title || item.label || item.text || "Content item")}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      safeItems.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, isVisible: entry.isVisible === false } : entry
                      )
                    )
                  }
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                    item.isVisible === false ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-700"
                  }`}
                >
                  {item.isVisible === false ? "Hidden" : "Visible"}
                </button>
                <button
                  type="button"
                  onClick={() => onChange(moveItem(safeItems, index, "up"))}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(moveItem(safeItems, index, "down"))}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(safeItems.filter((_, entryIndex) => entryIndex !== index))}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {field.fields.map((subField) => {
                const value = String(item[subField.key] ?? "");
                if (subField.type === "textarea") {
                  return (
                    <label key={subField.key} className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none ring-0 transition focus:border-blue-500"
                      />
                    </label>
                  );
                }

                return (
                  <label key={subField.key} className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none ring-0 transition focus:border-blue-500"
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
  const [activePage, setActivePage] = useState<ManagedPageKey>("home");
  const [pages, setPages] = useState<PagesState>({
    home: [],
    about: [],
    contact: [],
    services: [],
    articles: [],
  });
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const currentDefinition = definitions.find((definition) => definition.key === activePage)!;
  const currentSections = useMemo(() => pages[activePage] || [], [activePage, pages]);
  const selectedSection = currentSections.find((section) => section.id === selectedSectionId) || currentSections[0];
  const selectedTemplate = selectedSection
    ? currentDefinition.templates.find((template) => template.type === selectedSection.type)
    : undefined;

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((response) => response.json())
      .then((data) => {
        setPages({
          home: getManagedPageSections("home", data),
          about: getManagedPageSections("about", data),
          contact: getManagedPageSections("contact", data),
          services: getManagedPageSections("services", data),
          articles: getManagedPageSections("articles", data),
        });
        setLoading(false);
      })
      .catch(() => {
        setPages({
          home: getManagedPageSections("home"),
          about: getManagedPageSections("about"),
          contact: getManagedPageSections("contact"),
          services: getManagedPageSections("services"),
          articles: getManagedPageSections("articles"),
        });
        setLoading(false);
      });
  }, []);

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
    setMessage("");

    try {
      const settings = Object.fromEntries(
        definitions.map((definition) => [definition.settingKey, JSON.stringify(pages[definition.key] || [])])
      );

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error("Failed to save website content.");
      }

      setMessage("Website content saved successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Website Content</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Manage homepage and marketing-page sections from one place. You can create, edit, reorder,
            hide, show, and remove sections without touching code.
          </p>
        </div>

        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Website Content"}
        </button>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          {message}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {definitions.map((definition) => (
          <button
            key={definition.key}
            type="button"
            onClick={() => setActivePage(definition.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activePage === definition.key
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {definition.label}
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-900">{currentDefinition.label}</p>
        <p className="mt-1 text-sm text-gray-500">
          {currentDefinition.description} Live route: <span className="font-mono text-gray-700">{currentDefinition.route}</span>
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sections</h2>
                <p className="text-sm text-gray-500">Choose a section to edit its content.</p>
              </div>
            </div>

            <div className="space-y-3">
              {currentSections.map((section, index) => (
                <div
                  key={section.id}
                  className={`rounded-xl border p-3 transition ${
                    selectedSection?.id === section.id ? "border-blue-500 bg-blue-50/60" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedSectionId(section.id)}
                    className="mb-3 block w-full text-left"
                  >
                    <p className="text-sm font-semibold text-gray-900">{section.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{section.description}</p>
                  </button>

                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateCurrentSections(
                          currentSections.map((entry) =>
                            entry.id === section.id ? { ...entry, isVisible: !entry.isVisible } : entry
                          )
                        )
                      }
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                        section.isVisible ? "bg-green-50 text-green-700" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {section.isVisible ? (
                        <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Visible</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" /> Hidden</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentSections(moveItem(currentSections, index, "up"))}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-200"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentSections(moveItem(currentSections, index, "down"))}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-200"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = currentSections.filter((entry) => entry.id !== section.id);
                        updateCurrentSections(next);
                        if (selectedSectionId === section.id) {
                          setSelectedSectionId(next[0]?.id || "");
                        }
                      }}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <FilePlus2 className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add Section</h2>
                <p className="text-sm text-gray-500">Bring back deleted sections or add optional blocks.</p>
              </div>
            </div>

            <div className="space-y-2">
              {availableTemplates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                  All available sections for this page are already present.
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
                    className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <p className="text-sm font-semibold text-gray-900">{template.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{template.description}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          {!selectedSection || !selectedTemplate ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
              Select a section to edit it.
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedSection.label}</h2>
                <p className="mt-1 text-sm text-gray-500">{selectedSection.description}</p>
              </div>

              {selectedTemplate.fields.map((field) => {
                const value = selectedSection.data[field.key];

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
                      <span className="mb-2 block text-sm font-semibold text-gray-700">{field.label}</span>
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
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500"
                      />
                    </label>
                  );
                }

                return (
                  <label key={field.key} className="block">
                    <span className="mb-2 block text-sm font-semibold text-gray-700">{field.label}</span>
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
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
