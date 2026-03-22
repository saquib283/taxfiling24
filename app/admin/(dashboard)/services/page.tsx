export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Briefcase } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function ServicesListPage() {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Services</h1>
          <p className="text-gray-600">Manage your website service offerings</p>
        </div>
        <Link href="/admin/services/create" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">
          <Plus className="h-4 w-4" />
          Add Service
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {services.length === 0 ? (
          <div className="p-12 text-center">
            <div className="p-3 bg-gray-50 rounded-full inline-block mb-3">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No services found.</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Get started by adding your first service.</p>
            <Link href="/admin/services/create" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700">
              <Plus className="h-4 w-4" /> Add Service
            </Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold border-b border-gray-100">
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Icon</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((service: any) => (
                <tr key={service.id} className="hover:bg-gray-50 text-sm">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{service.title}</p>
                    {service.href && <p className="text-xs text-blue-500 font-mono mt-0.5">{service.href}</p>}
                  </td>
                  <td className="p-4 capitalize text-gray-600 text-xs">
                    {service.category}
                  </td>
                  <td className="p-4 text-gray-600 text-xs">
                    <span className="px-2 py-1 bg-gray-100 rounded-md font-mono">{service.icon}</span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link href={`/admin/services/${service.id}`} className="inline-flex p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <DeleteButton id={service.id} endpoint="/api/admin/services" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
