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
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
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
        alert("Failed to delete item.");
      }
    } catch (err) {
      alert("Something went wrong deleting item.");
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
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 p-3 z-50 text-left"
            >
              <p className="text-xs font-medium text-gray-900 mb-2">Are you sure you want to delete?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 py-1 px-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium disabled:opacity-50"
                >
                  {loading ? "..." : "Delete"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                  className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
