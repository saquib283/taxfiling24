import { Suspense } from "react";
import CampaignStudio from "@/components/admin/CampaignStudio";

export default function CampaignsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm font-semibold text-slate-400">Loading Campaign Studio...</div>
        </div>
      }
    >
      <CampaignStudio />
    </Suspense>
  );
}
