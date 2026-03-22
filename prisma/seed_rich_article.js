const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const article = {
    title: "The Ultimate Guide to Startup Funding in India (2026)",
    slug: "ultimate-guide-startup-funding-india-2026",
    content: `
      <h2>1. Introduction to Startup Funding</h2>
      <p>Starting a business in India has never been more exciting. With government initiatives like <strong>Startup India</strong> and a growing venture ecosystem, founders have multiple avenues to raise capital. However, navigating the legalities and choosing the right instrument can be overwhelming.</p>
      
      <p><em>In this guide, we break down absolute essentials for founders looking to pitch to investors, secure seed money, or traverse Series A stages cleanly.</em></p>

      <blockquote>
        "Funding is not the goal; it is the fuel for your rocket ship. Don't focus on raising money; focus on building a sustainable business that investors can't ignore."
      </blockquote>

      <h2>2. Key Funding Stages</h2>
      <p>Understanding where you stand on the funding ladder helps in targeting the right investors:</p>
      
      <ol>
        <li><strong>Bootstrapping (Self-Funding):</strong> Using personal savings or revenue from clients to grow slowly but retain full absolute equity control.</li>
        <li><strong>Pre-Seed / Angel Round:</strong> Sourced from friends and family or local Angel Investors. Focuses on Minimum Viable Product (MVP).</li>
        <li><strong>Seed Stage:</strong> Fueling growth, market validation, and early hiring. Supported by micro-VCs.</li>
        <li><strong>Series A & Beyond:</strong> Scaling operations, expanding with institutional capital (Venture Capital funds).</li>
      </ol>

      <h2>3. Legal & Compliance Checklist for Investment</h2>
      <p>Before any Term Sheet is signed, your startup must be <strong>Due Diligence ready</strong>. Neglecting compliance is the #1 reason funding rounds collapse.</p>
      
      <ul>
        <li>✅ Certified Incorporation Certificate (Pvt. Ltd. preferred over LLP for VC)</li>
        <li>✅ Intellectual Property (IP) Assignment Agreements in place</li>
        <li>✅ Updated Statutory Registers & Directors Disclosures</li>
        <li>✅ Clear Audit & Financial records for past year or months</li>
      </ul>

      <h2>4. Comparison: equity Instruments</h2>
      <p>Should you use CCPS, Safe Notes, or Convertible Notes? Here is a practical comparison lookup:</p>

      <div class="tableWrapper">
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Ideal For</th>
              <th>Key Advantage</th>
              <th>Compliance Weight</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>CCPS (Securities)</strong></td>
              <td>Series A / Institutional</td>
              <td>Full rights, protective provisions</td>
              <td>High (Requires Valuation)</td>
            </tr>
            <tr>
              <td><strong>Convertible Note</strong></td>
              <td>Seed Rounds / Bridges</td>
              <td>Debt that converts to equity later</td>
              <td>Medium</td>
            </tr>
            <tr>
              <td><strong>i-SAFE / SAFE</strong></td>
              <td>Early Stage / Accelerators</td>
              <td>Fast documentation, deferred valuation</td>
              <td>Low - Medium</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>5. Pitching & Financial Modelling</h2>
      <p>Founders must maintain realistic, audited <strong>Financial Forecasts</strong>. Investors look for metrics like CAC (Customer Acquisition Cost), LTV (Lifetime Value), and Burn Rate explicitly. Always seek professional advice to avoid standard Valuation traps.</p>
    `,
    excerpt: "Navigate the complex landscape of startup funding in India with our comprehensive guide covering VC checklist, compliance guides, and equity instruments comparision table.",
    thumbnailUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=80",
    category: "STARTUP_FUNDING",
    tags: ["Funding", "Startup", "VC", "TermSheet", "CCPS"],
    readTime: 7,
    isFeatured: true,
    published: true,
    author: "FinExpert",
  };

  console.log("Seeding rich article...");

  await prisma.article.upsert({
    where: { slug: article.slug },
    update: article,
    create: article,
  });

  console.log(`- Upserted rich article: ${article.title}`);
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
