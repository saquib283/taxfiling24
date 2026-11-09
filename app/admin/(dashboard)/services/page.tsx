export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Briefcase, Shield, FileHeart, TrendingUp, Settings, Users, ExternalLink } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";

const ICONS: Record<string, any> = { Briefcase, Shield, FileHeart, TrendingUp, Settings, Users };

const renderIcon = (iconName: string) => {
  const IconComponent = ICONS[iconName] || Briefcase;
  return <IconComponent className="h-5 w-5 text-indigo-600" />;
};

const getCategoryStyle = (category: string) => {
  const cat = category?.toUpperCase() || "";
  if (cat.includes("TAX")) return "bg-amber-50 text-amber-700 border-amber-100";
  if (cat.includes("REGISTRATION") || cat.includes("STARTUP") || cat.includes("ROC")) return "bg-indigo-50 text-indigo-700 border-indigo-100";
  if (cat.includes("GST") || cat.includes("COMPLIANCE") || cat.includes("PAYROLL")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (cat.includes("LEGAL") || cat.includes("AUDIT") || cat.includes("TRADEMARK")) return "bg-rose-50 text-rose-700 border-rose-100";
  return "bg-slate-100 text-slate-700 border-slate-200/60";
};

export default async function ServicesListPage() {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header section */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
            Services
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Publish and manage tax filings, ROC compliances, business registrations, or auditing service offerings.
          </p>
        </div>
        <Link 
          href="/admin/services/create" 
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer self-start sm:self-center active:scale-98"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Link>
      </header>

      {/* Main Services Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {services.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="p-4 bg-slate-50 rounded-2xl inline-block mb-4 border border-slate-100">
              <Briefcase className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No services found</h3>
            <p className="text-slate-400 text-xs mt-1 mb-5 leading-relaxed">
              Get started by adding your first service offering to compile benefits, processes, and FAQs.
            </p>
            <Link 
              href="/admin/services/create" 
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-98"
            >
              <Plus className="h-3.5 w-3.5" /> Add Service
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80">
                  <th className="p-4 pl-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Title</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Design Icon</th>
                  <th className="p-4 pr-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((service: any) => (
                  <tr key={service.id} className="hover:bg-slate-50/30 transition duration-150 text-sm">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center shrink-0">
                          {renderIcon(service.icon)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate max-w-[280px] sm:max-w-md">{service.title}</p>
                          {service.href && (
                            <p className="text-xs text-indigo-500 font-mono mt-0.5 leading-none">
                              {service.href}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${getCategoryStyle(service.category)}`}>
                        {service.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-200/80 text-slate-600 font-mono text-[11px] font-semibold rounded-lg shadow-sm">
                        {service.icon}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {service.href && (
                          <Link 
                            href={service.href.startsWith("/") ? service.href : `/services/${service.href}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View live service page"
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition active:scale-95 cursor-pointer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                        <Link 
                          href={`/admin/services/${service.id}`} 
                          title="Edit service"
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition active:scale-95 cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DeleteButton id={service.id} endpoint="/api/admin/services" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
