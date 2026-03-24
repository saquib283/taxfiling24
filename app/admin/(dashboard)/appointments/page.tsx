"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, Clock, User, Mail, Phone, MessageSquare, 
  CheckCircle2, XCircle, Clock4, Trash2, Search,
  Filter, MoreVertical, Loader2, Sparkles, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/admin/appointments");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/admin/appointments?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAppointments(appointments.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.service?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "ALL" || a.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "CANCELLED": return "bg-rose-50 text-rose-700 border-rose-100";
      case "COMPLETED": return "bg-blue-50 text-blue-700 border-blue-100";
      default: return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Appointment Manager</h1>
          <p className="text-slate-500 mt-1">Review and manage client consultation requests.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterStatus === s 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Bookings", value: appointments.length, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Pending", value: appointments.filter(a => a.status === "PENDING").length, icon: Clock4, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Confirmed", value: appointments.filter(a => a.status === "CONFIRMED").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Conversion", value: `${Math.round((appointments.filter(a => a.status === "COMPLETED").length / (appointments.length || 1)) * 100)}%`, icon: Sparkles, color: "text-indigo-600", bg: "bg-white" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="text-sm font-medium text-slate-400">
            Showing {filteredAppointments.length} appointments
          </div>
        </div>

        {/* Table/List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest text-start">
                <th className="px-8 py-4">Client Detail</th>
                <th className="px-8 py-4">Service & Slot</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {filteredAppointments.map((appt) => (
                  <motion.tr
                    key={appt.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold">
                          {appt.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{appt.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {appt.email}</span>
                            <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {appt.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-700">{appt.service || "General Consultation"}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(appt.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5 font-bold text-indigo-600"><Clock className="h-3 w-3" /> {appt.time}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => updateStatus(appt.id, "CONFIRMED")}
                          disabled={updatingId === appt.id || appt.status === "CONFIRMED"}
                          className="p-2 rounded-xl bg-white border border-slate-100 text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
                          title="Confirm"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => updateStatus(appt.id, "COMPLETED")}
                          disabled={updatingId === appt.id}
                          className="p-2 rounded-xl bg-white border border-slate-100 text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                          title="Mark Completed"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteAppointment(appt.id)}
                          className="p-2 rounded-xl bg-white border border-slate-100 text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredAppointments.length === 0 && (
            <div className="p-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-slate-50 mb-4">
                <Calendar className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">No appointments found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
