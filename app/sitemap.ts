import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { SERVICES_DETAIL_DATA } from "@/lib/services-detail-data";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/articles`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools/tax-calculator`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/tools/gst-calculator`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const servicePagesFromStaticData: MetadataRoute.Sitemap = Object.keys(
    SERVICES_DETAIL_DATA
  ).map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  let servicePagesFromDatabase: MetadataRoute.Sitemap = [];
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const services = await prisma.service.findMany({
      select: { createdAt: true, slug: true },
    });
    servicePagesFromDatabase = services.map((service) => ({
      url: `${baseUrl}/services/${service.slug}`,
      lastModified: service.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    }));

    const articles = await prisma.article.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    articlePages = articles.map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB unavailable — return only static pages
  }

  const seenUrls = new Set<string>();

  return [
    ...staticPages,
    ...servicePagesFromDatabase,
    ...servicePagesFromStaticData,
    ...articlePages,
  ].filter((entry) => {
    if (seenUrls.has(entry.url)) {
      return false;
    }

    seenUrls.add(entry.url);
    return true;
  });
}
