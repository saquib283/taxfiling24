const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

const SERVICES_DATA = {
  "business-setup-registration-services": {
    title: "Business Setup & Registration Services",
    description: "Launch your venture with the right legal foundation. We provide end-to-end incorporation support for startups and established enterprises.",
    category: "registration",
    icon: "Building2",
    overview: "Choosing the correct business structure is the most critical decision for any founder. We handle the entire incorporation process with the Ministry of Corporate Affairs (MCA).",
    benefits: [
      "Limited Liability Protection for Founders",
      "Perpetual Succession & Easier Transferability",
      "Enhanced Capability to Raise Equity Capital",
      "Structured Growth & Operational Credibility"
    ],
    subServices: [
      { title: "Private Limited Company", description: "The gold standard for startups looking to raise venture capital." },
      { title: "Limited Liability Partnership (LLP)", description: "Best for professional service firms with lower compliance." },
      { title: "One Person Company (OPC)", description: "Corporate benefits for solo entrepreneurs." },
      { title: "Section 8 Company (NGO)", description: "Non-profit structure for charity and public welfare." }
    ],
    documentsRequired: ["PAN & Aadhaar of all Directors", "Passport-size photos", "Bank statement / Electricity bill", "Rent agreement & NOC for registered office"],
    process: [
      { step: "01", title: "Name Reservation (RUN/SPICe+ Part A)", description: "File unique company names for MCA approval." },
      { step: "02", title: "Digital Signature Certificate (DSC)", description: "Acquire Class 3 DSC for all proposed directors." },
      { step: "03", title: "SPICe+ Part B & AGILE-PRO", description: "Draft MOA, AOA, and apply for PAN, TAN, EPFO, ESIC." },
      { step: "04", title: "Certificate of Incorporation (COI)", description: "Receive official COI and CIN from the Registrar of Companies." }
    ],
    faqs: [
      { question: "How long does it take to register a Private Limited Company?", answer: "Typically 7-10 working days, subject to MCA name approval and document submission." },
      { question: "Can a foreigner or NRI be a director in an Indian company?", answer: "Yes, provided at least one director is a resident of India." }
    ]
  },
  "taxation-gst-compliance-management": {
    title: "Taxation, GST & Compliance Management",
    description: "Navigate India's evolving tax landscape with proactive planning, accurate filings, and end-to-end dispute management.",
    category: "taxation",
    icon: "Receipt",
    overview: "Tax laws in India require continuous monitoring. Our team of senior Chartered Accountants manages direct tax, indirect tax (GST), and TDS filings to maintain 100% compliance.",
    benefits: [
      "Avoid Heavy Interest & Penalties under Sec 234A/B/C",
      "Optimize Input Tax Credit (ITC) with GSTR-2B Matching",
      "Expert Representation for Scrutiny & Assessment Notices",
      "Strategic Tax Structuring to Minimize Effective Tax Rate"
    ],
    subServices: [
      { title: "Corporate Income Tax Filing (ITR-6)", description: "Comprehensive tax computation, depreciation schedules, and electronic filing." },
      { title: "GST Monthly/Quarterly Retainer", description: "GSTR-1, GSTR-3B filings, automated reconciliation, and ITC optimization." },
      { title: "TDS / TCS Compliance", description: "Quarterly TDS return preparation (24Q, 26Q), challan payments, and Form 16/16A generation." },
      { title: "IT & GST Notice Management", description: "Drafting robust legal responses and attending virtual hearings with tax authorities." }
    ],
    documentsRequired: ["Audited Financial Statements", "GSTR-2B and Purchase Registers", "Form 26AS & AIS/TIS Summary", "Challan receipts of Advance Tax / TDS"],
    process: [
      { step: "01", title: "Data Ingestion & Review", description: "Extract trial balance, sales ledgers, and expense vouchers." },
      { step: "02", title: "Computation & ITC Validation", description: "Verify allowable deductions, match 2B, and identify variances." },
      { step: "03", title: "Drafting & Client Sign-off", description: "Review tax computation sheet and liabilities with the client." },
      { step: "04", title: "Electronic Submission & Acknowledgement", description: "File return on government portal and issue ITR-V/acknowledgement." }
    ],
    faqs: [
      { question: "What is the penalty for late filing of GST returns?", answer: "Late fee of ₹50/day (₹20 for nil returns) plus 18% annual interest on outstanding tax." }
    ]
  },
  "corporate-roc-secretarial-filings": {
    title: "Corporate, ROC & Secretarial Filings",
    description: "Maintain spotless MCA compliance with timely annual return filings, director KYC, and board governance documentation.",
    category: "compliance",
    icon: "FileCheck",
    overview: "Every registered company must maintain regulatory filings with the Registrar of Companies (ROC). We handle statutory registers, annual filings, and corporate restructuring.",
    benefits: ["Zero Risk of Director Disqualification", "Clear Due Diligence for Investors & Banks", "Smooth Capital Allocation & Allotments"],
    subServices: [
      { title: "Annual MCA Filing (AOC-4 & MGT-7)", description: "Mandatory annual submission of balance sheets and director reports." },
      { title: "Director DIR-3 KYC", description: "Annual e-KYC compliance for DIN holders." },
      { title: "Share Capital Changes (SH-7, PAS-3)", description: "Increase authorized capital and file private placement returns." }
    ],
    documentsRequired: ["Audited Balance Sheet & P&L", "Board Meeting Minutes", "Director digital signatures"],
    process: [
      { step: "01", title: "Secretarial Audit", description: "Review statutory registers and meeting intervals." },
      { step: "02", title: "E-Form Certification", description: "Certification by Practicing Company Secretary (PCS)." },
      { step: "03", title: "MCA V3 Upload", description: "Upload forms on MCA V3 portal and generate SRN." }
    ],
    faqs: [
      { question: "What happens if a company fails to file AOC-4 and MGT-7?", answer: "A penalty of ₹100 per day per form applies without any upper cap." }
    ]
  },
  "accounting-financial-management-reporting": {
    title: "Accounting, Financial Management & Reporting",
    description: "Transform raw transactions into investor-grade financial dashboards, automated payroll, and cloud bookkeeping.",
    category: "accounting",
    icon: "BarChart3",
    overview: "Maintain real-time financial clarity with outsourced cloud bookkeeping in Zoho Books, QuickBooks, or Tally Prime.",
    benefits: ["Real-time Cashflow Visibility", "Investor-Ready Financial Statements", "Strict Internal Controls"],
    subServices: [
      { title: "Monthly Cloud Bookkeeping", description: "Automated ledger categorization and bank reconciliations." },
      { title: "Payroll & PF/ESIC Processing", description: "Monthly salary registers, payslip dispatch, and statutory deductions." },
      { title: "MIS Reporting & Cashflow Budgeting", description: "Monthly P&L, burn rate analysis, and departmental budgeting." }
    ],
    documentsRequired: ["Bank Statements", "Sales Invoices", "Vendor Purchase Bills"],
    process: [
      { step: "01", title: "Bank Feed Integration", description: "Connect bank accounts directly to accounting software." },
      { step: "02", title: "Transaction Tagging", description: "Allocate expenses and revenues to cost centers." },
      { step: "03", title: "Monthly Financial Pack", description: "Deliver balance sheet, P&L, and AR/AP aging analysis." }
    ],
    faqs: [
      { question: "Which accounting software do you support?", answer: "Zoho Books, QuickBooks, Tally Prime, SAP, and Xero." }
    ]
  },
  "audit-forensic-risk-corporate-investigation": {
    title: "Audit, Forensic, Risk & Corporate Investigation",
    description: "Rigorous statutory audits, internal control assessments, and forensic accounting led by Senior Chartered Accountants.",
    category: "audit",
    icon: "ShieldCheck",
    overview: "Independent assurance services ensuring full compliance with Indian Accounting Standards (Ind AS) and the Companies Act.",
    benefits: ["Regulatory Integrity", "Fraud Prevention & Detection", "Investor Trust & Bankable Financials"],
    subServices: [
      { title: "Statutory Financial Audit", description: "Mandatory audit under Section 139 of the Companies Act." },
      { title: "Tax Audit (Section 44AB)", description: "Audit of business turnover exceeding ₹10 Crore / ₹1 Crore." },
      { title: "Internal Control & Risk Audit", description: "Review of operating procedures and internal financial controls (IFC)." }
    ],
    documentsRequired: ["Complete Trial Balance", "Bank Confirmations", "Board Minutes", "Asset Register"],
    process: [
      { step: "01", title: "Risk Assessment & Audit Plan", description: "Establish materiality thresholds." },
      { step: "02", title: "Substantive Testing & Vouching", description: "Examine samples of vouchers and invoices." },
      { step: "03", title: "Independent Auditor's Report", description: "Issue True & Fair audit opinion with CARO disclosures." }
    ],
    faqs: [
      { question: "When is a Tax Audit mandatory in India?", answer: "When business turnover exceeds ₹10 Crore (where 95%+ transactions are digital), or ₹1 Crore for cash transactions." }
    ]
  },
  "licences-ip-certifications-legal-registrations": {
    title: "Licences, IP, Certifications & Legal Registrations",
    description: "Protect brand assets and obtain mandatory operating licenses: Trademark, MSME (Udyam), FSSAI, Import-Export Code (IEC), and ISO.",
    category: "registration",
    icon: "Award",
    overview: "Every expanding business needs regulatory licenses and intellectual property protection to safeguard brand equity and access government subsidies.",
    benefits: ["Nationwide Brand Monopoly with Trademark", "Government Tender Access & Collateral-Free Loans via MSME", "Smooth Export/Import Operations"],
    subServices: [
      { title: "Trademark Registration & Protection", description: "Trademark filing, objection hearings, and class search across 45 classes." },
      { title: "MSME / Udyam Registration", description: "Access priority sector lending and delay payment dispute protection." },
      { title: "FSSAI Food License", description: "Mandatory state and central food safety licenses for food operators." },
      { title: "Import Export Code (IEC)", description: "Lifetime 10-digit code issued by DGFT for foreign trade." }
    ],
    documentsRequired: ["PAN & GST Certificate", "Brand Logo in PNG", "Manufacturing / Office Address Proof"],
    process: [
      { step: "01", title: "IP Search & Classification", description: "Verify availability across trademark registries." },
      { step: "02", title: "Online Filing", description: "Submit application on government IP/DGFT portal." },
      { step: "03", title: "Certificate Issuance", description: "Receive official registration certificate." }
    ],
    faqs: [
      { question: "How long is a trademark valid in India?", answer: "A registered trademark is valid for 10 years and can be renewed indefinitely." }
    ]
  },
  "virtual-cfo-advisory-services": {
    title: "Virtual CFO & Strategic Advisory",
    description: "High-impact financial leadership for growing startups: unit economics, cashflow forecasting, fundraising support, and board governance.",
    category: "advisory",
    icon: "TrendingUp",
    overview: "Gain the strategic capabilities of an experienced Chief Financial Officer at a fraction of the cost of a full-time hire.",
    benefits: ["Accelerate Fundraising with Pitch-ready Models", "Lengthen Runway with Cashflow Control", "Data-Driven Unit Economics"],
    subServices: [
      { title: "Fundraising & Investor Relations", description: "Financial model building, cap-table management, and data room preparation." },
      { title: "Cashflow & Burn Rate Optimization", description: "13-week rolling cashflow forecasting." },
      { title: "Board Pack & Stakeholder Reporting", description: "Strategic board presentations with KPI tracking." }
    ],
    documentsRequired: ["Historical P&L and Balance Sheet", "Current Cap Table", "Revenue Projections"],
    process: [
      { step: "01", title: "Diagnostic Financial Audit", description: "Review existing numbers, margins, and financial hygiene." },
      { step: "02", title: "Operating Financial Model", description: "Build 3-statement dynamic financial forecast." },
      { step: "03", title: "Weekly & Monthly Execution", description: "Lead monthly board reviews and vendor renegotiations." }
    ],
    faqs: [
      { question: "How does a Virtual CFO differ from an Accountant?", answer: "Accountants focus on historical bookkeeping; a CFO focuses on future cashflow strategy, fundraising, profitability, and enterprise valuation." }
    ]
  },
  "special-services-e-commerce-banking-documentation": {
    title: "Special Services, E-Commerce & Banking Documentation",
    description: "Tailored solutions for Amazon/Flipkart marketplace reconciliation, bank loan CMA reports, startup valuation, and ESOP schemes.",
    category: "advisory",
    icon: "Briefcase",
    overview: "Specialized financial engagements that standard accounting cannot handle: marketplace payment reconciliations, Credit Monitoring Arrangement (CMA) data for bank financing, and ESOP plans.",
    benefits: ["Recover Lost Revenue from Marketplace Fees & Returns", "Secure Bank Debt & CC/OD Limits with Clean CMA", "Attract Key Talent with ESOP Frameworks"],
    subServices: [
      { title: "E-Commerce Payment Reconciliation", description: "Reconcile Amazon, Flipkart, Meesho payouts against orders, commissions, and returns." },
      { title: "CMA Report for Bank Working Capital", description: "Detailed 5-year past and projected financial ratios required by commercial banks." },
      { title: "Section 56(2)(viib) Startup Valuation", description: "DCF and NAV valuation reports certified by Registered Valuers and Merchant Bankers." }
    ],
    documentsRequired: ["3-year Audited Financials", "Sanction Letters", "Marketplace Settlement Sheets"],
    process: [
      { step: "01", title: "Data Ingestion & Scrubbing", description: "Parse tens of thousands of marketplace order lines." },
      { step: "02", title: "Discrepancy Identification", description: "Pinpoint underpaid orders, unreturned items, and excess commission fees." },
      { step: "03", title: "Formal Report Submission", description: "Deliver bank-ready CMA dossier or dispute claim sheets." }
    ],
    faqs: [
      { question: "What is a CMA Report?", answer: "Credit Monitoring Arrangement (CMA) is a comprehensive financial analysis required by banks to evaluate working capital loan eligibility." }
    ]
  }
};

const ARTICLES_DATA = [
  {
    title: "Complete Guide to Income Tax Return (ITR) Filing for FY 2025-26",
    slug: "complete-guide-itr-filing-2025-26",
    content: "<h2>Introduction to ITR Filing</h2><p>Filing your Income Tax Return (ITR) is not just a legal obligation but also a crucial step for financial health. This guide covers everything you need to know about the new tax regime, documents required, and deadlines.</p><h3>Key Documents Needed:</h3><ul><li>Form 16/16A</li><li>Form 26AS</li><li>Bank Statements</li><li>Investment Proofs (if opting for old regime)</li></ul>",
    excerpt: "Learn everything you need to know about filing your Income Tax Return for FY 2025-26, including document checklists and important dates.",
    thumbnailUrl: "/images/hero_bg.png",
    category: "INCOME_TAX_FILING",
    tags: ["ITR", "Income Tax", "FY2025", "TaxSaving"],
    readTime: 5,
    isFeatured: true,
    published: true,
    author: "TaxFiling24 Editorial Team"
  },
  {
    title: "GST Compliance Checklist for Small Businesses & Startups",
    slug: "gst-compliance-checklist-small-business",
    content: "<h2>Maintaining GST Compliance</h2><p>For small and medium enterprises (SMEs), staying compliant with Goods and Services Tax (GST) regulations is vital to avoid penalties and operate smoothly.</p><h3>Monthly Tasks:</h3><ul><li>GSTR-1 filing (Sales data)</li><li>GSTR-3B filing (Summary tax payment)</li><li>Reconciliation of Purchase Register with GSTR-2B</li></ul>",
    excerpt: "Stay penalty-free! Review our comprehensive GST compliance checklist tailored for small and medium enterprises (SMEs).",
    thumbnailUrl: "/images/team_consulting.png",
    category: "GST_COMPLIANCE",
    tags: ["GST", "Compliance", "SME", "Taxation"],
    readTime: 4,
    isFeatured: false,
    published: true,
    author: "TaxFiling24 Editorial Team"
  },
  {
    title: "How to Choose Between Private Limited and LLP in India",
    slug: "pvt-ltd-vs-llp-india-comparison",
    content: "<h2>Structuring Your Business</h2><p>Choosing the right business structure is the first major decision for any entrepreneur. Both Private Limited Company (Pvt. Ltd.) and Limited Liability Partnership (LLP) offer distinct advantages.</p><h3>At a Glance:</h3><ul><li><strong>Pvt. Ltd:</strong> Best for startups looking for Venture Capital funding.</li><li><strong>LLP:</strong> Ideal for service professionals and bootstrapped businesses.</li></ul>",
    excerpt: "Starting a business? Compare the differences, benefits, and compliance requirements of a Private Limited Company and an LLP structure.",
    thumbnailUrl: "/images/about_hero_bg.jpg",
    category: "BUSINESS_REGISTRATION",
    tags: ["Startup", "PvtLtd", "LLP", "Legal"],
    readTime: 6,
    isFeatured: false,
    published: true,
    author: "TaxFiling24 Editorial Team"
  }
];

const DEFAULT_SETTINGS = [
  { key: "contact_email", value: "support@taxfiling24.com" },
  { key: "contact_phone", value: "+91 7011246157" },
  { key: "contact_address", value: "E-244/G First Floor Shaheen Bagh, Okhla New Delhi 110025" },
  { key: "contact_whatsapp", value: "https://wa.me/917011246157" },
  { key: "site_logo", value: "/brand-logo.png" },
  { key: "hero_headline", value: "Strategic Financial & Compliance Solutions" },
  { key: "hero_image", value: "/images/hero_bg.png" },
  { key: "about_image", value: "/images/team_consulting.png" },
  { key: "about_hero_bg", value: "/images/about_hero_bg.jpg" }
];

async function main() {
  console.log("🌱 Starting TaxFiling24 Database Seeding...\n");

  // 1. Seed Admin User (preserve existing password if admin already exists)
  console.log("1️⃣ Seeding Admin User...");
  const existingAdmin = await prisma.user.findUnique({ where: { username: "admin" } });
  let generatedOneTimePassword = null;

  if (existingAdmin) {
    console.log(`   ✓ Admin user already exists (password preserved): ${existingAdmin.username}\n`);
  } else {
    const envPassword = (process.env.INITIAL_ADMIN_PASSWORD || "").trim();
    if (envPassword && envPassword.length < 10) {
      throw new Error("INITIAL_ADMIN_PASSWORD must be at least 10 characters long.");
    }
    if (!envPassword && process.env.NODE_ENV === "production") {
      throw new Error("INITIAL_ADMIN_PASSWORD environment variable is required to seed an initial admin in production.");
    }
    const passwordToUse = envPassword || crypto.randomBytes(15).toString("base64url");
    if (!envPassword) {
      generatedOneTimePassword = passwordToUse;
    }
    const hashedPassword = await bcrypt.hash(passwordToUse, 12);
    const admin = await prisma.user.create({
      data: {
        username: "admin",
        password: hashedPassword,
        name: "Administrator",
        role: "ADMIN"
      }
    });
    console.log(`   ✓ Created initial admin user: ${admin.username}\n`);
  }

  // 2. Seed Core Services
  console.log("2️⃣ Seeding Core Advisory Services...");
  for (const [slug, data] of Object.entries(SERVICES_DATA)) {
    await prisma.service.upsert({
      where: { slug },
      update: {
        title: data.title,
        description: data.description,
        category: data.category,
        icon: data.icon,
        overview: data.overview,
        benefits: data.benefits,
        subServices: data.subServices,
        documentsRequired: data.documentsRequired,
        process: data.process,
        faqs: data.faqs,
        href: `/services/${slug}`
      },
      create: {
        slug,
        title: data.title,
        description: data.description,
        category: data.category,
        icon: data.icon,
        overview: data.overview,
        benefits: data.benefits,
        subServices: data.subServices,
        documentsRequired: data.documentsRequired,
        process: data.process,
        faqs: data.faqs,
        href: `/services/${slug}`
      }
    });
    console.log(`   ✓ Service: ${data.title}`);
  }
  console.log("");

  // 3. Seed Articles
  console.log("3️⃣ Seeding Knowledge Base Articles...");
  for (const article of ARTICLES_DATA) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: article,
      create: article
    });
    console.log(`   ✓ Article: ${article.title}`);
  }
  console.log("");

  // 4. Seed Settings
  console.log("4️⃣ Seeding Default Site Settings...");
  for (const s of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value }
    });
    console.log(`   ✓ Setting: ${s.key}`);
  }

  console.log("\n🎉 Database Seeding Completed Successfully!");
  console.log("==========================================");
  console.log("Admin URL: /admin/login");
  console.log("Username:  admin");
  if (generatedOneTimePassword) {
    console.log(`One-time dev password (change immediately): ${generatedOneTimePassword}`);
  } else {
    console.log("Password:  (preserved existing password or set via INITIAL_ADMIN_PASSWORD)");
  }
  console.log("==========================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
