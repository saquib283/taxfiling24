const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const content = `
    <h2>Introduction to GST Compliance in 2026</h2>
    <p>Staying compliant with Goods and Services Tax (GST) requires a systematic approach. With updated regulations for 2026, businesses must align their invoicing, credits, and filing frequencies meticulously to avoid heavy reconciliation lags.</p>

    <h3>1. Key Monthly Deadlines</h3>
    <p>Missing deadlines attracts automatic daily penalties. Mark these dates on your calendar securely:</p>
    <ul>
      <li><strong>GSTR-1 (Sales return)</strong>: 11th of every subsequent month.</li>
      <li><strong>GSTR-3B (Summary return)</strong>: 20th of every subsequent month.</li>
      <li><strong>GSTR-2B (ITC claim)</strong>: Synchronize input credit matchers by 14th of every month.</li>
    </ul>

    <h3>2. Essential Documents Checklist</h3>
    <p>Ensure you produce accurate tax invoices. Valid documents require these explicit details:</p>
    <ol>
      <li>Supplier's formal legal Name and corresponding GSTIN.</li>
      <li>Exact Date of issue and distinct sequential invoice numbering series.</li>
      <li>Total taxable value with split CGST/SGST or IGST column definitions.</li>
    </ol>

    <blockquote>
      <p>"Failing to match GSTR-2A with book titles is the number one cause of blocked Input Tax Credit reversals." - TaxFiling24 Advisory Board</p>
    </blockquote>

    <h3>3. Standard GST Slabs 2026</h3>
    <p>Below is a summary chart of active tax brackets across products and service verticals:</p>
    <table>
      <thead>
        <tr>
          <th>Slab Rate</th>
          <th>Typical Items Covered</th>
          <th>Tax Type</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>5%</td>
          <td>Grains, basic food items, transport</td>
          <td>Consumables</td>
        </tr>
        <tr>
          <td>12%</td>
          <td>Processed foods, electronics basic</td>
          <td>Hardware</td>
        </tr>
        <tr>
          <td>18%</td>
          <td>Consultancy, Software services, Corporate</td>
          <td>Professional</td>
        </tr>
      </tbody>
    </table>

    <p>For more detailed compliance strategy support, reach out to our chartered accountants directly via the Contact options above.</p>
  `;

  const article = await prisma.article.upsert({
    where: { slug: "complete-gst-filing-checklist-india-2026" },
    update: {
      content: content,
      published: true,
    },
    create: {
      title: "The Complete Checklist for GST Filing in India 2026",
      slug: "complete-gst-filing-checklist-india-2026",
      excerpt: "Get your business compliant. A visual breakdown of all critical GST deadlines, layout documentations, and latest 2026 slab rates with standard tables.",
      content: content,
      category: "GST_COMPLIANCE",
      tags: ["gst", "compliance", "taxation", "checklist"],
      readTime: 6,
      published: true,
      isFeatured: true,
      thumbnailUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
    },
  });

  console.log("Seeded test article:", article.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
