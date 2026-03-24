"use client";

import { useState, useEffect } from "react";
import { Loader2, GripVertical, Eye, EyeOff, Save, LayoutTemplate } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";

interface SectionConfig {
  id: string;
  label: string;
  isVisible: boolean;
}

const DEFAULT_LAYOUT: SectionConfig[] = [
  { id: "HeroSection", label: "Hero & Banner", isVisible: true },
  { id: "StatsSection", label: "Key Statistics", isVisible: true },
  { id: "AboutSection", label: "About Us", isVisible: true },
  { id: "ServicesSection", label: "Services Portfolio", isVisible: true },
  { id: "ProcessSection", label: "Strategic Process", isVisible: true },
  { id: "FeaturesSection", label: "Core Features", isVisible: true },
  { id: "TestimonialsSection", label: "Client Testimonials", isVisible: true },
  { id: "ArticlesSection", label: "Latest Articles", isVisible: true },
  { id: "ComplianceCalendar", label: "Compliance Calendar", isVisible: true },
  { id: "NeedGuidanceSection", label: "Need Guidance Banner", isVisible: true },
  { id: "CTASection", label: "Call to Action", isVisible: true },
  { id: "FAQSection", label: "Frequently Asked Questions", isVisible: true },
];

function SortableItem({ item, onToggle }: { item: SectionConfig, onToggle: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 mb-3 bg-white border ${isDragging ? 'border-blue-500 shadow-xl' : 'border-gray-200 shadow-sm'} rounded-xl transition-colors`}
    >
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab hover:bg-gray-100 p-2 rounded-lg -ml-2 text-gray-400">
          <GripVertical className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{item.label}</h3>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{item.id}</p>
        </div>
      </div>
      
      <button
        onClick={() => onToggle(item.id)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          item.isVisible ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        {item.isVisible ? "Visible" : "Hidden"}
      </button>
    </div>
  );
}

export default function HomepageLayoutControl() {
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        if (data.homepage_layout) {
          try {
            const parsed = JSON.parse(data.homepage_layout);
            // Merge with default to catch any new sections added later
            const merged = DEFAULT_LAYOUT.map(def => {
              const found = parsed.find((p: any) => p.id === def.id);
              return found ? { ...def, isVisible: found.isVisible } : def;
            });
            // Sort to match saved order
            const sorted = parsed.map((p: any) => merged.find(m => m.id === p.id)).filter(Boolean);
            // Append any new defaults not in parsed
            const newDefs = merged.filter(m => !parsed.find((p: any) => p.id === m.id));
            setSections([...sorted, ...newDefs]);
          } catch (e) {
            setSections(DEFAULT_LAYOUT);
          }
        } else {
          setSections(DEFAULT_LAYOUT);
        }
        setLoading(false);
      })
      .catch(() => {
        setSections(DEFAULT_LAYOUT);
        setLoading(false);
      });
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleVisibility = (id: string) => {
    setSections(items =>
      items.map(item =>
        item.id === id ? { ...item, isVisible: !item.isVisible } : item
      )
    );
  };

  const saveLayout = async () => {
    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          settings: { 
            homepage_layout: JSON.stringify(sections) 
          } 
        }),
      });

      if (res.ok) {
        setMessage({ text: "Layout updated successfully! Changes are live on the homepage.", type: "success" });
      } else {
        setMessage({ text: "Failed to save layout.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "An error occurred.", type: "error" });
    } finally {
      setSaving(false);
      // clear message after 3 seconds
      setTimeout(() => setMessage({text: "", type: ""}), 3000);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
            <LayoutTemplate className="h-8 w-8 text-blue-600" />
            Homepage Layout
          </h1>
          <p className="text-gray-600">Drag to reorder sections or toggle their visibility on the live site.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={saveLayout}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Layout"}
        </motion.button>
      </div>

      {message.text && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 mb-6 rounded-xl text-sm font-medium border ${
            message.type === "success" 
              ? "bg-green-50 text-green-700 border-green-200" 
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section) => (
              <SortableItem key={section.id} item={section} onToggle={toggleVisibility} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
