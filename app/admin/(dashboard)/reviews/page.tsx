export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { Star, MessageCircle } from "lucide-react";
import ApproveButton from "@/components/admin/ApproveButton";
import DeleteButton from "@/components/admin/DeleteButton";
import AddReviewForm from "@/components/admin/AddReviewForm";

export default async function ReviewsListPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Reviews</h1>
          <p className="text-gray-600">Moderate and approve client testimonials and reviews</p>
        </div>
        <AddReviewForm />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {reviews.length === 0 ? (
          <div className="p-12 text-center">
            <div className="p-3 bg-gray-50 rounded-full inline-block mb-3">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No reviews found.</p>
            <p className="text-gray-400 text-sm mt-1">Client submissions will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold border-b border-gray-100">
                <th className="p-4">Client</th>
                <th className="p-4">Content</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.map((review: any) => (
                <tr key={review.id} className="hover:bg-gray-50 text-sm">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{review.name}</p>
                    {review.role && <p className="text-xs text-gray-400">{review.role}</p>}
                  </td>
                  <td className="p-4 text-gray-600 text-xs max-w-sm truncate">
                    "{review.content}"
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-0.5 text-yellow-500">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      review.isApproved 
                        ? "bg-green-50 text-green-600 border-green-200" 
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}>
                      {review.isApproved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 flex items-center justify-end">
                    <ApproveButton id={review.id} isApproved={review.isApproved} />
                    <DeleteButton id={review.id} endpoint="/api/admin/reviews" />
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
