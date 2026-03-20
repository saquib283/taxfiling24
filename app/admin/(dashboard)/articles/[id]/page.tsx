import ArticleForm from "@/components/admin/ArticleForm";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

// Fetch article data

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    return notFound();
  }

  return <ArticleForm article={article} isEdit={true} />;
}
