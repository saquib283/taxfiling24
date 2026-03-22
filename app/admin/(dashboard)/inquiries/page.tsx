export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { Inbox, Clock, CheckCircle, Archive, Mail, Phone } from "lucide-react";
import InquiryActions from "@/components/admin/InquiryActions";

export default async function InquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });
  const pending = inquiries.filter((i: any) => i.status === "PENDING").length;
  const resolved = inquiries.filter((i: any) => i.status === "RESOLVED").length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Inquiry Inbox</h1>
          <p className="text-gray-600">Manage contact form submissions and leads</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm font-medium text-yellow-700">{pending} Pending</div>
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700">{resolved} Resolved</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {inquiries.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No inquiries yet.</p>
            <p className="text-gray-400 text-sm mt-1">Contact form submissions will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {inquiries.map((inquiry: any) => (
              <div key={inquiry.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{inquiry.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        inquiry.status === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        inquiry.status === "RESOLVED" ? "bg-green-50 text-green-700 border-green-200" :
                        "bg-gray-50 text-gray-600 border-gray-200"
                      }`}>{inquiry.status}</span>
                      {inquiry.service && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600 border border-blue-200">{inquiry.service}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{inquiry.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{inquiry.email}</span>
                      {inquiry.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{inquiry.phone}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <InquiryActions id={inquiry.id} status={inquiry.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
