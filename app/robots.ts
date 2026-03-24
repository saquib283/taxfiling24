import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api", "/api/*", "/dashboard", "/dashboard/*", "/_next"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/api", "/dashboard", "/_next"],
      },
    ],
    sitemap: "https://taxfiling24.com/sitemap.xml",
    host: "https://taxfiling24.com",
  };
}
