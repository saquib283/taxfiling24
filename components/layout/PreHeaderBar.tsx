"use client";

import { Phone, Mail } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function PreHeaderBar() {
  return (
    <div className="flex items-center justify-center gap-6 bg-[var(--color-primary)] py-2 text-sm text-white">
      <a
        href={`tel:${CONTACT.phoneRaw}`}
        className="flex items-center gap-2 hover:opacity-90"
      >
        <Phone className="h-4 w-4" />
        {CONTACT.phone}
      </a>
      <a
        href={`mailto:${CONTACT.email}`}
        className="flex items-center gap-2 hover:opacity-90"
      >
        <Mail className="h-4 w-4" />
        {CONTACT.email}
      </a>
    </div>
  );
}
