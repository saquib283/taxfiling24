const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const articles = [
    {
      title: "Complete Guide to Income Tax Return (ITR) Filing for FY 2025-26",
      slug: "complete-guide-itr-filing-2025-26",
      content: "<h2>Introduction to ITR Filing</h2><p>Filing your Income Tax Return (ITR) is not just a legal obligation but also a crucial step for financial health. This guide covers everything you need to know about the new tax regime, documents required, and deadlines.</p><h3>Key Documents Needed:</h3><ul><li>Form 16/16A</li><li>Form 26AS</li><li>Bank Statements</li><li>Investment Proofs (if opting for old regime)</li></ul>",
      excerpt: "Learn everything you need to know about filing your Income Tax Return for FY 2025-26, including document checklists and important dates.",
      thumbnailUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80",
      category: "INCOME_TAX_FILING",
      tags: ["ITR", "Income Tax", "FY2025", "TaxSaving"],
      readTime: 5,
      isFeatured: true,
      published: true,
      author: "Admin",
    },
    {
      title: "GST Compliance Checklist for Small Businesses",
      slug: "gst-compliance-checklist-small-business",
      content: "<h2>Maintaining GST Compliance</h2><p>For small and medium enterprises (SMEs), staying compliant with Goods and Services Tax (GST) regulations is vital to avoid penalties and operate smoothly. Below is a monthly and quarterly checklist.</p><h3>Monthly Tasks:</h3><ul><li>GSTR-1 filing (Sales data)</li><li>GSTR-3B filing (Summary tax payment)</li><li>Reconciliation of Purchase Register with GSTR-2B</li></ul>",
      excerpt: "Stay penalty-free! Review our comprehensive GST compliance checklist tailored for small and medium enterprises (SMEs).",
      thumbnailUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80",
      category: "GST_COMPLIANCE",
      tags: ["GST", "Compliance", "SME", "Taxation"],
      readTime: 4,
      isFeatured: false,
      published: true,
      author: "Admin",
    },
    {
      title: "How to Choose Between Private Limited and LLP in India",
      slug: "pvt-ltd-vs-llp-india-comparison",
      content: "<h2>Structuring Your Business</h2><p>Choosing the right business structure is the first major decision for any entrepreneur. Both Private Limited Company (Pvt. Ltd.) and Limited Liability Partnership (LLP) offer distinct advantages depending on your funding and growth goals.</p><h3>At a Glance:</h3><ul><li><strong>Pvt. Ltd:</strong> Best for startups looking for Venture Capital funding. Has higher compliance requirements.</li><li><strong>LLP:</strong> Ideal for service professionals and bootstrapped businesses. Lower compliance burden.</li></ul>",
      excerpt: "Starting a business? Compare the differences, benefits, and compliance requirements of a Private Limited Company and an LLP structure.",
      thumbnailUrl: "https://images.unsplash.com/photo-1507679839221-20b803e6485a?w=600&q=80",
      category: "BUSINESS_REGISTRATION",
      tags: ["Startup", "PvtLtd", "LLP", "Legal"],
      readTime: 6,
      isFeatured: false,
      published: true,
      author: "Admin",
    }
  ];

  console.log("Seeding articles...");

  for (const article of articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: article,
      create: article,
    });
    console.log(`- Upserted article: ${article.title}`);
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
