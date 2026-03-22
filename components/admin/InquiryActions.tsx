"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, Archive, Trash2 } from "lucide-react";

export default function InquiryActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();

  const updateStatus = async (newStatus: string) => {
    await fetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this inquiry?")) return;
    await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      {status === "PENDING" && (
        <button onClick={() => updateStatus("RESOLVED")} className="p-2 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors" title="Mark Resolved">
          <CheckCircle className="h-4 w-4" />
        </button>
      )}
      {status !== "ARCHIVED" && (
        <button onClick={() => updateStatus("ARCHIVED")} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Archive">
          <Archive className="h-4 w-4" />
        </button>
      )}
      <button onClick={handleDelete} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
