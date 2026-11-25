import ArticleForm from "@/components/admin/ArticleForm";
import prisma from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { notFound } from "next/navigation";

// Fetch article data

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["ADMIN", "EDITOR"]);
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    return notFound();
  }

  return <ArticleForm article={article} isEdit={true} />;
}
