"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

interface ApproveButtonProps {
  id: string;
  isApproved: boolean;
}

export default function ApproveButton({ id, isApproved: initialStatus }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggleApproval = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !isApproved }),
      });

      if (res.ok) {
        setIsApproved(!isApproved);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to update");
      }
    } catch {
      setError("Failed to update review status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-center">
      <button 
        onClick={toggleApproval}
        disabled={loading}
        title={error || undefined}
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
          isApproved 
            ? "bg-red-50 text-red-600 hover:bg-red-100" 
            : "bg-green-50 text-green-600 hover:bg-green-100"
        } ${error ? "ring-1 ring-red-400" : ""}`}
      >
        {loading ? (
          "..."
        ) : isApproved ? (
          <>
            <X className="h-3 w-3" /> Reject
          </>
        ) : (
          <>
            <Check className="h-3 w-3" /> Approve
          </>
        )}
      </button>
      {error && <span className="text-[10px] text-red-500 mt-1">{error}</span>}
    </div>
  );
}
