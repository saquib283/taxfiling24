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
    description: "Start your entrepreneurial journey with confidence. From Private Limited Companies to LLPs, we handle everything from incorporation to legal compliance.",
    heroBg: "from-blue-600 to-indigo-700",
    overview: "Whether you're a first-time founder or an established business expanding into new markets, setting up the right legal structure is crucial. Our experts guide you through selection, document preparation, and government filing to ensure a fast, hassle-free registration process.",
    benefits: [
      "Separate Legal Entity Protection",
      "Perpetual Succession & Continuity",
      "Easier Access to Corporate Funding",
      "Enhanced Brand Credibility & Trust",
      "Tax Planning & Liability Shield"
    ],
    subServices: [
      { title: "Private Limited Company", description: "The most popular structure for startups. Offers limited liability and high scalability." },
      { title: "LLP Registration", description: "Combines benefits of partnership with limited liability. Low compliance costs." },
      { title: "One Person Company (OPC)", description: "For solo founders who want the benefits of a corporate structure." },
      { title: "Partnership Firm", description: "Agreement between two or more people to share profits/losses." },
      { title: "Sole Proprietorship", description: "Easy to start, minimal compliance required for small vendors." }
    ],
    documentsRequired: [
      "PAN Card & Aadhaar Card of Directors/Partners",
      "Passport sized Photographs of founders",
      "Address Proof of Business Premises (Rent Agreement/Utility Bill)",
      "NOC from Owner of premises (for rented locations)",
      "Specimen Signature / DSC forms"
    ],
    process: [
      { step: "01", title: "DSC Procurement", description: "Digital Signature Certificate generation for directors." },
      { step: "02", title: "Name Approval", description: "Filing application for securing available company names." },
      { step: "03", title: "Documentation", description: "Drafting MOA, AOA, and other incorporation declaration forms." },
      { step: "04", title: "Incorporation filing", description: "Submitting SPICe+ forms with MCA and government authorities." },
      { step: "05", title: "Certificate of Incorporation", description: "Receiving COI along with PAN and TAN allotment." }
    ],
    faqs: [
      { question: "How long does it take for Company Registration?", answer: "Typically 10-15 working days depending on government approval speed." },
      { question: "What is minimum capital required for Pvt Ltd?", answer: "There is no minimum paid-up capital requirement defined by MCA now." }
    ]
  },
  "licences-ip-certifications-legal-registrations": {
    title: "Licences, IP, Certifications & Legal Registrations",
    description: "Protect your intellectual property and stay compliant with necessary state/national licenses.",
    heroBg: "from-purple-600 to-blue-700",
    overview: "Protecting your branding (IP) and ensuring correct operating licenses (like FSSAI, MSME) is essential to avoid penalties and build valuation. We streamline the registration flow for smooth approval rounds.",
    benefits: [
      "Exclusive Rights to Brand Assets",
      "Legal Shield against Infringement",
      "Eligible for Government Subsidies",
      "Hassle-free B2B Invoice raising"
    ],
    subServices: [
      { title: "Trademark Registration", description: "Establish ownership of your logo, wordmark, or catchphrase." },
      { title: "MSME / Udyam Certificate", description: "Get MSME benefits, collateral-free loans, and prompt payments." },
      { title: "FSSAI (Food License)", description: "Mandatory for anyone involved in manufacturing, packaging, or sale of food." },
      { title: "Import-Export Code (IEC)", description: "Mandatory for shipping services and material to/from India." }
    ],
    documentsRequired: [
      "PAN Card of Business Owner",
      "Logo representation/image (for trademarks)",
      "Adhaar Card for Udyam Verification",
      "Establishment Rent agreement or lease document"
    ],
    process: [
      { step: "01", title: "Application Drafting", description: "Classifying right code/license classes accurately." },
      { step: "02", title: "Verification Setup", description: "Securing supporting business evidence." },
      { step: "03", title: "Government Portal Filing", description: "Direct sub-filmg with authorities." }
    ],
    faqs: [
      { question: "Can a trademark be self-submitted?", answer: "Yes, but expert analysis avoids relative grounds opposition." }
    ]
  },
  "taxation-gst-compliance-management": {
    title: "Taxation, GST & Compliance Management",
    description: "Manage GST filing and complete income tax returns seamlessly with certified CA experts.",
    heroBg: "from-emerald-600 to-teal-700",
    overview: "Managing taxation shouldn't be stressful. We help you file timely returns, optimize tax outgo legally, and handle assessments or notices effectively.",
    benefits: [
      "Avoid Heavy Penalty accruals",
      "Identify Legal Deductions and Credits",
      "Continuous GST Return Health monitoring",
      "Zero compliance backlog guarantee"
    ],
    subServices: [
      { title: "GST Registration & Filing", description: "Initial setup plus regular monthly or quarterly filings." },
      { title: "Corporate Tax Returns", description: "Advanced tax planning and filling schedules for Pvt/LLP." },
      { title: "Individual ITR-1/4", description: "Affordable Filing for Salaried and Small vendors." },
      { title: "TDS Returns filling", description: "Keep track of tax deducted on invoices easily." }
    ],
    documentsRequired: [
      "Sales & Purchase Registers / Invoices",
      "Bank Statement (full year / current quarter)",
      "Form 26AS matching records",
      "Previous filed ITR details (if any)"
    ],
    process: [
      { step: "01", title: "Data Collection", description: "Receiving invoices or bank logs from the client." },
      { step: "02", title: "Reconciliation", description: "Matching sales data with continuous GST portal reports." },
      { step: "03", title: "Draft filing review", description: "Sending liability or refund sheet for approval." },
      { step: "04", title: "E-filing", description: "Generating ARN or ITR-V acknowledgement." }
    ],
    faqs: [
      { question: "What happens if I miss a GST return deadline?", answer: "Late fees of standard ₹50/day and 18% interest on liability applies." }
    ]
  },
  "corporate-roc-secretarial-filings": {
    title: "Corporate, ROC & Secretarial Filings",
    description: "Maintain MCA compliance and annual secretarial governance standards.",
    heroBg: "from-amber-500 to-orange-600",
    overview: "Updating Ministry of Corporate Affairs regarding changes, Board logs, and annual filings keeps directors safe from disqualification and companies active.",
    benefits: [
      "Clean MCA Status for Credit tests",
      "Fast Approval for Foreign Investment",
      "Zero Legal Notices from Registrar"
    ],
    subServices: [
      { title: "Annual Filing (AOC-4 & MGT-7)", description: "Upload balance sheet and director summaries annually." },
      { title: "Director KYC / DIN eKYC", description: "Yearly updating logs to ensure DIN stays active." },
      { title: "Change in Director / Capital", description: "Update state structure seamlessly." }
    ],
    documentsRequired: [
      "Audited Balance sheet of company",
      "Board meeting attendance sheet",
      "Director PAN/Aadhaar bundle"
    ],
    process: [
      { step: "01", title: "Adoption Meet", description: "Formally verify balance records in AGM." },
      { step: "02", title: "Forms Preparation", description: "Drafting accurate AOC and secretarial forms." },
      { step: "03", title: "E-Certification", description: "Attesting via practicing CA/CS signatures." }
    ],
    faqs: [
      { question: "Do small companies need ROC filings?", answer: "Yes, standard annual filings apply to all Incorporation types." }
    ]
  },
  // Add remaining categories with similar detail
  "accounting-financial-management-reporting": {
    title: "Accounting, Financial Management & Reporting",
    description: "Accurate bookkeeping and detailed financial analytics for better decision-making.",
    heroBg: "from-cyan-600 to-blue-700",
    overview: "Maintain real-time view on cashflow, profit margins, and inventory using online or offline accounting assistance.",
    benefits: ["Data Backed Decision Making", "Continuous Cashflow visibility", "Faster Loan approvals with clean books"],
    subServices: [
      { title: "Online Bookkeeping", description: "Remote tally or zoho assistance." },
      { title: "MIS & Board Reporting", description: "Receive custom business breakdown on margins." }
    ],
    documentsRequired: ["Bank Statements", "Purchase/Sale invoices", "Expense Vouchers"],
    process: [{ step: "01", title: "Software setup", description: "Cloud or Local structure setup." }, { step: "02", title: "Continuous Entry", description: "Periodical recording of vouchers." }],
    faqs: [{ question: "Do you support Tally/Zoho?", answer: "Yes, we support all major bookkeeping suits." }]
  },
  "audit-forensic-risk-corporate-investigation": {
    title: "Audit, Forensic, Risk & Corporate Investigation",
    description: "Verify financials and identify internal control leaks.",
    heroBg: "from-indigo-600 to-violet-700",
    overview: "Establish transparency with internal, statutory, or tax audits conducted by experienced auditors.",
    benefits: ["Boost Investor confidence", "Detect Fraud or errors EARLY", "Full Legal compliance certificate"],
    subServices: [
      { title: "Statutory & Tax Audit", description: "Necessary annual reviews for revenue brackets." },
      { title: "Internal Control Audit", description: "Review SOPs for material items." }
    ],
    documentsRequired: ["Trial balances", "Bank Match tallies", "Vendor contract confirmations"],
    process: [{ step: "01", title: "Fieldwork", description: "Sampling operations and verification." }, { step: "02", title: "Draft Report", description: "Sending management checklist for remarks." }],
    faqs: [{ question: "Is audit mandatory for all?", answer: "Depends on Turnover/Structure type, generally above setup caps." }]
  },
  "special-services-e-commerce-banking-documentation": {
    title: "Special Services, E-Commerce, Banking & Documentation",
    description: "Customized support for online vendors and banking assistance.",
    heroBg: "from-pink-600 to-red-700",
    overview: "We help online e-com sellers handle marketplace reconciliation along with documentation for banks or high court requirements.",
    benefits: ["Marketplace revenue matching", "Speed banking clearance", "Dedicated startup advisory"],
    subServices: [
      { title: "E-Commerce Reconciliation", description: "Match Amazon/Filpkart invoices with amounts received." },
      { title: "CMA Data Preparation", description: "Projected financials for secured bank financing." }
    ],
    documentsRequired: ["E-commerce Seller CSV dumps", "Bank terms sheets", "Past 3-year financials"],
    process: [{ step: "01", title: "Review requirements", description: "Custom analysis of format preferred." }, { step: "02", title: "Data mapping", description: "Mapping heavy data dumps mechanically." }],
    faqs: [{ question: "Do you assist with Bank Loans?", answer: "We assist in CMA report prep required for it." }]
  },
  "virtual-cfo-advisory-services": {
    title: "Virtual CFO & Advisory Services",
    description: "High-end financial strategy, budgeting, and advisory without the overhead of a full-time executive.",
    heroBg: "from-slate-700 to-slate-900",
    overview: "Our Virtual CFO services provide startups and SMEs with expert financial guidance, cash flow management, profitability analysis, and strategic planning. We act as your financial co-pilot to help you steer the business toward sustainable growth.",
    benefits: [
      "Access to Expert Financial Strategies",
      "Cost-Effective alternative to full-time CFO",
      "Better Cash Flow & Working Capital Management",
      "Investor-Ready Financial Modeling"
    ],
    subServices: [
      { title: "Financial Planning & Analysis", description: "Deep dive into profit margins and future projections." },
      { title: "Cash Flow Management", description: "Monitor and optimize the inflow and outflow of funds." },
      { title: "Fundraising Support", description: "Pitch deck financials, term sheet reviews, and investor reporting." },
      { title: "Process Implementation", description: "Setting up robust internal financial controls and ERPs." }
    ],
    documentsRequired: [
      "Past 3 years Audited Financials",
      "Current Business Plan or Pitch Deck",
      "Existing MIS Reports (if any)"
    ],
    process: [
      { step: "01", title: "Business Understanding", description: "Initial deep dive into your business model and pain points." },
      { step: "02", title: "Gap Analysis", description: "Evaluating current financial health and control systems." },
      { step: "03", title: "Strategy Implementation", description: "Executing tailored financial plans and monthly reviews." }
    ],
    faqs: [
      { question: "Is Virtual CFO service suitable for early-stage startups?", answer: "Yes, it helps startups establish strong financial foundations from day one." },
      { question: "How often do we interact with our Virtual CFO?", answer: "Typically, weekly alignment syncs and detailed monthly board meetings." }
    ]
  }
};
