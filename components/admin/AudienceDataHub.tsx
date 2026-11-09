"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  UploadCloud,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Inbox,
  Mail,
  ArrowRight,
  ExternalLink,
  Edit2,
  Send,
  FileText,
  Check,
  X,
  FileUp,
  Tag,
  Phone,
  Building,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react";
import type { AudienceMetrics } from "@/lib/audience-service";

interface ContactRecord {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  tags: string[] | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface UploadReport {
  totalRows: number;
  validRows: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  detectedColumns: Record<string, string | undefined>;
  samplePreview: Array<Record<string, any>>;
}

export default function AudienceDataHub() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation tab: "directory" | "upload" | "sync"
  const [activeView, setActiveView] = useState<"directory" | "upload" | "sync">(
    (searchParams.get("tab") as any) || "directory"
  );

  // Data states
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [metrics, setMetrics] = useState<AudienceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Upload Studio states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTag, setUploadTag] = useState("");
  const [updateIfExists, setUpdateIfExists] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<UploadReport | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState<any | null>(null);

  // Single Add / Edit Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactRecord | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [modalForm, setModalForm] = useState({
    email: "",
    name: "",
    phone: "",
    company: "",
    source: "MANUAL",
    tags: "",
    notes: "",
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Audience list & metrics
  const fetchAudience = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sourceFilter && sourceFilter !== "ALL") params.set("source", sourceFilter);
      if (tagFilter) params.set("tag", tagFilter);
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/audience?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load audience contacts");

      const data = await res.json();
      setContacts(data.subscribers || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);
      setMetrics(data.metrics || null);
    } catch (err: any) {
      setError(err.message || "Failed to load audience data.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sourceFilter, tagFilter, statusFilter]);

  useEffect(() => {
    fetchAudience();
  }, [fetchAudience]);

  // Handle File Drop / Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
      setUploadResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const valid = [".xlsx", ".xls", ".csv"].some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!valid) {
        setUploadError("Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.");
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadResult(null);
    }
  };

  // Submit File Upload
  const handleExecuteUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadProgress("Reading and validating rows in file...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (uploadTag.trim()) formData.append("customTag", uploadTag.trim());
      formData.append("updateIfExists", String(updateIfExists));

      const res = await fetch("/api/admin/audience/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload and import spreadsheet");

      setUploadResult(data);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchAudience();
    } catch (err: any) {
      setUploadError(err.message || "Upload and import failed.");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  // Trigger Website Leads Sync
  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/audience/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lead sync failed");
      setSyncReport(data);
      fetchAudience();
    } catch (err: any) {
      alert(err.message || "Failed to sync website leads.");
    } finally {
      setSyncing(false);
    }
  };

  // Single Contact Add / Edit Submit
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const tagsArray = modalForm.tags
        .split(/[,;|]/)
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingContact) {
        // Update existing
        const res = await fetch(`/api/admin/audience/${editingContact.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: modalForm.name,
            phone: modalForm.phone,
            company: modalForm.company,
            source: modalForm.source,
            notes: modalForm.notes,
            tags: tagsArray,
          }),
        });
        if (!res.ok) throw new Error("Failed to update contact");
      } else {
        // Create new
        const res = await fetch("/api/admin/audience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: modalForm.email,
            name: modalForm.name,
            phone: modalForm.phone,
            company: modalForm.company,
            source: modalForm.source,
            notes: modalForm.notes,
            tags: tagsArray,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save contact");
      }

      setShowAddModal(false);
      setEditingContact(null);
      setModalForm({ email: "", name: "", phone: "", company: "", source: "MANUAL", tags: "", notes: "" });
      fetchAudience();
    } catch (err: any) {
      alert(err.message || "Failed to save contact");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle active/suppressed
  const toggleContactStatus = async (contact: ContactRecord) => {
    try {
      const res = await fetch(`/api/admin/audience/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !contact.isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, isActive: !contact.isActive } : c))
      );
    } catch (err: any) {
      alert(err.message || "Error updating status");
    }
  };

  // Delete contact
  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this contact from the audience?")) return;
    try {
      const res = await fetch(`/api/admin/audience/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete contact");
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err.message || "Failed to delete contact");
    }
  };

  // Open edit modal
  const openEditModal = (contact: ContactRecord) => {
    setEditingContact(contact);
    setModalForm({
      email: contact.email,
      name: contact.name || "",
      phone: contact.phone || "",
      company: contact.company || "",
      source: contact.source || "MANUAL",
      tags: Array.isArray(contact.tags) ? contact.tags.join(", ") : "",
      notes: contact.notes || "",
    });
    setShowAddModal(true);
  };

  // Export current filtered audience
  const handleExport = (format: "csv" | "xlsx") => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sourceFilter && sourceFilter !== "ALL") params.set("source", sourceFilter);
    if (tagFilter) params.set("tag", tagFilter);
    if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
    params.set("format", format);

    window.open(`/api/admin/audience/export?${params.toString()}`, "_blank");
  };

  // Launch campaign for current filter
  const handleLaunchCampaign = () => {
    let targetAudience = "ALL_ACTIVE";
    if (sourceFilter && sourceFilter !== "ALL") {
      targetAudience = sourceFilter;
    } else if (tagFilter) {
      targetAudience = `TAG:${tagFilter}`;
    }
    router.push(`/admin/campaigns?audience=${encodeURIComponent(targetAudience)}`);
  };

  // Download Sample Spreadsheet Template
  const handleDownloadSample = () => {
    const sampleCsv =
      "Email,Full Name,Phone,Company,Tags,Notes\n" +
      "rajesh.kumar@example.com,Rajesh Kumar,+91 98765 43210,Apex Global,GST-Filing; Corporate,Important client\n" +
      "priya.sharma@example.com,Priya Sharma,+91 91234 56789,Innovate Tech,Startup-Inc; Pvt-Ltd,Annual compliance\n" +
      "arun.patel@example.com,Arun Patel,+91 99887 76655,Patel Traders,ITR-2026,Individual returns\n";

    const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "taxfiling24-sample-contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ─── Top Header & Controls ─── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audience &amp; Data Hub</h1>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {metrics?.totalContacts || 0} Contacts
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Unified directory of website leads, bookings, subscribers, and imported client lists.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
            title="Scan Inquiries & Appointments and ingest into Audience"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing..." : "Sync Website Leads"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingContact(null);
              setModalForm({ email: "", name: "", phone: "", company: "", source: "MANUAL", tags: "", notes: "" });
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            <span>Add Contact</span>
          </button>

          <button
            type="button"
            onClick={handleLaunchCampaign}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Launch Campaign to Audience</span>
          </button>
        </div>
      </div>

      {/* ─── Metric Overview Cards ─── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
            <Database className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics?.totalContacts || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{metrics?.activeContacts || 0} active</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inquiries</span>
            <Inbox className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics?.inquiryCount || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Contact form leads</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-indigo-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bookings</span>
            <Calendar className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics?.appointmentCount || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">CA consultations</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Newsletter</span>
            <Mail className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics?.newsletterCount || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Subscribers</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Imported</span>
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics?.importedCount || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">From Excel / CSV</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Opt-outs</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics?.suppressedContacts || 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Suppressed</span>
        </div>
      </div>

      {/* ─── Sync Feedback Banner ─── */}
      {syncReport && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-xs font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{syncReport.message}</span>
          </div>
          <button type="button" onClick={() => setSyncReport(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveView("directory")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition border-b-2 -mb-px ${
            activeView === "directory"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Contacts Directory</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600">
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("upload")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition border-b-2 -mb-px ${
            activeView === "upload"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileUp className="h-4 w-4" />
          <span>Upload Excel / CSV</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("sync")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition border-b-2 -mb-px ${
            activeView === "sync"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Website Leads Ingestion</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* VIEW 1: CONTACTS DIRECTORY                                    */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeView === "directory" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone, company..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 transition"
              >
                <option value="ALL">All Sources</option>
                <option value="INQUIRY">Website Inquiries</option>
                <option value="APPOINTMENT">Consultation Bookings</option>
                <option value="NEWSLETTER">Newsletter</option>
                <option value="CSV_IMPORT">Imported Spreadsheets</option>
                <option value="MANUAL">Manual Additions</option>
              </select>

              {/* Tag Filter */}
              {metrics?.totalTags && metrics.totalTags.length > 0 && (
                <select
                  value={tagFilter}
                  onChange={(e) => {
                    setTagFilter(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 transition"
                >
                  <option value="">All Tags</option>
                  {metrics.totalTags.map((tag) => (
                    <option key={tag} value={tag}>
                      #{tag}
                    </option>
                  ))}
                </select>
              )}

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none hover:border-slate-300 transition"
              >
                <option value="ALL">Active &amp; Suppressed</option>
                <option value="ACTIVE">Active Only</option>
                <option value="SUPPRESSED">Suppressed Only</option>
              </select>

              {/* Export Dropdown */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  title="Export filtered contacts to CSV"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("xlsx")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  title="Export filtered contacts to Excel"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Contact / Email</th>
                    <th className="px-5 py-3.5">Phone &amp; Company</th>
                    <th className="px-5 py-3.5">Source</th>
                    <th className="px-5 py-3.5">Tags</th>
                    <th className="px-5 py-3.5">Added Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-medium">
                        Loading audience contacts...
                      </td>
                    </tr>
                  ) : contacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-14 text-center">
                        <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <p className="font-bold text-slate-800 text-sm">No contacts found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Try adjusting your search filters or upload a spreadsheet.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    contacts.map((contact) => {
                      const tagsList = Array.isArray(contact.tags) ? (contact.tags as string[]) : [];

                      return (
                        <tr key={contact.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-900">{contact.email}</p>
                            {contact.name && (
                              <p className="text-xs text-slate-500 font-medium mt-0.5">{contact.name}</p>
                            )}
                          </td>

                          <td className="px-5 py-3.5">
                            {contact.phone ? (
                              <p className="font-medium text-slate-700 flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {contact.phone}
                              </p>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                            {contact.company && (
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Building className="h-3 w-3 text-slate-400" />
                                {contact.company}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                contact.source === "INQUIRY"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : contact.source === "APPOINTMENT"
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : contact.source === "CSV_IMPORT"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : contact.source === "NEWSLETTER"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {contact.source === "INQUIRY"
                                ? "Inquiry"
                                : contact.source === "APPOINTMENT"
                                ? "Booking"
                                : contact.source === "CSV_IMPORT"
                                ? "Spreadsheet"
                                : contact.source === "NEWSLETTER"
                                ? "Newsletter"
                                : "Manual"}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            {tagsList.length === 0 ? (
                              <span className="text-slate-400 text-xs">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {tagsList.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-slate-500 font-medium">
                            {new Date(contact.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>

                          <td className="px-5 py-3.5">
                            <button
                              type="button"
                              onClick={() => toggleContactStatus(contact)}
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase cursor-pointer transition ${
                                contact.isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                              }`}
                              title="Click to toggle Active / Suppressed"
                            >
                              {contact.isActive ? "Active" : "Opted Out"}
                            </button>
                          </td>

                          <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openEditModal(contact)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Edit contact"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteContact(contact.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete contact"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                <span>
                  Showing page {page} of {totalPages} ({totalCount} contacts)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* VIEW 2: DEDICATED EXCEL / CSV UPLOAD STUDIO                   */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeView === "upload" && (
        <div className="space-y-6 max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Upload Audience Spreadsheet</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import contacts directly from Excel (.xlsx, .xls) or CSV (.csv) files into the campaign database.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                <Download className="h-3.5 w-3.5 text-indigo-600" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-10 text-center transition hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                <UploadCloud className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-800">
                {selectedFile ? selectedFile.name : "Click to select or drag and drop your spreadsheet"}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB — Ready to upload`
                  : "Supports .xlsx, .xls, and .csv files up to 15MB"}
              </p>
            </div>

            {/* Upload Options */}
            <div className="grid gap-5 sm:grid-cols-2 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Apply Campaign Tag to Imported Contacts
                </label>
                <input
                  type="text"
                  value={uploadTag}
                  onChange={(e) => setUploadTag(e.target.value)}
                  placeholder="e.g. Q1-Tax-Filing, Startup-Founders"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Allows targeting this exact list in campaigns using the tag filter.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Duplicate Handling Strategy</label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="dup"
                      checked={updateIfExists}
                      onChange={() => setUpdateIfExists(true)}
                      className="accent-indigo-600"
                    />
                    <span>Update existing contact details with new values</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="dup"
                      checked={!updateIfExists}
                      onChange={() => setUpdateIfExists(false)}
                      className="accent-indigo-600"
                    />
                    <span>Skip already existing emails (Do not overwrite)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {uploadError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Action Button */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  Clear File
                </button>
              )}
              <button
                type="button"
                onClick={handleExecuteUpload}
                disabled={!selectedFile || uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="h-3.5 w-3.5" />
                    <span>Start Import</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Upload Results Breakdown */}
          {uploadResult && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm border-b border-slate-100 pb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Import Summary</span>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xl font-black text-slate-800">{uploadResult.totalRows}</p>
                  <p className="text-[11px] text-slate-500">Total Rows</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-xl font-black text-emerald-700">{uploadResult.importedCount}</p>
                  <p className="text-[11px] text-emerald-600">New Imported</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="text-xl font-black text-blue-700">{uploadResult.updatedCount}</p>
                  <p className="text-[11px] text-blue-600">Updated</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xl font-black text-amber-700">{uploadResult.skippedCount}</p>
                  <p className="text-[11px] text-amber-600">Skipped</p>
                </div>
              </div>

              {/* Sample preview */}
              {uploadResult.samplePreview && uploadResult.samplePreview.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-700">Sample Row Preview:</h4>
                  <div className="rounded-xl border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left text-[11px] text-slate-600">
                      <thead className="bg-slate-50 font-bold border-b border-slate-200">
                        <tr>
                          {Object.keys(uploadResult.samplePreview[0]).map((h) => (
                            <th key={h} className="px-3 py-2">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {uploadResult.samplePreview.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {Object.values(row).map((val: any, cIdx) => (
                              <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setActiveView("directory")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  <span>View All in Directory</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* VIEW 3: WEBSITE LEADS INGESTION SYNC                          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeView === "sync" && (
        <div className="space-y-6 max-w-3xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Website Leads &amp; Consultations Ingestion</h2>
              <p className="text-xs text-slate-500 mt-1">
                TaxFiling24 collects inquiries via the Contact Form and consultations through the CA Advisory Desk.
                This automated engine synchronizes both sources into the campaign database so you can email them.
              </p>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
              <h4 className="text-xs font-bold text-indigo-900">Automated Background Hook</h4>
              <p className="text-xs text-indigo-800 leading-relaxed">
                New inquiries and consultation bookings submitted by visitors are <strong>automatically</strong>{" "}
                added to your Campaign Audience in real-time. You only need to run manual sync to backfill historical
                records.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Scanning & Ingesting..." : "Run Manual Sync Now"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add / Edit Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingContact ? "Edit Contact" : "Add New Contact"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={Boolean(editingContact)}
                  value={modalForm.email}
                  onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                  placeholder="client@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={modalForm.phone}
                    onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={modalForm.company}
                    onChange={(e) => setModalForm({ ...modalForm, company: e.target.value })}
                    placeholder="e.g. Apex Corp"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={modalForm.tags}
                  onChange={(e) => setModalForm({ ...modalForm, tags: e.target.value })}
                  placeholder="e.g. GST-Filing, Startup, Corporate"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {formSubmitting ? "Saving..." : editingContact ? "Update Contact" : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

