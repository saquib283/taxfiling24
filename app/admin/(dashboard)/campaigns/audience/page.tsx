import { Suspense } from "react";
import AudienceDataHub from "@/components/admin/AudienceDataHub";

export default function AudiencePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm font-semibold text-slate-400">Loading Audience Hub...</div>
        </div>
      }
    >
      <AudienceDataHub />
    </Suspense>
  );
}

