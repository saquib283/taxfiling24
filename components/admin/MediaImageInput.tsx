"use client";

import { useState, useRef } from "react";
import {
  UploadCloud,
  Link2,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export interface MediaImageInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  defaultImage?: string;
  description?: string;
  placeholder?: string;
  aspectRatio?: "video" | "square" | "banner" | "wide" | "auto";
}

export default function MediaImageInput({
  label,
  value,
  onChange,
  defaultImage,
  description,
  placeholder = "https://... or /images/...",
  aspectRatio = "video",
}: MediaImageInputProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomImage = Boolean(value && defaultImage && value !== defaultImage);
  const isDefaultImage = Boolean(defaultImage && (value === defaultImage || (!value && defaultImage)));
  const displayImage = value || defaultImage || "";

  // Aspect ratio classes
  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square max-w-[200px]"
      : aspectRatio === "banner"
      ? "aspect-[21/9]"
      : aspectRatio === "wide"
      ? "aspect-[16/9]"
      : aspectRatio === "auto"
      ? "h-40"
      : "aspect-video";

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WebP, GIF, SVG).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Upload failed");
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const copyToClipboard = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevert = () => {
    if (defaultImage) {
      onChange(defaultImage);
      setError(null);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 transition-all duration-200 hover:border-slate-300">
      {/* Header with Title & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {label}
            </span>
            {isCustomImage && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                <Sparkles className="h-2.5 w-2.5 text-indigo-500" /> Custom Image Active
              </span>
            )}
            {isDefaultImage && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <Check className="h-2.5 w-2.5" /> Main Design Image
              </span>
            )}
          </div>
          {description && (
            <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
          )}
        </div>

        {/* Mode Switcher Tabs */}
        <div className="inline-flex rounded-xl bg-slate-200/70 p-0.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              activeTab === "upload"
                ? "bg-white text-indigo-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="h-3 w-3" /> Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              activeTab === "url"
                ? "bg-white text-indigo-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Link2 className="h-3 w-3" /> Link / URL
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl bg-red-50 p-2.5 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-700 text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Input Mode: File Upload Dropzone */}
      {activeTab === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition ${
            dragOver
              ? "border-indigo-500 bg-indigo-50/50"
              : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {uploading ? (
            <div className="flex items-center gap-2 py-3 text-xs font-bold text-indigo-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading image to server...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2 text-slate-500">
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-1.5">
                <UploadCloud className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drag & drop image
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Supports PNG, JPG, WebP, GIF, SVG up to 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Input Mode: Direct URL Input */}
      {activeTab === "url" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-800 font-mono focus:border-indigo-600 focus:outline-none transition"
              />
            </div>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
                title="Clear input"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400">
            Paste an image link from the web or a local path (e.g. <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">/images/hero_bg.png</code>)
          </p>
        </div>
      )}

      {/* Active Preview & Controls */}
      {displayImage ? (
        <div className="space-y-2 pt-2 border-t border-slate-200/80">
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 group">
            {/* Image Preview Container */}
            <div className={`${aspectClass} w-full relative flex items-center justify-center overflow-hidden bg-slate-950/20`}>
              <img
                src={displayImage}
                alt={label}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    defaultImage ||
                    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23ccc'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='12' fill='%23666'>Image Error</text></svg>";
                }}
              />
            </div>

            {/* Overlay Bar */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-3 text-white flex items-center justify-between gap-2 backdrop-blur-2xs">
              <span className="text-[11px] font-mono text-slate-300 truncate max-w-[200px] sm:max-w-xs" title={displayImage}>
                {displayImage}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30 transition text-xs"
                  title="Copy image URL"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <a
                  href={displayImage}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30 transition text-xs"
                  title="Open image in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="rounded-lg bg-rose-600/80 p-1.5 text-white hover:bg-rose-600 transition text-xs"
                  title="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Revert to Main Image Card (When custom image is active) */}
          {isCustomImage && defaultImage && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-indigo-200 bg-white">
                  <img
                    src={defaultImage}
                    alt="Original Main Image"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-indigo-950 text-xs">
                    Main Design Reference
                  </p>
                  <p className="text-[10px] font-mono text-indigo-700 truncate" title={defaultImage}>
                    {defaultImage}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRevert}
                className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition active:scale-95"
                title="Restore the original default image for this section"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Revert to Main</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-center text-xs text-slate-400">
          <ImageIcon className="h-5 w-5 mx-auto mb-1 text-slate-300" />
          No image selected. Upload a file or paste a link above.
        </div>
      )}
    </div>
  );
}

