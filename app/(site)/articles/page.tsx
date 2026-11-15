export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { getManagedPageSections } from "@/lib/managed-pages";
import { getSettings } from "@/lib/settings";
import JsonLd, {
  breadcrumbSchema,
  collectionPageSchema,
  itemListSchema,
} from "@/components/seo/JsonLd";
import type { Metadata } from "next";
import { absoluteUrl, buildPageMetadataFromSettings } from "@/lib/seo";
import ArticlesDirectoryPage, { ArticleItem } from "@/components/sections/ArticlesDirectoryPage";

interface ArticlesHeroContent {
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  readMoreText?: string;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "articles", {
    description:
      "Stay updated with the latest tax guidelines, GST updates, corporate compliance tips, and financial news from TaxFiling24 experts.",
    keywords: ["tax articles", "GST updates", "compliance insights", "business finance blog"],
    path: "/articles",
    title: "Articles & Insights",
  });
}

export default async function ArticlesPage() {
  let articles: ArticleItem[] = [];
  const settings = await getSettings();
  const sections = getManagedPageSections("articles", settings);
  const heroSection = sections.find((section) => section.type === "articles.hero");
  const hero = heroSection?.data as ArticlesHeroContent | undefined;

  try {
    const dbArticles = await prisma.article.findMany({
      where: { published: true },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        thumbnailUrl: true,
        category: true,
        readTime: true,
        isFeatured: true,
        author: true,
        createdAt: true,
      },
    });
    articles = dbArticles.map((a) => ({
      ...a,
      category: a.category ? String(a.category) : null,
      createdAt: a.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Database Error (Articles Index):", error);
  }

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Articles", url: absoluteUrl("/articles") },
          ]),
          collectionPageSchema({
            description:
              "Expert-written articles from TaxFiling24 covering taxation, GST, compliance, and financial planning.",
            name: "Articles & Insights",
            url: absoluteUrl("/articles"),
          }),
          itemListSchema(
            articles.map((article) => ({
              name: article.title,
              url: absoluteUrl(`/articles/${article.slug}`),
            }))
          ),
        ]}
      />

      <ArticlesDirectoryPage
        articles={articles}
        heroContent={hero}
      />
    </>
  );
}
