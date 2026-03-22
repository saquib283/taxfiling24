export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { Inbox, Clock, CheckCircle, Archive, Mail, Phone } from "lucide-react";
import InquiryRow from "@/components/admin/InquiryRow";

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
              <InquiryRow key={inquiry.id} inquiry={inquiry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
