"use client";

import { useState } from "react";
import { Clock, Mail, Phone, CheckCircle, Archive, Trash2, ChevronDown, ChevronUp, Sparkles, MessageCircleCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function InquiryRow({ inquiry }: { inquiry: any }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [replyText, setReplyText] = useState("");

  const updateStatus = async (newStatus: string) => {
    await fetch(`/api/admin/inquiries/${inquiry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this inquiry?")) return;
    await fetch(`/api/admin/inquiries/${inquiry.id}`, { method: "DELETE" });
    router.refresh();
  };

  const handleAIDraft = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: `Inquiry from ${inquiry.name}`, 
          topic: inquiry.message, 
          category: inquiry.service || "General", 
          type: "reply" 
        })
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        // Strip HTML if necessary, or support HTML textarea (requires tips)
        // Let's replace simple linebreaks from some layouts
        setReplyText(data.reply.replace(/<[^>]*>/g, "")); 
      } else {
        alert("Failed to generate AI response");
      }
    } catch {
      alert("Something went wrong with AI generation");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-5 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-3 mb-2 cursor-pointer">
            <h3 className="font-semibold text-gray-900">{inquiry.name}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              inquiry.status === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
              inquiry.status === "RESOLVED" ? "bg-green-50 text-green-700 border-green-200" :
              "bg-gray-50 text-gray-600 border-gray-200"
            }`}>{inquiry.status}</span>
            {inquiry.service && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600 border border-blue-200">{inquiry.service}</span>
            )}
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
          </div>
          <p className={`text-sm text-gray-600 mb-2 ${isExpanded ? "" : "line-clamp-2"}`}>{inquiry.message}</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{inquiry.email}</span>
            {inquiry.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{inquiry.phone}</span>}
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(inquiry.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions Pane */}
        <div className="flex items-center gap-1 shrink-0">
          {inquiry.status === "PENDING" && (
            <button onClick={() => updateStatus("RESOLVED")} className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-colors" title="Mark Resolved">
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          {inquiry.status !== "ARCHIVED" && (
            <button onClick={() => updateStatus("ARCHIVED")} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Archive">
              <Archive className="h-4 w-4" />
            </button>
          )}
          <button onClick={handleDelete} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expandable Reply Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4 pt-4 border-t border-gray-100"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1"><MessageCircleCode className="h-3.5 w-3.5" /> Draft Email Response</label>
                <button
                  type="button"
                  onClick={handleAIDraft}
                  disabled={aiLoading}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {aiLoading ? "Drafting..." : "Suggest with AI"}
                </button>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type response back or generate using AI above..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <a
                  href={`mailto:${inquiry.email}?subject=Response regarding your inquiry at TaxFiling24&body=${encodeURIComponent(replyText)}`}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-100"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Open in Email Client
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
