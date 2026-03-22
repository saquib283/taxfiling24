"use client";

import { useState, useEffect } from "react";
import { Mail, Send, Trash2, Users, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Campaign {
  id: string;
  subject: string;
  content: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

export default function CampaignsPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({ subject: "", content: "" });

  const fetchData = async () => {
    const [subRes, campRes] = await Promise.all([
      fetch("/api/admin/subscribers"),
      fetch("/api/admin/campaigns")
    ]);
    if (subRes.ok) setSubscribers(await subRes.json());
    if (campRes.ok) setCampaigns(await campRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSend = async () => {
    if (!form.subject || !form.content) return alert("Please fill in both subject and content.");
    if (!confirm("Are you sure you want to send this campaign to all active subscribers?")) return;

    setSending(true);
    const res = await fetch("/api/admin/campaigns/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSending(false);
    if (res.ok) {
      alert("Campaign sent successfully!");
      setForm({ subject: "", content: "" });
      fetchData();
    } else {
      alert("Failed to send campaign.");
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    await fetch(`/api/admin/subscribers/${id}`, { method: "DELETE" });
    setSubscribers(subscribers.filter(s => s.id !== id));
  };

  if (loading) return <div className="p-6 text-gray-400">Loading campaign data...</div>;

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Compose & History */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Email Campaigns</h1>
          <p className="text-gray-600">Compose and send newsletters to your subscribers</p>
        </div>

        {/* Compose Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><FileText className="h-4 w-4" /> Compose Campaign</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="E.g., Tax Filing Season Tips" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Message Body (HTML Supported)</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Hello subscriber..." rows={8} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
            </div>
            <button onClick={handleSend} disabled={sending || !form.subject || !form.content} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {sending ? "Sending..." : "Send to All Subscribers"}
            </button>
          </div>
        </div>

        {/* Campaign History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Sent Campaigns</h3>
          </div>
          {campaigns.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">No campaigns sent yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {campaigns.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{c.subject}</h4>
                    <p className="text-xs text-gray-400 mt-1">Sent on {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Subscribers List */}
      <div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Users className="h-4 w-4" /> Subscribers ({subscribers.length})</h3>
          </div>
          {subscribers.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">No subscribers yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {subscribers.map((s) => (
                <div key={s.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.email}</p>
                    {s.name && <p className="text-xs text-gray-400">{s.name}</p>}
                  </div>
                  <button onClick={() => handleDeleteSubscriber(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
