export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { Star, MessageCircle, AlertCircle } from "lucide-react";
import ApproveButton from "@/components/admin/ApproveButton";
import DeleteButton from "@/components/admin/DeleteButton";
import AddReviewForm from "@/components/admin/AddReviewForm";

export default async function ReviewsListPage() {
  let reviews: any[] = [];
  let error: string | null = null;

  try {
    reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (e: any) {
    console.error("Database error in ReviewsListPage:", e);
    error = "Could not reach the database. Please check your local connection settings.";
  }

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header section */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
            Testimonial Reviews
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Moderate and approve client reviews, verify star ratings, and publish active testimonials.
          </p>
        </div>
        <div className="shrink-0 self-start sm:self-center">
          <AddReviewForm />
        </div>
      </header>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold border border-rose-100/80 shadow-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Reviews Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="p-4 bg-slate-50 rounded-2xl inline-block mb-4 border border-slate-100">
              <MessageCircle className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No reviews found</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Reviews submitted by clients or published through client directories will list here for approval.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80">
                  <th className="p-4 pl-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Name & Designation</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Testimonial Quote</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Star Rating</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moderation Status</th>
                  <th className="p-4 pr-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((review: any) => (
                  <tr key={review.id} className="hover:bg-slate-50/50 transition duration-150 text-sm">
                    <td className="p-4 pl-6">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800">{review.name}</p>
                        {review.role && (
                          <p className="text-xs text-slate-400 mt-0.5 leading-none">
                            {review.role}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-600 max-w-sm truncate">
                      "{review.content}"
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3.5 w-3.5 ${
                              i < review.rating ? "fill-current text-amber-400" : "text-slate-200 fill-none"
                            }`} 
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        review.isApproved 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${review.isApproved ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        {review.isApproved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ApproveButton id={review.id} isApproved={review.isApproved} />
                        <DeleteButton id={review.id} endpoint="/api/admin/reviews" />
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
