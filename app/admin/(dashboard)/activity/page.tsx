import { Metadata } from "next";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Activity Log | Admin Dashboard",
};

export default async function ActivityLogPage() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100, // Show last 100 activities
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-600">Recent actions performed in the admin panel.</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border">
        {logs.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Intl.DateTimeFormat('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
                    }).format(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${log.action === 'CREATED' ? 'bg-green-100 text-green-800' : ''}
                      ${log.action === 'UPDATED' ? 'bg-blue-100 text-blue-800' : ''}
                      ${log.action === 'DELETED' ? 'bg-red-100 text-red-800' : ''}
                      ${log.action === 'APPROVED' ? 'bg-teal-100 text-teal-800' : ''}
                      ${log.action === 'SENT' ? 'bg-purple-100 text-purple-800' : ''}
                    `}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.details || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No activity recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
