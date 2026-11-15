export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { Activity, FileText, Briefcase, HelpCircle, Star, Calendar, Users, Inbox } from "lucide-react";

const ENTITY_ICONS: Record<string, any> = {
  Article: FileText,
  Service: Briefcase,
  FAQ: HelpCircle,
  Review: Star,
  Deadline: Calendar,
  TeamMember: Users,
  Inquiry: Inbox,
};

const ACTION_COLORS: Record<string, string> = {
  CREATED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  UPDATED: "bg-blue-50 text-blue-700 border-blue-100/80",
  DELETED: "bg-rose-50 text-rose-700 border-rose-100",
};

export default async function ActivityLogPage() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Audit Activity Log
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700">
              {logs.length} Events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track auditing events, system creations, modifications, and administrative operations.
          </p>
        </div>
      </div>

      {/* Main logs list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {logs.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="p-3.5 bg-slate-50 rounded-2xl inline-block mb-3 border border-slate-100">
              <Activity className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No activity logged yet</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Log entries are recorded automatically as administrative actions are performed.
            </p>
          </div>
        ) : (
          logs.map((log: any) => {
            const Icon = ENTITY_ICONS[log.entity] || Activity;
            return (
              <div key={log.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-slate-50/50 transition duration-150">
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-slate-500" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${
                      ACTION_COLORS[log.action] || "bg-slate-50 text-slate-500 border-slate-200"
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{log.entity}</span>
                  </div>
                  {log.details && (
                    <p className="text-xs text-slate-500 truncate leading-relaxed">
                      {log.details}
                    </p>
                  )}
                </div>
                
                <span className="text-[10px] font-semibold text-slate-400 shrink-0 whitespace-nowrap bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                  {new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
