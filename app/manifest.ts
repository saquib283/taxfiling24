import type { MetadataRoute } from "next";

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
        src: "/icons/icon-192.png",
        type: "image/png",
      },
      {
        sizes: "512x512",
        src: "/icons/icon-512.png",
        type: "image/png",
      },
    ],
    id: "/",
    lang: "en-IN",
    name: "TaxFiling24",
    orientation: "portrait",
    scope: "/",
    short_name: "TaxFiling24",
    start_url: "/",
    theme_color: "#0A2540",
  };
}
