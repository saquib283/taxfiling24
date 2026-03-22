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
  CREATED: "bg-green-50 text-green-700 border-green-200",
  UPDATED: "bg-blue-50 text-blue-700 border-blue-200",
  DELETED: "bg-red-50 text-red-700 border-red-200",
};

export default async function ActivityLogPage() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Activity Log</h1>
        <p className="text-gray-600">Track all changes made in the admin panel</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No activity recorded yet.</p>
            <p className="text-gray-400 text-sm mt-1">Actions will be tracked as you manage content.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log: any) => {
              const Icon = ENTITY_ICONS[log.entity] || Activity;
              return (
                <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                  <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ACTION_COLORS[log.action] || "bg-gray-50 text-gray-600 border-gray-200"}`}>{log.action}</span>
                      <span className="text-sm font-medium text-gray-900">{log.entity}</span>
                    </div>
                    {log.details && <p className="text-xs text-gray-500 truncate">{log.details}</p>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
