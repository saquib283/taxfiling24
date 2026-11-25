"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteButtonProps {
  id: string;
  endpoint: string; // e.g., "/api/admin/articles"
  onDeleteSuccess?: () => void;
}

export default function DeleteButton({ id, endpoint, onDeleteSuccess }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowConfirm(false);
        if (onDeleteSuccess) {
          onDeleteSuccess();
        } else {
          router.refresh();
        }
      } else {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error || "Failed to delete item.");
      }
    } catch {
      setErrorMessage("Something went wrong deleting item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-block relative">
      <button 
        onClick={() => setShowConfirm(true)}
        className="p-1.5 hover:bg-red-50 rounded text-red-500 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
            onClick={() => !loading && setShowConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-2xl"
            >
              <h4 className="text-sm font-bold text-slate-900 mb-1">Confirm deletion</h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Are you sure you want to permanently delete this item? This action cannot be undone.
              </p>
              {errorMessage && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 mb-3 font-medium">
                  {errorMessage}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
