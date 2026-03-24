export interface SubService {
  title: string;
  description: string;
}

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ServiceDetail {
  title: string;
  description: string;
  heroBg: string; // Tailwind gradient classes
  overview: string;
  benefits: string[];
  subServices: SubService[];
  documentsRequired: string[];
  process: ProcessStep[];
  faqs: FAQ[];
}

export const SERVICES_DETAIL_DATA: Record<string, ServiceDetail> = {
  "business-setup-registration-services": {
    title: "Business Setup & Registration Services",
    description: "Launch your venture with the right legal foundation. We provide end-to-end incorporation support for startups and established enterprises.",
    heroBg: "from-blue-600 to-indigo-700",
    overview: "Choosing the correct business structure is the most critical decision for any founder. It impacts everything from liability and taxation to future fundraising and scalability. Our legal experts provide a comparative analysis of different structures and handle the entire registration process with the Ministry of Corporate Affairs (MCA) and other regulators.",
    benefits: [
      "Limited Liability Protection for Founders",
      "Perpetual Succession & Easier Transferability",
      "Enhanced Capability to Raise Equity Capital",
      "Structured Growth & Operational Credibility",
      "Global Recognition as a Corporate Entity"
    ],
    subServices: [
      { title: "Private Limited Company", description: "The gold standard for startups looking to raise venture capital. Requires 2 directors and 2 shareholders." },
      { title: "Limited Liability Partnership (LLP)", description: "Best for professional service firms. Combines partnership flexibility with limited liability." },
      { title: "One Person Company (OPC)", description: "Corporate benefits for solo entrepreneurs without needing a second director." },
      { title: "Section 8 Company (NGO)", description: "Non-profit structure for promoting commerce, art, science, sports, or education." },
      { title: "Producer Company", description: "Specialized structure for farmers and primary producers to gain corporate scale." },
      { title: "Nidhi Company Registration", description: "Non-banking financial entity for cultivating habits of thrift and savings among members." }
    ],
    documentsRequired: [
      "PAN Card & Aadhaar Card of Directors/Partners",
      "Passport sized Photographs of all founders",
      "Address Proof of Business Premises (Lease/Utility Bill)",
      "NOC from Owner of premises (for rented office)",
      "Specimen Signature & DSC Application forms"
    ],
    process: [
      { step: "01", title: "DSC & DIN Procurement", description: "Generating Digital Signature Certificates and Director Identification Numbers." },
      { step: "02", title: "Name Availability Search", description: "Filing RUN (Reserve Unique Name) application for brand name approval." },
      { step: "03", title: "Charter Drafting", description: "Customizing Memorandum (MOA) and Articles of Association (AOA)." },
      { step: "04", title: "MCA Filing", description: "Submitting SPICe+ (Simplified Proforma for Incorporating Company electronically)." },
      { step: "05", title: "Compliance Handover", description: "Receiving COI, PAN, TAN, and assisting in first Board Meeting setup." }
    ],
    faqs: [
      { question: "Can a foreigner be a director in an Indian Company?", answer: "Yes, at least one director must be a resident of India, but others can be foreign nationals." },
      { question: "Is it mandatory to have an office space for registration?", answer: "Yes, you need a registered office address in India. A residential address can also suffice initially." },
      { question: "What are the audit requirements for an LLP?", answer: "Audit is mandatory only if turnover exceeds ₹40 Lakhs or contribution exceeds ₹25 Lakhs." },
      { question: "How much time does name approval take?", answer: "MCA typically approves names within 2-3 working days if they are unique." }
    ]
  },
  "licences-ip-certifications-legal-registrations": {
    title: "Licences, IP, Certifications & Legal Registrations",
    description: "Secure your brand assets and stay compliant with specialized state and central licenses.",
    heroBg: "from-purple-600 to-blue-700",
    overview: "Global competition requires robust protection of Intellectual Property (IP) and strict adherence to industry-specific operating licenses. We simplify the complex journey of getting FSSAI, MSME, Startup India recognition, and Trademark registrations.",
    benefits: [
      "Exclusive Legal Rights to Brand Names & Logos",
      "Access to Government Tenders & Subsidies",
      "Collateral-Free Bank Loans under MSME schemes",
      "80% Rebate in IP filing fees for Startups",
      "Global Brand Protection through Madrid Protocol"
    ],
    subServices: [
      { title: "Trademark Registration", description: "Protect your logo, brand name, or slogan from infringement." },
      { title: "Startup India Recognition", description: "Get listed for tax exemptions (80IAC) and faster patent filings." },
      { title: "MSME / Udyam Certificate", description: "Unlock priorities in government procurement and bank financing." },
      { title: "FSSAI (Food License)", description: "Mandatory for manufacturers, retailers, and distributors of food items." },
      { title: "Import-Export Code (IEC)", description: "Essential for businesses involved in international trade and cross-border services." },
      { title: "Professional Tax (PT)", description: "Mandatory state-level registration for employers and employees." },
      { title: "Shop & Establishment", description: "Local municipal license for physical offices, shops, and warehouses." }
    ],
    documentsRequired: [
      "PAN Card of the Business Entity",
      "Logo Image in High Resolution (for Trademarks)",
      "Bank Account Statement / Cancelled Cheque",
      "Director/Partner Aadhaar Card",
      "Proof of Registered Office Address"
    ],
    process: [
      { step: "01", title: "Eligibility Check", description: "Analyzing business activity to map correct license requirements." },
      { step: "02", title: "Application Preparation", description: "Drafting technical descriptions and site plan layouts if needed." },
      { step: "03", title: "Digital Filing", description: "Submitting applications on specialized government portals." },
      { step: "04", title: "Response Handling", description: "Replying to clarifications or additional information requested by officers." }
    ],
    faqs: [
      { question: "What is the validity of a Trademark?", answer: "Trademark registration is valid for 10 years and can be renewed indefinitely." },
      { question: "Who needs an FSSAI license?", answer: "Anyone handling food—from home-based bakers to large manufacturing plants." },
      { question: "What are the benefits of Startup India?", answer: "Includes 3 years of income tax holiday, self-certification, and easier wind-up." },
      { question: "Is IEC mandatory for service exports?", answer: "Yes, IEC is mandatory for both goods and services export/import." }
    ]
  },
  "taxation-gst-compliance-management": {
    title: "Taxation, GST & Compliance Management",
    description: "Strategic tax planning and flawless compliance for individuals and corporations.",
    heroBg: "from-emerald-600 to-teal-700",
    overview: "With the ever-evolving tax landscape in India, staying compliant is about more than just filing returns. We provide proactive tax health checks, litigation support, and specialized NRI taxation services to optimize your global tax outgo.",
    benefits: [
      "Zero Penalty via Proactive Deadlines Monitoring",
      "Legal Tax Saving through Deep Strategy Analysis",
      "Frictionless Refund Processing from IT/GST Dept",
      "Protection from Scrutiny via Clean Documentation",
      "Expert Representation during Tax Assessments"
    ],
    subServices: [
      { title: "GST Registration & Filing", description: "Monthly/Quarterly GSTR-1, 3B, and Annual GSTR-9 filings." },
      { title: "Corporate ITR-6 Filing", description: "Comprehensive tax return filing for Private Limited Companies." },
      { title: "NRI Taxation", description: "Managing DTAA benefits, TDS on property sale, and home country filings." },
      { title: "Individual ITR-1 to ITR-4", description: "Precise filing for salaried, professionals, and small business owners." },
      { title: "TDS & TCS Compliance", description: "Quarterly returns (24Q, 26Q) and correction of defaults." },
      { title: "Advance Tax Planning", description: "Estimating liabilities and managing cashflows through quarterly payments." }
    ],
    documentsRequired: [
      "Sales, Purchase & Expense Ledgers",
      "GSTR-2A/2B Reconciliation reports",
      "Form 26AS & Annual Information Statement (AIS)",
      "Bank Statement (full financial year)",
      "Investment Proofs (80C, 80D, etc. for individuals)"
    ],
    process: [
      { step: "01", title: "Tax Health Audit", description: "Reviewing previous filings for potential errors or gaps." },
      { step: "02", title: "Data Aggregation", description: "Analyzing invoices, bank logs, and investment certificates." },
      { step: "03", title: "Computation of Income", description: "Drafting the final tax liability/refund sheet for client review." },
      { step: "04", title: "Electronic Filing", description: "Submission to ITD/GST portal and E-Verification." }
    ],
    faqs: [
      { question: "What is GSTR-9 and is it mandatory?", answer: "It is the Annual GST return. Mandatory if turnover exceeds specific thresholds." },
      { question: "How can NRIs save tax in India?", answer: "Through Double Taxation Avoidance Agreements (DTAA) and choosing the right NRO/NRE setup." },
      { question: "What happens if I miss an Advance Tax deadline?", answer: "Interest under sections 234B and 234C will be applicable on the shortfall." }
    ]
  },
  "corporate-roc-secretarial-filings": {
    title: "Corporate, ROC & Secretarial Filings",
    description: "Ensure your corporate entity stays in 'Active' status with the Registrar of Companies.",
    heroBg: "from-amber-500 to-orange-600",
    overview: "The Companies Act, 2013 mandates continuous reporting of event-based and annual changes. Failing to file can lead to director disqualification and striking off the company name. We act as your secretarial backbone.",
    benefits: [
      "Maintains 'Active' Status on MCA Portal",
      "Ensures Directors remain eligible for other boards",
      "Facilitates smooth due diligence for Debt/Equity",
      "Prevention of heavy additional filing fees",
      "Structured Governance & Legal Record Maintenance"
    ],
    subServices: [
      { title: "Annual Filings (AOC-4 & MGT-7)", description: "Filing of Financial Statements and Annual Returns annually." },
      { title: "DIN eKYC (DIR-3 KYC)", description: "Mandatory yearly updating of Director details." },
      { title: "Change in Director / Capital", description: "Forms for Appointment, Resignation, or share transfers." },
      { title: "Registered Office Change", description: "Filing state or city-level address change applications." },
      { title: "Condonation of Delay", description: "Legal assistance for late filings and penalty waivers." }
    ],
    documentsRequired: [
      "Signed Audited Financial Statements",
      "Director's Report copy",
      "Notice & Minutes of the Annual General Meeting (AGM)",
      "Updated PAN/Aadhaar/Passport of Directors",
      "MBP-1 & DIR-8 from all Directors"
    ],
    process: [
      { step: "01", title: "Compliance Mapping", description: "Listing all event-based and annual triggers for the year." },
      { step: "02", title: "Drafting Resolutions", description: "Preparing standard Board and General Meeting minutes." },
      { step: "03", title: "Form Certification", description: "Verification and attestation by Practicing CS or CA." },
      { step: "04", title: "MCA Portal Upload", description: "Secure filing and monitoring for approval/STP (Straight Through Processing)." }
    ],
    faqs: [
      { question: "What is the penalty for late AOC-4 filing?", answer: "Currently ₹100 per day per form with no upper limit." },
      { question: "Can a company be struck off for non-filing?", answer: "Yes, if filing is pending for 2 consecutive years, MCA can strike off the company." },
      { question: "When is the deadline for AGM?", answer: "Typically within 6 months from the end of the financial year (September 30th)." }
    ]
  },
  "accounting-financial-management-reporting": {
    title: "Accounting, Financial Management & Reporting",
    description: "Beyond bookkeeping—we provide detailed financial insights to drive growth.",
    heroBg: "from-cyan-600 to-blue-700",
    overview: "Accurate financial records are the foundation of business intelligence. Our accounting services integrate modern cloud technology with expert review to provide real-time visibility into your profitability and cash flows.",
    benefits: [
      "Real-time Dashboard of Profits & Losses",
      "Audit-Ready Financial Records throughout the year",
      "Better Control over Expenses & Leaks",
      "Streamlined Accounts Receivable management",
      "Scalable accounting structure as per business growth"
    ],
    subServices: [
      { title: "Cloud Bookkeeping", description: "Using Zoho Books, Quickbooks, or Tally on Cloud for anywhere access." },
      { title: "Payroll Management", description: "Computing salaries, processing ESI/PF, and generating payslips." },
      { title: "MIS Reporting", description: "Customized monthly reports highlighting KPIs and variance analysis." },
      { title: "Accounts Overhauling", description: "Clearing backlog and reconstructing messy accounting records." },
      { title: "Fixed Asset Accounting", description: "Maintaining depreciation schedules and asset registers." }
    ],
    documentsRequired: [
      "Bank Statements (Excel/PDF)",
      "Sales & Purchase Vouchers",
      "Expense Bills & Vouchers",
      "Employee Master Data (for Payroll)",
      "Previous Trial Balance (for conversion)"
    ],
    process: [
      { step: "01", title: "Setup", description: "Configuration of Chart of Accounts and Cost Centers." },
      { step: "02", title: "Operation", description: "Weekly or monthly recording of transactions via cloud access." },
      { step: "03", title: "Reconciliation", description: "Matching bank, GST, and vendor balances." },
      { step: "04", title: "Finalization", description: "Generating P&L, Balance Sheet, and custom MIS packs." }
    ],
    faqs: [
      { question: "Do you provide on-site accounting?", answer: "We primarily work remotely via cloud tools, but provide periodic visits if required." },
      { question: "Can you manage ESI and PF filings?", answer: "Yes, payroll management includes all mandatory labor law compliances." }
    ]
  },
  "audit-forensic-risk-corporate-investigation": {
    title: "Audit, Forensic, Risk & Corporate Investigation",
    description: "Independent assurance and investigation services to safeguard business value.",
    heroBg: "from-indigo-600 to-violet-700",
    overview: "Auditing is about bringing objectivity and trust to your financials. Our experienced auditors look beyond numbers to identify operational risks and internal control gaps.",
    benefits: [
      "Independent Validation of Financial Statements",
      "Early Detection of Internal Frauds or Leaks",
      "Stronger Credibility with Banks and Investors",
      "Assessment of Internal Control Effectiveness",
      "Compliance Verification for Sector-specific laws"
    ],
    subServices: [
      { title: "Statutory Audit", description: "Annual audit as required under the Companies Act, 2013." },
      { title: "Tax Audit", description: "Revenue audit required under Section 44AB of Income Tax Act." },
      { title: "Internal Audit", description: "Operational and SOP-based audits for better management control." },
      { title: "Forensic Audit", description: "Specialized investigation for fraud, embezzlement, or legal disputes." },
      { title: "Due Diligence", description: "Financial and legal review for Mergers, Acquisitions, or PE rounds." },
      { title: "Stock & Inventory Audit", description: "Verification of physical inventory for banks or retail chains." }
    ],
    documentsRequired: [
      "Trial Balance & Financial Statements",
      "Director & Shareholder Registry",
      "Previous Audit Reports & CARO remarks",
      "Key Vendor & Customer Agreements",
      "Internal Control SOP documents"
    ],
    process: [
      { step: "01", title: "Audit Planning", description: "Defining scope, materiality levels, and sampling strategy." },
      { step: "02", title: "Evidence Collection", description: "Vouching, verification of assets, and third-party confirmations." },
      { step: "03", title: "Issue Log", description: "Discussing potential qualifications with the management." },
      { step: "04", title: "Certification", description: "Issuing formal Audit Opinion and UDIN (Unique Doc ID)." }
    ],
    faqs: [
      { question: "Is Tax Audit mandatory for all businesses?", answer: "Mandatory if turnover exceeds ₹1 Cr (or ₹10 Cr if cash transactions are < 5%)." },
      { question: "What is Due Diligence?", answer: "It is a detailed investigation by a potential buyer into a business's records." }
    ]
  },
  "special-services-e-commerce-banking-documentation": {
    title: "Special Services, E-Commerce, Banking & Documentation",
    description: "Niche solutions for online marketplaces and secured banking documentation.",
    heroBg: "from-pink-600 to-red-700",
    overview: "E-commerce sellers and startups have unique needs—from complex marketplace reconciliation to specialized CMA data for bank financing. We provide the technical documentation that bridges the gap between operations and finance.",
    benefits: [
      "Prevents Profit Leakage in Marketplace Commissions",
      "Higher Probability of Bank Loan Approvals (CMA)",
      "Structured Documentation for High-Value Contracts",
      "Specialized Advisory for Digital Business Models"
    ],
    subServices: [
      { title: "Marketplace Reconciliation", description: "Reconciling Amazon/Flipkart/Myntra sales with bank receipts." },
      { title: "CMA Data Preparation", description: "Projected financials for Bank Loan & Credit Limit applications." },
      { title: "Business Projection Modeling", description: "Detailed 5-year financial models for investors or expansions." },
      { title: "Rent/Service Agreement Drafting", description: "Legal vetting and drafting of business contracts." },
      { title: "Escrow & Banking Consulting", description: "Advisory on specialized banking setups for startups." }
    ],
    documentsRequired: [
      "E-commerce Marketplace Sales CSVs",
      "Past 3-5 Years Financial History",
      "Proposed Project Details (for Loans)",
      "Agreement terms or Letter of Intent (LOI)"
    ],
    process: [
      { step: "01", title: "Requirement Mapping", description: "Analyzing the specific format required by banks or marketplaces." },
      { step: "02", title: "Data Structuring", description: "Transforming raw operation data into formal financial projections." },
      { step: "03", title: "Advisory Sync", description: "Reviewing assumptions and justifications for the data." }
    ],
    faqs: [
      { question: "What is CMA Data?", answer: "Credit Monitoring Arrangement data is a report showing past and projected financials for bank credit." },
      { question: "How often should marketplace data be reconciled?", answer: "At least monthly to catch disputes/returns within the marketplace's window." }
    ]
  },
  "virtual-cfo-advisory-services": {
    title: "Virtual CFO & Advisory Services",
    description: "Strategic financial leadership for growth-stage startups and MSMEs.",
    heroBg: "from-slate-700 to-slate-900",
    overview: "You need more than just an accountant; you need a financial co-pilot. Our Virtual CFO services provide high-end strategic guidance, budgeting, profitability analysis, and fundraising support at a fraction of the cost of a full-time executive.",
    benefits: [
      "Access to Elite Financial Strategy & Leadership",
      "Investor-Ready Financial Reporting Standards",
      "Optimization of Working Capital & Burn Rates",
      "Objective Advisory for High-Stakes Decisions",
      "Cost-Effective approach to Financial Governance"
    ],
    subServices: [
      { title: "Strategic Cash Flow Planning", description: "Managing burn rates and extending runways for startups." },
      { title: "Fundraising & Pitch Deck Advisory", description: "Financial modeling and valuation support for VC rounds." },
      { title: "Process Transformation", description: "Implementing ERPs and internal controls for scaling up." },
      { title: "Board Advisory", description: "Strategic representation during Board Meetings and Investor updates." },
      { title: "Business Valuation", description: "Arriving at Fair Market Value using DCF or Comparable methods." }
    ],
    documentsRequired: [
      "Existing Financial Statements (3-5 years)",
      "Organizational Chart and Salary Burn data",
      "Product/Service Pricing & Margin data",
      "Pitch Deck / Business Plan drafts"
    ],
    process: [
      { step: "01", title: "Baseline Assessment", description: "Detailed audit of current financial management maturity." },
      { step: "02", title: "Roadmap Creation", description: "Defining 6-12 month financial goals and reporting cadence." },
      { step: "03", title: "Execution Control", description: "Regular strategy syncs, MIS reviews, and decision support." }
    ],
    faqs: [
      { question: "How is a Virtual CFO different from an Accountant?", answer: "Accountants record the past; a CFO plans the future and manages risk." },
      { question: "What is the typical engagement duration?", answer: "Retainership models usually last 12-24 months for continuous growth support." }
    ]
  }
};
