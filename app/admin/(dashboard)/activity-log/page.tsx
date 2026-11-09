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
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header section */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
            Activity Log
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track auditing events, updates, creations, and content modifications made inside the administration workspace.
          </p>
        </div>
      </header>

      {/* Main logs list */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
        {logs.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="p-4 bg-slate-50 rounded-2xl inline-block mb-4 border border-slate-100">
              <Activity className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No activity logged yet</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Log entries are recorded automatically as actions are taken across content layouts.
            </p>
          </div>
        ) : (
          logs.map((log: any) => {
            const Icon = ENTITY_ICONS[log.entity] || Activity;
            return (
              <div key={log.id} className="p-5 flex items-center gap-4 hover:bg-slate-50/30 transition duration-150">
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-sm">
                  <Icon className="h-4.5 w-4.5 text-slate-500" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold border uppercase ${
                      ACTION_COLORS[log.action] || "bg-slate-50 text-slate-500 border-slate-200"
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{log.entity}</span>
                  </div>
                  {log.details && (
                    <p className="text-xs text-slate-450 truncate leading-relaxed">
                      {log.details}
                    </p>
                  )}
                </div>
                
                <span className="text-[10px] font-bold text-slate-400 shrink-0 whitespace-nowrap bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                  {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
