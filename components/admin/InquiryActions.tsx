"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Archive, Trash2, X, Check } from "lucide-react";

export default function InquiryActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: string) => {
    await fetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  };

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
    setConfirmDelete(false);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      {status === "PENDING" && (
        <button
          onClick={() => updateStatus("RESOLVED")}
          className="p-2 hover:bg-green-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
          title="Mark Resolved"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      )}
      {status !== "ARCHIVED" && (
        <button
          onClick={() => updateStatus("ARCHIVED")}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          title="Archive"
        >
          <Archive className="h-4 w-4" />
        </button>
      )}

      {confirmDelete ? (
        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg">
          <span className="text-[10px] font-semibold text-rose-700 px-1">Delete?</span>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
            title="Confirm delete"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="p-1 rounded text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            title="Cancel"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
