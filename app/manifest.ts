import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#ffffff",
    categories: ["finance", "business", "productivity"],
    description:
      "TaxFiling24 helps businesses and individuals across India with tax filing, GST, compliance, registration, and financial advisory services.",
    display: "standalone",
    icons: [
      {
        sizes: "192x192",
        src: "/icon.png",
        type: "image/png",
      },
      {
        sizes: "512x512",
        src: "/icon.png",
        type: "image/png",
      },
    ],
    id: SITE_URL,
    lang: "en-IN",
    name: "TaxFiling24",
    orientation: "portrait",
    scope: "/",
    short_name: "TaxFiling24",
    start_url: "/",
    theme_color: "#0A2540",
  };
}
