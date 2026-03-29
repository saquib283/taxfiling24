import {
  ABOUT_FEATURES,
  CONTACT,
  FEATURES,
  PROCESS_STEPS,
  SITE_CONTENT_DEFAULTS,
} from "@/lib/constants";

export type SettingsMap = Record<string, string>;

export type ManagedPageKey =
  | "home"
  | "about"
  | "contact"
  | "services"
  | "articles"
  | "global"
  | "serviceDetail"
  | "articleDetail"
  | "taxCalculator"
  | "gstCalculator";
export type FieldType = "text" | "textarea" | "url" | "repeater";

export interface ManagedItem {
  id: string;
  isVisible?: boolean;
  [key: string]: string | boolean | undefined;
}

export interface ManagedSection {
  id: string;
  type: string;
  label: string;
  description: string;
  isVisible: boolean;
  data: Record<string, unknown>;
}

export interface BaseFieldDefinition {
  key: string;
  label: string;
  type?: Exclude<FieldType, "repeater">;
  placeholder?: string;
  rows?: number;
}

export interface RepeaterFieldDefinition {
  key: string;
  label: string;
  type: "repeater";
  addLabel?: string;
  fields: BaseFieldDefinition[];
  createItem: () => ManagedItem;
}

export type FieldDefinition = BaseFieldDefinition | RepeaterFieldDefinition;

export interface SectionTemplate {
  type: string;
  label: string;
  description: string;
  allowMultiple?: boolean;
  fields: FieldDefinition[];
  createSection: (settings?: SettingsMap) => ManagedSection;
}

export interface ManagedPageDefinition {
  key: ManagedPageKey;
  label: string;
  description: string;
  route: string;
  settingKey: string;
  templates: SectionTemplate[];
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export function createContentId(prefix: string) {
  const safePrefix = prefix.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSectionFromTemplate(template: SectionTemplate) {
  const section = clone(template.createSection());
  section.id = createContentId(template.type);
  return section;
}

export function createRepeaterItem(field: RepeaterFieldDefinition) {
  const item = clone(field.createItem());
  item.id = createContentId(field.key);
  return item;
}

function mergeDeep<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) {
    return clone(base);
  }

  if (Array.isArray(base)) {
    return clone(override as T);
  }

  if (typeof base === "object" && base !== null && typeof override === "object" && !Array.isArray(override)) {
    const output: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
      if (key in output) {
        output[key] = mergeDeep(output[key] as never, value);
      } else {
        output[key] = clone(value);
      }
    }
    return output as T;
  }

  return clone(override as T);
}

function textField(key: string, label: string, placeholder = ""): BaseFieldDefinition {
  return { key, label, type: "text", placeholder };
}

function textareaField(key: string, label: string, placeholder = "", rows = 4): BaseFieldDefinition {
  return { key, label, type: "textarea", placeholder, rows };
}

function urlField(key: string, label: string, placeholder = ""): BaseFieldDefinition {
  return { key, label, type: "url", placeholder };
}

function repeaterField(
  key: string,
  label: string,
  addLabel: string,
  fields: BaseFieldDefinition[],
  createItem: () => ManagedItem
): RepeaterFieldDefinition {
  return { key, label, type: "repeater", addLabel, fields, createItem };
}

function legacyHomeLayout(settings: SettingsMap, sections: ManagedSection[]) {
  const typeMap: Record<string, string> = {
    HeroSection: "home.hero",
    StatsSection: "home.stats",
    AboutSection: "home.about",
    ServicesSection: "home.services",
    ProcessSection: "home.process",
    FeaturesSection: "home.features",
    TestimonialsSection: "home.testimonials",
    ArticlesSection: "home.articles",
    ComplianceCalendar: "home.calendar",
    NeedGuidanceSection: "home.guidance",
    CTASection: "home.cta",
    FAQSection: "home.faq",
  };

  if (!settings.homepage_layout) {
    return sections;
  }

  try {
    const parsed = JSON.parse(settings.homepage_layout);
    if (!Array.isArray(parsed)) {
      return sections;
    }

    const byType = new Map(sections.map((section) => [section.type, section]));
    const ordered: ManagedSection[] = [];

    for (const item of parsed) {
      const type = typeMap[item?.id];
      const section = type ? byType.get(type) : null;
      if (!section) {
        continue;
      }
      ordered.push({ ...section, isVisible: item?.isVisible ?? section.isVisible });
      byType.delete(type);
    }

    return [...ordered, ...byType.values()];
  } catch {
    return sections;
  }
}

const homeTemplates: SectionTemplate[] = [
  {
    type: "home.hero",
    label: "Hero",
    description: "Top banner, CTA labels, and trust points.",
    fields: [
      textField("badge", "Badge", "Premium Corporate Advisory"),
      textField("headline", "Headline", SITE_CONTENT_DEFAULTS.hero_headline),
      textareaField("subheading", "Subheading", SITE_CONTENT_DEFAULTS.hero_subheading),
      textField("primaryCtaLabel", "Primary Button", "Talk To Expert"),
      textField("secondaryCtaLabel", "Secondary Button", "Explore Services"),
      textField("clientsLabel", "Clients Label", "Happy Clients"),
      textField("experienceLabel", "Experience Label", "Years of Experience"),
      textField("expertsTitle", "Expert Card Title", "Certified Experts"),
      textField("expertsDescription", "Expert Card Description", "CA, CS & Legal Pros"),
      repeaterField(
        "highlights",
        "Trust Highlights",
        "Add highlight",
        [textField("text", "Text", "No Hidden Charges")],
        () => ({ id: "highlight", isVisible: true, text: "" })
      ),
    ],
    createSection: (settings = {}) => ({
      id: "home-hero",
      type: "home.hero",
      label: "Hero",
      description: "Top banner, CTA labels, and trust points.",
      isVisible: true,
      data: {
        badge: settings.hero_badge || "Premium Corporate Advisory",
        headline: settings.hero_headline || SITE_CONTENT_DEFAULTS.hero_headline,
        subheading: settings.hero_subheading || SITE_CONTENT_DEFAULTS.hero_subheading,
        primaryCtaLabel: settings.hero_cta_primary || "Talk To Expert",
        secondaryCtaLabel: settings.hero_cta_secondary || "Explore Services",
        clientsLabel: "Happy Clients",
        experienceLabel: "Years of Experience",
        expertsTitle: "Certified Experts",
        expertsDescription: "CA, CS & Legal Pros",
        highlights: [
          { id: "home-hero-highlight-1", text: "No Hidden Charges", isVisible: true },
          { id: "home-hero-highlight-2", text: "Timely Compliance", isVisible: true },
          { id: "home-hero-highlight-3", text: "Expert Team", isVisible: true },
        ],
      },
    }),
  },
  {
    type: "home.stats",
    label: "Stats Bar",
    description: "Homepage numeric highlights.",
    fields: [
      repeaterField(
        "items",
        "Stats",
        "Add stat",
        [textField("value", "Value", "2000+"), textField("label", "Label", "Happy Clients")],
        () => ({ id: "stat", isVisible: true, value: "", label: "" })
      ),
    ],
    createSection: (settings = {}) => ({
      id: "home-stats",
      type: "home.stats",
      label: "Stats Bar",
      description: "Homepage numeric highlights.",
      isVisible: true,
      data: {
        items: [
          { id: "home-stat-1", value: settings.stats_clients || SITE_CONTENT_DEFAULTS.stats_clients, label: "Happy Clients", isVisible: true },
          { id: "home-stat-2", value: settings.stats_services || "50+", label: "Services Offered", isVisible: true },
          { id: "home-stat-3", value: settings.stats_experience || SITE_CONTENT_DEFAULTS.stats_experience, label: "Years of Experience", isVisible: true },
          { id: "home-stat-4", value: settings.stats_satisfaction || "99%", label: "Secure & Trusted", isVisible: true },
        ],
      },
    }),
  },
  {
    type: "home.about",
    label: "About Preview",
    description: "Short intro block on the homepage.",
    fields: [
      textField("introTitle", "Intro Heading", "About Taxfiling24"),
      textareaField(
        "introDescription",
        "Intro Description",
        "Taxfiling24 makes tax and compliance simple. We handle filings, registrations, and GST work so you can focus on your business."
      ),
      textField("title", "Title", SITE_CONTENT_DEFAULTS.about_title),
      textareaField("description", "Description", SITE_CONTENT_DEFAULTS.about_description),
      textField("primaryCtaLabel", "Primary Button", "Talk To Expert"),
      textField("secondaryCtaLabel", "Secondary Button", "Schedule Appointment"),
      textField("clientsLabel", "Clients Label", "Happy Clients"),
      textField("experienceLabel", "Experience Label", "Years of Experience"),
      repeaterField(
        "features",
        "Feature Cards",
        "Add feature",
        [textField("title", "Title", "Absolute Integrity"), textareaField("description", "Description", "Total transparency in all dealings.", 2)],
        () => ({ id: "feature", isVisible: true, title: "", description: "" })
      ),
    ],
    createSection: (settings = {}) => {
      let features = ABOUT_FEATURES;
      if (settings.about_features_json) {
        try {
          features = JSON.parse(settings.about_features_json);
        } catch {}
      }

      return {
        id: "home-about",
        type: "home.about",
        label: "About Preview",
        description: "Short intro block on the homepage.",
        isVisible: true,
        data: {
          introTitle: "About Taxfiling24",
          introDescription:
            "Taxfiling24 makes tax and compliance simple. We handle filings, registrations, and GST work so you can focus on your business.",
          title: settings.about_title || SITE_CONTENT_DEFAULTS.about_title,
          description: settings.about_description || SITE_CONTENT_DEFAULTS.about_description,
          primaryCtaLabel: "Talk To Expert",
          secondaryCtaLabel: "Schedule Appointment",
          clientsLabel: "Happy Clients",
          experienceLabel: "Years of Experience",
          features: features.map((feature: { title: string; description: string }, index: number) => ({
            id: `home-about-feature-${index + 1}`,
            ...feature,
            isVisible: true,
          })),
        },
      };
    },
  },
  {
    type: "home.services",
    label: "Services Intro",
    description: "Heading above the service cards.",
    fields: [
      textField("title", "Title", "Services We Offer"),
      textareaField("subtext", "Description", "Comprehensive solutions for all your business, tax, and compliance needs"),
      textField("cardCtaLabel", "Card CTA", "Explore Service"),
    ],
    createSection: (settings = {}) => ({
      id: "home-services",
      type: "home.services",
      label: "Services Intro",
      description: "Heading above the service cards.",
      isVisible: true,
      data: {
        title: settings.services_title || "Services We Offer",
        subtext: settings.services_subtext || "Comprehensive solutions for all your business, tax, and compliance needs",
        cardCtaLabel: "Explore Service",
      },
    }),
  },
  {
    type: "home.process",
    label: "Process",
    description: "Strategic process section and steps.",
    fields: [
      textField("badge", "Badge", "Engagement Model"),
      textField("title", "Title", "Our Strategic Operating Model"),
      textareaField("subtext", "Description", "A meticulous, tech-enabled framework designed to ensure absolute regulatory accuracy."),
      repeaterField(
        "steps",
        "Steps",
        "Add step",
        [
          textField("step", "Step Number", "01"),
          textField("title", "Title", "Strategic Discovery"),
          textareaField("description", "Description", "Map your business requirements.", 3),
          textField("image", "Image Path", "/images/process_discovery.png"),
          textField("ctaLabel", "Link Label", "Explore Framework"),
          urlField("ctaHref", "Link URL", "/about"),
        ],
        () => ({ id: "step", isVisible: true, step: "", title: "", description: "", image: "", ctaLabel: "", ctaHref: "" })
      ),
    ],
    createSection: (settings = {}) => {
      let steps = PROCESS_STEPS;
      if (settings.process_steps_json) {
        try {
          steps = JSON.parse(settings.process_steps_json);
        } catch {}
      }

      return {
        id: "home-process",
        type: "home.process",
        label: "Process",
        description: "Strategic process section and steps.",
        isVisible: true,
        data: {
          badge: settings.process_badge || "Engagement Model",
          title: settings.process_title || "Our Strategic Operating Model",
          subtext: settings.process_subtext || "A meticulous, tech-enabled framework designed to ensure absolute regulatory accuracy and strategic scalability for your enterprise.",
          steps: steps.map((step: Record<string, string>, index: number) => ({
            id: `home-process-step-${index + 1}`,
            ctaLabel: "Explore Framework",
            ctaHref: "/about",
            isVisible: true,
            ...step,
          })),
        },
      };
    },
  },
  {
    type: "home.features",
    label: "Features",
    description: "Why choose us section.",
    fields: [
      textField("title", "Title", SITE_CONTENT_DEFAULTS.features_title),
      textareaField("description", "Description", SITE_CONTENT_DEFAULTS.features_description),
      repeaterField(
        "items",
        "Feature Cards",
        "Add feature",
        [textField("title", "Title", "Strategic Compliance Management"), textareaField("description", "Description", "We go beyond periodic filings.", 3)],
        () => ({ id: "feature", isVisible: true, title: "", description: "" })
      ),
    ],
    createSection: (settings = {}) => {
      let items = FEATURES;
      if (settings.features_list) {
        try {
          items = JSON.parse(settings.features_list);
        } catch {}
      }

      return {
        id: "home-features",
        type: "home.features",
        label: "Features",
        description: "Why choose us section.",
        isVisible: true,
        data: {
          title: settings.features_title || SITE_CONTENT_DEFAULTS.features_title,
          description: settings.features_description || SITE_CONTENT_DEFAULTS.features_description,
          items: items.map((item: { title: string; description: string }, index: number) => ({
            id: `home-feature-${index + 1}`,
            ...item,
            isVisible: true,
          })),
        },
      };
    },
  },
  {
    type: "home.testimonials",
    label: "Testimonials",
    description: "Client review marquee heading.",
    fields: [
      textField("badge", "Badge", "Thousands of Happy Clients"),
      textField("title", "Title", "Don't Just Take Our Word For It"),
      textareaField("subtext", "Description", "We build long-term partnerships that drive your business forward."),
    ],
    createSection: (settings = {}) => ({
      id: "home-testimonials",
      type: "home.testimonials",
      label: "Testimonials",
      description: "Client review marquee heading.",
      isVisible: true,
      data: {
        badge: "Thousands of Happy Clients",
        title: settings.testimonials_title || "Don't Just Take Our Word For It",
        subtext: settings.testimonials_subtext || "We build long-term partnerships that drive your business forward with verified transparency and unmatched execution speeds.",
      },
    }),
  },
  {
    type: "home.articles",
    label: "Articles",
    description: "Homepage latest insights section.",
    fields: [
      textField("badge", "Badge", "Market Insights & Compliance Hub"),
      textField("title", "Title", "Strategic Knowledge & Regulatory Updates"),
      textareaField("subtext", "Description", "Stay ahead of the curve with our professional analysis."),
      textField("buttonLabel", "Bottom Button", "Access Complete Knowledge Base"),
    ],
    createSection: (settings = {}) => ({
      id: "home-articles",
      type: "home.articles",
      label: "Articles",
      description: "Homepage latest insights section.",
      isVisible: true,
      data: {
        badge: "Market Insights & Compliance Hub",
        title: settings.articles_title || "Strategic Knowledge & Regulatory Updates",
        subtext: settings.articles_subtext || "Stay ahead of the curve with our professional analysis of India's evolving financial landscape, tax regulations, and corporate compliance standards.",
        buttonLabel: "Access Complete Knowledge Base",
      },
    }),
  },
  {
    type: "home.calendar",
    label: "Compliance Calendar",
    description: "Homepage calendar intro and reminder CTA.",
    fields: [
      textField("badge", "Badge", "Stay Compliant"),
      textField("title", "Title", "Tax Compliance Calendar 2026"),
      textareaField("subtext", "Description", "Never miss an important filing deadline."),
      textField("alertTitle", "Reminder Card Title", "Never Miss a Deadline Again!"),
      textareaField("alertDescription", "Reminder Card Description", "Get automated WhatsApp and email reminders."),
      textField("alertButtonText", "Reminder Button", "Sign Up for Alerts"),
    ],
    createSection: (settings = {}) => ({
      id: "home-calendar",
      type: "home.calendar",
      label: "Compliance Calendar",
      description: "Homepage calendar intro and reminder CTA.",
      isVisible: true,
      data: {
        badge: "Stay Compliant",
        title: settings.calendar_title || "Tax Compliance Calendar 2026",
        subtext: settings.calendar_subtext || "Never miss an important filing deadline. Use our interactive calendar to track GST, Income Tax, and other corporate compliance dates.",
        alertTitle: "Never Miss a Deadline Again!",
        alertDescription: "Get automated WhatsApp and email reminders for all your tax compliances.",
        alertButtonText: "Sign Up for Alerts",
      },
    }),
  },
  {
    type: "home.guidance",
    label: "Guidance Banner",
    description: "Small CTA card before the footer CTA.",
    fields: [
      textField("title", "Title", "Need Guidance?"),
      textareaField("description", "Description", "Need help or looking for any specific service?"),
      textField("buttonLabel", "Button", "Talk To Expert"),
    ],
    createSection: (settings = {}) => ({
      id: "home-guidance",
      type: "home.guidance",
      label: "Guidance Banner",
      description: "Small CTA card before the footer CTA.",
      isVisible: true,
      data: {
        title: settings.guidance_title || "Need Guidance?",
        description: "Need Help? or Looking for any specific service?",
        buttonLabel: settings.guidance_button || "Talk To Expert",
      },
    }),
  },
  {
    type: "home.cta",
    label: "Primary CTA",
    description: "Large closing call to action.",
    fields: [
      textField("headline", "Headline", "Ready to Get Started with Your Business?"),
      textareaField("subtext", "Description", "Let our experts handle your registration, compliance, and taxation."),
      textField("primaryButtonText", "Primary Button", "Submit Your Requirement"),
      textField("secondaryButtonText", "Secondary Button", "Talk To Expert"),
      textField("trustText", "Trust Text", "Trusted by 2000+ businesses across India"),
    ],
    createSection: (settings = {}) => ({
      id: "home-cta",
      type: "home.cta",
      label: "Primary CTA",
      description: "Large closing call to action.",
      isVisible: true,
      data: {
        headline: settings.cta_headline || "Ready to Get Started with Your Business?",
        subtext: settings.cta_subtext || "Let our experts handle your registration, compliance, and taxation. Get your free consultation today!",
        primaryButtonText: settings.cta_button_text || "Submit Your Requirement",
        secondaryButtonText: "Talk To Expert",
        trustText: "Trusted by 2000+ businesses across India",
      },
    }),
  },
  {
    type: "home.faq",
    label: "FAQs",
    description: "Homepage FAQ heading and trust bar.",
    fields: [
      textField("trustBarText", "Trust Bar Text", "Trusted by 2000+ businesses across India"),
      textField("title", "Title", "Frequently Asked Questions"),
      textareaField("subtext", "Description", "Find quick answers to common questions about our services."),
    ],
    createSection: (settings = {}) => ({
      id: "home-faq",
      type: "home.faq",
      label: "FAQs",
      description: "Homepage FAQ heading and trust bar.",
      isVisible: true,
      data: {
        trustBarText: "Trusted by 2000+ businesses across India",
        title: settings.faq_title || "Frequently Asked Questions",
        subtext: settings.faq_subtext || "Find quick answers to common questions about our services",
      },
    }),
  },
];

const aboutTemplates: SectionTemplate[] = [
  {
    type: "about.hero",
    label: "Hero",
    description: "Lead banner on the about page.",
    fields: [
      textField("title", "Title", "About Taxfiling24"),
      textField("highlight", "Highlight", "Taxfiling24"),
      textareaField("description", "Description", "Empowering businesses through simplified taxation."),
      textField("backgroundImage", "Background Image", "/images/team_consulting.png"),
    ],
    createSection: () => ({
      id: "about-hero",
      type: "about.hero",
      label: "Hero",
      description: "Lead banner on the about page.",
      isVisible: true,
      data: {
        title: "About Taxfiling24",
        highlight: "Taxfiling24",
        description: "Empowering businesses through simplified taxation, seamless compliance, and expert financial advisory.",
        backgroundImage: "/images/team_consulting.png",
      },
    }),
  },
  {
    type: "about.story",
    label: "Journey & Vision",
    description: "Narrative and supporting media.",
    fields: [
      textField("title", "Title", "Our Journey & Vision"),
      repeaterField(
        "paragraphs",
        "Paragraphs",
        "Add paragraph",
        [textareaField("text", "Text", "Established with a singular mission...", 4)],
        () => ({ id: "paragraph", isVisible: true, text: "" })
      ),
      textField("badgeTitle", "Badge Title", "Certified Excellence"),
      textField("badgeDescription", "Badge Description", "Recognized industry leaders"),
      textField("image", "Image", "/images/team_consulting.png"),
    ],
    createSection: () => ({
      id: "about-story",
      type: "about.story",
      label: "Journey & Vision",
      description: "Narrative and supporting media.",
      isVisible: true,
      data: {
        title: "Our Journey & Vision",
        paragraphs: [
          {
            id: "about-story-p-1",
            isVisible: true,
            text: "Established with a singular mission to demystify complex tax laws, Taxfiling24 has grown into a premier destination for business compliance in India. We believe that entrepreneurs should focus on what they do best, while we handle the regulatory heavy lifting.",
          },
          {
            id: "about-story-p-2",
            isVisible: true,
            text: "Our vision is to be the most trusted, tech-driven financial advisory firm, fostering growth for startups and established enterprises alike through absolute transparency and unmatched expertise.",
          },
        ],
        badgeTitle: "Certified Excellence",
        badgeDescription: "Recognized industry leaders",
        image: "/images/team_consulting.png",
      },
    }),
  },
  {
    type: "about.expertise",
    label: "Domain Expertise",
    description: "Grid of practice areas.",
    fields: [
      textField("title", "Title", "Domain Expertise"),
      textareaField("description", "Description", "We bring specialized knowledge across multiple professional domains."),
      repeaterField(
        "items",
        "Expertise Cards",
        "Add expertise card",
        [textField("title", "Title", "GST & Indirect Tax"), textareaField("description", "Description", "End-to-end GST management.", 3)],
        () => ({ id: "expertise", isVisible: true, title: "", description: "" })
      ),
    ],
    createSection: () => ({
      id: "about-expertise",
      type: "about.expertise",
      label: "Domain Expertise",
      description: "Grid of practice areas.",
      isVisible: true,
      data: {
        title: "Domain Expertise",
        description: "We bring specialized knowledge across multiple professional domains to ensure your business stays compliant and competitive.",
        items: [
          { id: "about-expertise-1", title: "GST & Indirect Tax", description: "End-to-end GST management including registration, returns, reconciliation, and audit representation.", isVisible: true },
          { id: "about-expertise-2", title: "Direct Taxation", description: "Expert income tax planning for individuals and corporations, handling scrutiny and appeals.", isVisible: true },
          { id: "about-expertise-3", title: "Corporate Law", description: "Comprehensive ROC compliance, annual filings, and secretarial audits for Private Limited Companies and LLPs.", isVisible: true },
          { id: "about-expertise-4", title: "Business Licensing", description: "Fast-track handling of FSSAI, MSME, Startup India, and specialized industrial licenses.", isVisible: true },
        ],
      },
    }),
  },
  {
    type: "about.reasons",
    label: "Why Choose Us",
    description: "Bullet list of differentiators.",
    fields: [
      textField("title", "Title", "Why Choose TaxFiling24?"),
      repeaterField(
        "items",
        "Reason Items",
        "Add reason",
        [textField("title", "Title", "Technology-First Approach"), textareaField("description", "Description", "We use modern cloud-based tools.", 3)],
        () => ({ id: "reason", isVisible: true, title: "", description: "" })
      ),
    ],
    createSection: () => ({
      id: "about-reasons",
      type: "about.reasons",
      label: "Why Choose Us",
      description: "Bullet list of differentiators.",
      isVisible: true,
      data: {
        title: "Why Choose TaxFiling24?",
        items: [
          { id: "about-reason-1", title: "Technology-First Approach", description: "We use modern cloud-based tools for bookkeeping and task management, ensuring real-time visibility for our clients.", isVisible: true },
          { id: "about-reason-2", title: "Unmatched Expertise", description: "Our team consists of senior CAs, CSs, and legal experts with deep practical experience.", isVisible: true },
          { id: "about-reason-3", title: "Transparent Pricing", description: "No hidden costs. We provide clear, competitive pricing from day one.", isVisible: true },
          { id: "about-reason-4", title: "Dedicated Support", description: "Every client is assigned a dedicated compliance manager for faster resolution.", isVisible: true },
        ],
      },
    }),
  },
  {
    type: "about.metrics",
    label: "Metrics Card",
    description: "Dark statistics panel on the about page.",
    fields: [
      textField("title", "Title", "Scaling Success with Data"),
      textareaField("quote", "Quote", "From the narrowest compliance query to broad strategic transformations...", 3),
      repeaterField(
        "items",
        "Metrics",
        "Add metric",
        [textField("label", "Label", "Company Registrations"), textField("value", "Value", "2,500+")],
        () => ({ id: "metric", isVisible: true, label: "", value: "" })
      ),
    ],
    createSection: () => ({
      id: "about-metrics",
      type: "about.metrics",
      label: "Metrics Card",
      description: "Dark statistics panel on the about page.",
      isVisible: true,
      data: {
        title: "Scaling Success with Data",
        quote: "From the narrowest compliance query to broad strategic transformations, we are the catalyst for your business growth.",
        items: [
          { id: "about-metric-1", label: "Company Registrations", value: "2,500+", isVisible: true },
          { id: "about-metric-2", label: "Annual Filings Done", value: "10,000+", isVisible: true },
          { id: "about-metric-3", label: "Expert Professionals", value: "25+", isVisible: true },
          { id: "about-metric-4", label: "Positive Feedbacks", value: "98%", isVisible: true },
        ],
      },
    }),
  },
  {
    type: "about.values",
    label: "Core Values",
    description: "Closing values grid.",
    fields: [
      textField("title", "Title", "Our Core Values"),
      textareaField("description", "Description", "The principles that drive every decision we make."),
      repeaterField(
        "items",
        "Values",
        "Add value",
        [textField("title", "Title", "Integrity"), textareaField("description", "Description", "Absolute transparency and honesty.", 3)],
        () => ({ id: "value", isVisible: true, title: "", description: "" })
      ),
    ],
    createSection: () => ({
      id: "about-values",
      type: "about.values",
      label: "Core Values",
      description: "Closing values grid.",
      isVisible: true,
      data: {
        title: "Our Core Values",
        description: "The principles that drive every decision we make and every service we provide.",
        items: [
          { id: "about-value-1", title: "Integrity", description: "Absolute transparency and honesty in all our dealings. Your trust is our biggest asset.", isVisible: true },
          { id: "about-value-2", title: "Excellence", description: "Commitment to delivering error-free, timely, and premium quality service.", isVisible: true },
          { id: "about-value-3", title: "Client First", description: "Bespoke solutions tailored to meet the unique challenges of your business.", isVisible: true },
        ],
      },
    }),
  },
];

const contactTemplates: SectionTemplate[] = [
  {
    type: "contact.hero",
    label: "Hero",
    description: "Contact page introduction text.",
    fields: [
      textField("eyebrow", "Badge", "Contact Us"),
      textField("title", "Title", "Let's connect & align your finances."),
      textareaField("description", "Description", "Have questions regarding tax filing, GST setup, or audits?"),
    ],
    createSection: () => ({
      id: "contact-hero",
      type: "contact.hero",
      label: "Hero",
      description: "Contact page introduction text.",
      isVisible: true,
      data: {
        eyebrow: "Contact Us",
        title: "Let's connect & align your finances.",
        description: "Have questions regarding tax filing, GST setup, or general audits? Chat with our certified CAs for accurate corporate compliance support.",
      },
    }),
  },
  {
    type: "contact.cards",
    label: "Contact Cards",
    description: "Phone and email quick-contact cards.",
    fields: [
      repeaterField(
        "items",
        "Cards",
        "Add card",
        [
          textField("title", "Title", "Call our Counsel"),
          textField("value", "Value", CONTACT.phone),
          urlField("href", "Link URL", `tel:${CONTACT.phoneRaw}`),
          textField("buttonText", "Button Text", "Call Now"),
        ],
        () => ({ id: "card", isVisible: true, title: "", value: "", href: "", buttonText: "" })
      ),
    ],
    createSection: () => ({
      id: "contact-cards",
      type: "contact.cards",
      label: "Contact Cards",
      description: "Phone and email quick-contact cards.",
      isVisible: true,
      data: {
        items: [
          { id: "contact-card-1", title: "Call our Counsel", value: CONTACT.phone, href: `tel:${CONTACT.phoneRaw}`, buttonText: "Call Now", isVisible: true },
          { id: "contact-card-2", title: "Email Support Desk", value: CONTACT.email, href: `mailto:${CONTACT.email}`, buttonText: "Send Mail", isVisible: true },
        ],
      },
    }),
  },
  {
    type: "contact.address",
    label: "Address",
    description: "Office address block and WhatsApp CTA.",
    fields: [
      textField("title", "Title", "Corporate Address"),
      textareaField("description", "Address", CONTACT.address),
      textField("whatsappLabel", "WhatsApp Button", "Chat on WhatsApp"),
    ],
    createSection: () => ({
      id: "contact-address",
      type: "contact.address",
      label: "Address",
      description: "Office address block and WhatsApp CTA.",
      isVisible: true,
      data: {
        title: "Corporate Address",
        description: CONTACT.address,
        whatsappLabel: "Chat on WhatsApp",
      },
    }),
  },
  {
    type: "contact.form",
    label: "Form Card",
    description: "Lead form card content.",
    fields: [
      textField("title", "Title", "Send us a Message"),
      textareaField("description", "Description", "We typically respond within 24 hours on business days."),
      textField("submitButtonText", "Submit Button", "Submit Application"),
      textField("fullNameLabel", "Full Name Label", "Full Name"),
      textField("fullNamePlaceholder", "Full Name Placeholder", "John Doe"),
      textField("phoneLabel", "Phone Label", "Phone Number"),
      textField("phonePlaceholder", "Phone Placeholder", "+91 98765 43210"),
      textField("emailLabel", "Email Label", "Email Address"),
      textField("emailPlaceholder", "Email Placeholder", "john@example.com"),
      textField("serviceLabel", "Service Label", "Select Service"),
      textField("servicePlaceholder", "Service Placeholder", "Choose service"),
      textField("messageLabel", "Message Label", "Message"),
      textField("messagePlaceholder", "Message Placeholder", "How can we help you?"),
    ],
    createSection: () => ({
      id: "contact-form",
      type: "contact.form",
      label: "Form Card",
      description: "Lead form card content.",
      isVisible: true,
      data: {
        title: "Send us a Message",
        description: "We typically respond within 24 hours on business days.",
        submitButtonText: "Submit Application",
        fullNameLabel: "Full Name",
        fullNamePlaceholder: "John Doe",
        phoneLabel: "Phone Number",
        phonePlaceholder: "+91 98765 43210",
        emailLabel: "Email Address",
        emailPlaceholder: "john@example.com",
        serviceLabel: "Select Service",
        servicePlaceholder: "Choose service",
        messageLabel: "Message",
        messagePlaceholder: "How can we help you?",
      },
    }),
  },
  {
    type: "contact.map",
    label: "Map Intro",
    description: "Heading above the office map.",
    fields: [
      textField("title", "Title", "Visit Our Headquarters"),
      textareaField("description", "Description", "We are centrally located in New Delhi."),
      textField("directContactLabel", "Direct Contact Label", "Direct contact:"),
    ],
    createSection: () => ({
      id: "contact-map",
      type: "contact.map",
      label: "Map Intro",
      description: "Heading above the office map.",
      isVisible: true,
      data: {
        title: "Visit Our Headquarters",
        description: "We are centrally located in New Delhi. Drop by for a coffee and a strategic consultation regarding your corporate compliance.",
        directContactLabel: "Direct contact:",
      },
    }),
  },
];

const servicesTemplates: SectionTemplate[] = [
  {
    type: "services.hero",
    label: "Hero",
    description: "Services index heading and mini stats.",
    fields: [
      textField("titlePrefix", "Title Prefix", "Specialized"),
      textField("titleHighlight", "Title Highlight", "Financial"),
      textareaField("description", "Description", "Precision-engineered solutions for scaling and compliance."),
      repeaterField(
        "stats",
        "Mini Stats",
        "Add stat",
        [textField("label", "Label", "Trust"), textField("value", "Value", "2.5K+")],
        () => ({ id: "service-stat", isVisible: true, label: "", value: "" })
      ),
    ],
    createSection: () => ({
      id: "services-hero",
      type: "services.hero",
      label: "Hero",
      description: "Services index heading and mini stats.",
      isVisible: true,
      data: {
        titlePrefix: "Specialized",
        titleHighlight: "Financial",
        description: "Precision-engineered solutions for scaling and compliance by elite professionals.",
        stats: [
          { id: "services-hero-stat-1", label: "Trust", value: "2.5K+", isVisible: true },
          { id: "services-hero-stat-2", label: "Speed", value: "24h", isVisible: true },
          { id: "services-hero-stat-3", label: "Accuracy", value: "100%", isVisible: true },
        ],
      },
    }),
  },
  {
    type: "services.directory",
    label: "Directory Labels",
    description: "Search, filter, and empty-state copy for the services listing.",
    fields: [
      textField("allServicesLabel", "All Services Label", "All Services"),
      textField("searchPlaceholder", "Search Placeholder", "Search services..."),
      textField("messagePlaceholder", "WhatsApp Message Placeholder", "Your message..."),
      textField("exploreButtonText", "Card Button", "Explore Full Service"),
      textField("defaultCategoryLabel", "Default Category Label", "Consultancy"),
      textField("noResultsTitle", "Empty State Title", "Service Not Found"),
      textareaField(
        "noResultsDescription",
        "Empty State Description",
        "We're expanding our portfolio. Try another keyword or reach out for custom requirements."
      ),
      textField("clearFiltersText", "Clear Filters Label", "Clear all filters"),
    ],
    createSection: () => ({
      id: "services-directory",
      type: "services.directory",
      label: "Directory Labels",
      description: "Search, filter, and empty-state copy for the services listing.",
      isVisible: true,
      data: {
        allServicesLabel: "All Services",
        searchPlaceholder: "Search services...",
        messagePlaceholder: "Your message...",
        exploreButtonText: "Explore Full Service",
        defaultCategoryLabel: "Consultancy",
        noResultsTitle: "Service Not Found",
        noResultsDescription:
          "We're expanding our portfolio. Try another keyword or reach out for custom requirements.",
        clearFiltersText: "Clear all filters",
      },
    }),
  },
  {
    type: "services.cta",
    label: "Bottom CTA",
    description: "Closing CTA on the services page.",
    fields: [
      textField("titlePrefix", "Title Prefix", "Don't See What You're"),
      textField("titleHighlight", "Title Highlight", "Looking For?"),
      textareaField("description", "Description", "Our consultancy services are highly customizable."),
      textField("primaryButtonText", "Primary Button", "Schedule Consultation"),
      textField("secondaryButtonText", "Secondary Button", "Quick Connect"),
    ],
    createSection: () => ({
      id: "services-cta",
      type: "services.cta",
      label: "Bottom CTA",
      description: "Closing CTA on the services page.",
      isVisible: true,
      data: {
        titlePrefix: "Don't See What You're",
        titleHighlight: "Looking For?",
        description: "Our consultancy services are highly customizable. Speak with a Senior Advisor to architect a compliance structure that perfectly fits your business scale.",
        primaryButtonText: "Schedule Consultation",
        secondaryButtonText: "Quick Connect",
      },
    }),
  },
];

const articlesTemplates: SectionTemplate[] = [
  {
    type: "articles.hero",
    label: "Hero",
    description: "Articles index heading and empty-state copy.",
    fields: [
      textField("title", "Title", "Insights & Updates"),
      textareaField("description", "Description", "Stay ahead with the latest tax guidelines."),
      textField("emptyTitle", "Empty State Title", "No articles published yet."),
      textareaField("emptyDescription", "Empty State Description", "Check back soon!"),
      textField("readMoreText", "Card CTA", "Read Full Article"),
    ],
    createSection: () => ({
      id: "articles-hero",
      type: "articles.hero",
      label: "Hero",
      description: "Articles index heading and empty-state copy.",
      isVisible: true,
      data: {
        title: "Insights & Updates",
        description: "Stay ahead with the latest tax guidelines, corporate compliance tips, and financial news.",
        emptyTitle: "No articles published yet.",
        emptyDescription: "Check back soon!",
        readMoreText: "Read Full Article",
      },
    }),
  },
];

const globalTemplates: SectionTemplate[] = [
  {
    type: "global.navbar",
    label: "Navbar",
    description: "Branding and shared navbar labels.",
    fields: [
      textField("brandPrefix", "Brand Prefix", "TaxFiling"),
      textField("brandHighlight", "Brand Highlight", "24"),
      textField("contactButtonLabel", "Contact Button", "Contact"),
      textField("searchPlaceholder", "Desktop Search Placeholder", "Search services..."),
      textField("mobileSearchPlaceholder", "Mobile Search Placeholder", "Search..."),
      textField("noResultsText", "No Results Text", "No services found"),
    ],
    createSection: () => ({
      id: "global-navbar",
      type: "global.navbar",
      label: "Navbar",
      description: "Branding and shared navbar labels.",
      isVisible: true,
      data: {
        brandPrefix: "TaxFiling",
        brandHighlight: "24",
        contactButtonLabel: "Contact",
        searchPlaceholder: "Search services...",
        mobileSearchPlaceholder: "Search...",
        noResultsText: "No services found",
      },
    }),
  },
  {
    type: "global.footer",
    label: "Footer",
    description: "Footer branding, links, newsletter copy, and credits.",
    fields: [
      textareaField(
        "tagline",
        "Tagline",
        "Taxfiling24 makes tax and compliance simple. We handle filings, registrations, and GST work so you can focus on your business."
      ),
      textField("newsletterTitle", "Newsletter Title", "Stay Informed"),
      textareaField(
        "newsletterDescription",
        "Newsletter Description",
        "Subscribe to our newsletter for the latest compliance alerts and tax updates."
      ),
      textField("newsletterPlaceholder", "Newsletter Placeholder", "Enter your email"),
      textField("newsletterButtonText", "Newsletter Button", "Subscribe"),
      textField("exploreHeading", "Explore Heading", "Explore"),
      textField("contactHeading", "Contact Heading", "Get in Touch"),
      repeaterField(
        "quickLinks",
        "Quick Links",
        "Add quick link",
        [textField("label", "Label", "Home"), urlField("href", "URL", "/")],
        () => ({ id: "quick-link", isVisible: true, label: "", href: "" })
      ),
      repeaterField(
        "legalLinks",
        "Legal Links",
        "Add legal link",
        [textField("label", "Label", "Privacy Policy"), urlField("href", "URL", "/privacy")],
        () => ({ id: "legal-link", isVisible: true, label: "", href: "" })
      ),
      repeaterField(
        "socialLinks",
        "Social Links",
        "Add social link",
        [textField("label", "Label", "LinkedIn"), urlField("href", "URL", "#")],
        () => ({ id: "social-link", isVisible: true, label: "", href: "" })
      ),
      textField("copyright", "Copyright", `Copyright ${new Date().getFullYear()} TaxFiling24. All rights reserved.`),
      textField("developerPrefix", "Developer Prefix", "Developed by"),
      textField("developerName", "Developer Name", "Md Rehan Saquib"),
      urlField("developerUrl", "Developer URL", "https://mdrehansaquib.in"),
    ],
    createSection: () => ({
      id: "global-footer",
      type: "global.footer",
      label: "Footer",
      description: "Footer branding, links, newsletter copy, and credits.",
      isVisible: true,
      data: {
        tagline:
          "Taxfiling24 makes tax and compliance simple. We handle filings, registrations, and GST work so you can focus on your business.",
        newsletterTitle: "Stay Informed",
        newsletterDescription:
          "Subscribe to our newsletter for the latest compliance alerts and tax updates.",
        newsletterPlaceholder: "Enter your email",
        newsletterButtonText: "Subscribe",
        exploreHeading: "Explore",
        contactHeading: "Get in Touch",
        quickLinks: [
          { id: "footer-link-1", label: "Home", href: "/", isVisible: true },
          { id: "footer-link-2", label: "About Us", href: "/about", isVisible: true },
          { id: "footer-link-3", label: "Services", href: "/services", isVisible: true },
          { id: "footer-link-4", label: "GST & Tax Tools", href: "/tools/gst-calculator", isVisible: true },
          { id: "footer-link-5", label: "Contact", href: "/contact", isVisible: true },
        ],
        legalLinks: [
          { id: "legal-link-1", label: "Privacy Policy", href: "/privacy", isVisible: true },
          { id: "legal-link-2", label: "Terms of Service", href: "/terms", isVisible: true },
        ],
        socialLinks: [
          { id: "social-link-1", label: "Twitter", href: "#", isVisible: true },
          { id: "social-link-2", label: "Facebook", href: "#", isVisible: true },
          { id: "social-link-3", label: "LinkedIn", href: "#", isVisible: true },
          { id: "social-link-4", label: "Instagram", href: "#", isVisible: true },
        ],
        copyright: `Copyright ${new Date().getFullYear()} TaxFiling24. All rights reserved.`,
        developerPrefix: "Developed by",
        developerName: "Md Rehan Saquib",
        developerUrl: "https://mdrehansaquib.in",
      },
    }),
  },
  {
    type: "global.chatbot",
    label: "Chatbot",
    description: "Site-wide chatbot labels, intro copy, and fallback messages.",
    fields: [
      textField("whatsappLabel", "WhatsApp Label", "WhatsApp"),
      textField("assistantLabel", "Assistant Label", "AI Assistant"),
      textField("headerTitle", "Header Title", "TaxFiling24 Assistant"),
      textareaField(
        "welcomeMessage",
        "Welcome Message",
        "Hello! I am your TaxFiling24 assistant. How can I help you today?"
      ),
      textField("inputPlaceholder", "Input Placeholder", "Ask your question here..."),
      textField("typingLabel", "Typing Label", "Typing..."),
      textField("errorPrefix", "Error Prefix", "Error:"),
      textareaField(
        "connectionErrorMessage",
        "Connection Error Message",
        "Something went wrong. Please check your connection."
      ),
    ],
    createSection: () => ({
      id: "global-chatbot",
      type: "global.chatbot",
      label: "Chatbot",
      description: "Site-wide chatbot labels, intro copy, and fallback messages.",
      isVisible: true,
      data: {
        whatsappLabel: "WhatsApp",
        assistantLabel: "AI Assistant",
        headerTitle: "TaxFiling24 Assistant",
        welcomeMessage: "Hello! I am your TaxFiling24 assistant. How can I help you today?",
        inputPlaceholder: "Ask your question here...",
        typingLabel: "Typing...",
        errorPrefix: "Error:",
        connectionErrorMessage: "Something went wrong. Please check your connection.",
      },
    }),
  },
];

const serviceDetailTemplates: SectionTemplate[] = [
  {
    type: "service-detail.hero",
    label: "Hero",
    description: "Shared hero copy for all service detail pages.",
    fields: [
      textField("backLabel", "Back Label", "Back to Services"),
      textField("quoteButtonText", "Quote Button", "Request a Quote"),
      repeaterField(
        "stats",
        "Hero Stats",
        "Add stat",
        [textField("label", "Label", "Clients Served"), textField("value", "Value", "500+")],
        () => ({ id: "service-stat", isVisible: true, label: "", value: "" })
      ),
    ],
    createSection: () => ({
      id: "service-detail-hero",
      type: "service-detail.hero",
      label: "Hero",
      description: "Shared hero copy for all service detail pages.",
      isVisible: true,
      data: {
        backLabel: "Back to Services",
        quoteButtonText: "Request a Quote",
        stats: [
          { id: "service-detail-stat-1", label: "Clients Served", value: "500+", isVisible: true },
          { id: "service-detail-stat-2", label: "Expert CAs", value: "15+", isVisible: true },
          { id: "service-detail-stat-3", label: "Compliance Rate", value: "99%", isVisible: true },
          { id: "service-detail-stat-4", label: "Support", value: "24/7", isVisible: true },
        ],
      },
    }),
  },
  {
    type: "service-detail.overview",
    label: "Overview",
    description: "Overview and benefits section labels.",
    fields: [
      textField("badge", "Badge", "Service Overview"),
      textField("title", "Title", "Transparent & Secure Professional Guidance"),
      textField("benefitsTitle", "Benefits Title", "Key Benefits & Guarantees"),
    ],
    createSection: () => ({
      id: "service-detail-overview",
      type: "service-detail.overview",
      label: "Overview",
      description: "Overview and benefits section labels.",
      isVisible: true,
      data: {
        badge: "Service Overview",
        title: "Transparent & Secure Professional Guidance",
        benefitsTitle: "Key Benefits & Guarantees",
      },
    }),
  },
  {
    type: "service-detail.subservices",
    label: "Sub-Services",
    description: "Sub-service section heading copy.",
    fields: [
      textField("title", "Title", "Comprehensive Service Deliverable"),
      textareaField(
        "description",
        "Description",
        "Explore the structured services and technical inclusions packed in this solution."
      ),
    ],
    createSection: () => ({
      id: "service-detail-subservices",
      type: "service-detail.subservices",
      label: "Sub-Services",
      description: "Sub-service section heading copy.",
      isVisible: true,
      data: {
        title: "Comprehensive Service Deliverable",
        description:
          "Explore the structured services and technical inclusions packed in this solution.",
      },
    }),
  },
  {
    type: "service-detail.process",
    label: "Process",
    description: "Execution roadmap heading.",
    fields: [textField("title", "Title", "Standard Execution Roadmap")],
    createSection: () => ({
      id: "service-detail-process",
      type: "service-detail.process",
      label: "Process",
      description: "Execution roadmap heading.",
      isVisible: true,
      data: {
        title: "Standard Execution Roadmap",
      },
    }),
  },
  {
    type: "service-detail.documents",
    label: "Documents",
    description: "Required documents card copy.",
    fields: [
      textField("title", "Title", "Required Documents"),
      textareaField("description", "Description", "Pre-requisites for submitting on the portal"),
    ],
    createSection: () => ({
      id: "service-detail-documents",
      type: "service-detail.documents",
      label: "Documents",
      description: "Required documents card copy.",
      isVisible: true,
      data: {
        title: "Required Documents",
        description: "Pre-requisites for submitting on the portal",
      },
    }),
  },
  {
    type: "service-detail.faq",
    label: "FAQ",
    description: "FAQ section title.",
    fields: [textField("title", "Title", "Frequently Asked Questions")],
    createSection: () => ({
      id: "service-detail-faq",
      type: "service-detail.faq",
      label: "FAQ",
      description: "FAQ section title.",
      isVisible: true,
      data: {
        title: "Frequently Asked Questions",
      },
    }),
  },
  {
    type: "service-detail.cta",
    label: "Bottom CTA",
    description: "Closing CTA block.",
    fields: [
      textField("title", "Title", "Require End-to-End Assistance?"),
      textareaField(
        "description",
        "Description",
        "Get corporate advice. No spam. Simply reliable support backed by certified knowledge."
      ),
      textField("primaryButtonText", "Primary Button", "Chat with CA on WhatsApp"),
      textField("secondaryButtonText", "Secondary Button", "Book a Callback"),
    ],
    createSection: () => ({
      id: "service-detail-cta",
      type: "service-detail.cta",
      label: "Bottom CTA",
      description: "Closing CTA block.",
      isVisible: true,
      data: {
        title: "Require End-to-End Assistance?",
        description:
          "Get corporate advice. No spam. Simply reliable support backed by certified knowledge.",
        primaryButtonText: "Chat with CA on WhatsApp",
        secondaryButtonText: "Book a Callback",
      },
    }),
  },
];

const articleDetailTemplates: SectionTemplate[] = [
  {
    type: "article-detail.template",
    label: "Article Template",
    description: "Shared article detail page labels.",
    fields: [
      textField("backLabel", "Back Label", "Back to Articles"),
      textField("readTimeSuffix", "Read Time Suffix", "min read"),
    ],
    createSection: () => ({
      id: "article-detail-template",
      type: "article-detail.template",
      label: "Article Template",
      description: "Shared article detail page labels.",
      isVisible: true,
      data: {
        backLabel: "Back to Articles",
        readTimeSuffix: "min read",
      },
    }),
  },
];

const taxCalculatorTemplates: SectionTemplate[] = [
  {
    type: "tax.hero",
    label: "Hero",
    description: "Tax calculator page heading.",
    fields: [
      textField("titlePrefix", "Title Prefix", "Tax Calculator"),
      textField("titleHighlight", "Title Highlight", "FY 2025-26"),
      textareaField(
        "description",
        "Description",
        "A professional assessment of the Old vs New tax regimes tailored for the latest financial regulations."
      ),
    ],
    createSection: () => ({
      id: "tax-hero",
      type: "tax.hero",
      label: "Hero",
      description: "Tax calculator page heading.",
      isVisible: true,
      data: {
        titlePrefix: "Tax Calculator",
        titleHighlight: "FY 2025-26",
        description:
          "A professional assessment of the Old vs New tax regimes tailored for the latest financial regulations.",
      },
    }),
  },
  {
    type: "tax.income",
    label: "Income Panel",
    description: "Age group and income panel labels.",
    fields: [
      textField("citizenLabel", "General Label", "General"),
      textField("seniorLabel", "Senior Label", "Senior"),
      textField("superSeniorLabel", "Super Senior Label", "Super Senior"),
      textField("panelTitle", "Panel Title", "Income Sources"),
      textField("panelSubtitle", "Panel Subtitle", "Primary sources of earnings"),
      textField("salaryLabel", "Salary Label", "Base Salary"),
      textField("rentalLabel", "Rental Label", "Rental Income"),
      textField("otherIncomeLabel", "Other Income Label", "Other Income"),
      textField("businessToggleLabel", "Business Toggle Label", "Professional / Business Income"),
      textField("grossReceiptsLabel", "Gross Receipts Label", "Gross Receipts"),
      textField("netExpensesLabel", "Net Expenses Label", "Net Expenses"),
    ],
    createSection: () => ({
      id: "tax-income",
      type: "tax.income",
      label: "Income Panel",
      description: "Age group and income panel labels.",
      isVisible: true,
      data: {
        citizenLabel: "General",
        seniorLabel: "Senior",
        superSeniorLabel: "Super Senior",
        panelTitle: "Income Sources",
        panelSubtitle: "Primary sources of earnings",
        salaryLabel: "Base Salary",
        rentalLabel: "Rental Income",
        otherIncomeLabel: "Other Income",
        businessToggleLabel: "Professional / Business Income",
        grossReceiptsLabel: "Gross Receipts",
        netExpensesLabel: "Net Expenses",
      },
    }),
  },
  {
    type: "tax.deductions",
    label: "Deductions Panel",
    description: "Deductions and HRA helper labels.",
    fields: [
      textField("panelTitle", "Panel Title", "Tax Deductions"),
      textField("panelSubtitle", "Panel Subtitle", "Old Regime Exemptions"),
      textField("hraGuideLabel", "HRA Guide Button", "HRA Guide"),
      textField("hraAssistantTitle", "HRA Assistant Title", "HRA Calculator Assistant"),
      textField("basicSalaryLabel", "Basic Salary Label", "Basic Salary"),
      textField("hraReceivedLabel", "HRA Received Label", "HRA Received"),
      textField("rentPaidLabel", "Rent Paid Label", "Rent Paid"),
      textField("metroLabel", "Metro Label", "Metro City?"),
      textField("section80cLabel", "80C Label", "Sec 80C (Max 1.5L)"),
      textField("section80cSubtext", "80C Subtext", "PPF, LIC, ELSS..."),
      textField("section80dLabel", "80D Label", "Sec 80D (Self)"),
      textField("advancedLabel", "Advanced Toggle Label", "Advanced Deductions & Equity"),
      textField("parents80dLabel", "80D Parents Label", "80D Parents"),
      textField("npsLabel", "NPS Label", "NPS 80CCD(1B)"),
      textField("homeLoanLabel", "Home Loan Label", "Home Loan Int."),
      textField("otherDeductionsLabel", "Other Deductions Label", "Other 80G/E..."),
      textField("capitalGainsTitle", "Capital Gains Title", "Capital Gains (Equity Only)"),
      textField("stcgLabel", "STCG Label", "STCG (Short Term)"),
      textField("ltcgLabel", "LTCG Label", "LTCG (Long Term)"),
    ],
    createSection: () => ({
      id: "tax-deductions",
      type: "tax.deductions",
      label: "Deductions Panel",
      description: "Deductions and HRA helper labels.",
      isVisible: true,
      data: {
        panelTitle: "Tax Deductions",
        panelSubtitle: "Old Regime Exemptions",
        hraGuideLabel: "HRA Guide",
        hraAssistantTitle: "HRA Calculator Assistant",
        basicSalaryLabel: "Basic Salary",
        hraReceivedLabel: "HRA Received",
        rentPaidLabel: "Rent Paid",
        metroLabel: "Metro City?",
        section80cLabel: "Sec 80C (Max 1.5L)",
        section80cSubtext: "PPF, LIC, ELSS...",
        section80dLabel: "Sec 80D (Self)",
        advancedLabel: "Advanced Deductions & Equity",
        parents80dLabel: "80D Parents",
        npsLabel: "NPS 80CCD(1B)",
        homeLoanLabel: "Home Loan Int.",
        otherDeductionsLabel: "Other 80G/E...",
        capitalGainsTitle: "Capital Gains (Equity Only)",
        stcgLabel: "STCG (Short Term)",
        ltcgLabel: "LTCG (Long Term)",
      },
    }),
  },
  {
    type: "tax.compliance",
    label: "Compliance Panel",
    description: "Advance-tax and delay label copy.",
    fields: [
      textField("panelTitle", "Panel Title", "Payments & Compliance"),
      textField("panelSubtitle", "Panel Subtitle", "TDS, Advance tax, and delay interests"),
      textField("taxPaidLabel", "Tax Paid Label", "TDS / Advance Tax Paid"),
      textField("delay234ALabel", "234A Label", "234A Delay"),
      textField("delay234BLabel", "234B Label", "234B Delay"),
      textField("monthsLabel", "Months Label", "Months"),
    ],
    createSection: () => ({
      id: "tax-compliance",
      type: "tax.compliance",
      label: "Compliance Panel",
      description: "Advance-tax and delay label copy.",
      isVisible: true,
      data: {
        panelTitle: "Payments & Compliance",
        panelSubtitle: "TDS, Advance tax, and delay interests",
        taxPaidLabel: "TDS / Advance Tax Paid",
        delay234ALabel: "234A Delay",
        delay234BLabel: "234B Delay",
        monthsLabel: "Months",
      },
    }),
  },
  {
    type: "tax.results",
    label: "Results Panel",
    description: "Tax report summary labels and CTAs.",
    fields: [
      textField("panelTitle", "Panel Title", "Tax Report"),
      textField("recommendedLabel", "Recommended Label", "Recommended Strategy"),
      textField("strategySuffix", "Strategy Suffix", "SAVES YOU MOST"),
      textField("savingsLabel", "Savings Label", "Total Net Savings Estimate"),
      textField("oldRegimeLabel", "Old Regime Label", "Old Regime"),
      textField("newRegimeLabel", "New Regime Label", "New Regime"),
      textField("taxableIncomeLabel", "Taxable Income Label", "Taxable Income"),
      textField("delayInterestLabel", "Delay Interest Label", "Delay Interest (234A/B)"),
      textField("totalPayableLabel", "Total Payable Label", "Total Final Payable"),
      textField("downloadLabel", "Download Button", "Download Statement"),
      textField("printLabel", "Print Button", "Print Summary"),
    ],
    createSection: () => ({
      id: "tax-results",
      type: "tax.results",
      label: "Results Panel",
      description: "Tax report summary labels and CTAs.",
      isVisible: true,
      data: {
        panelTitle: "Tax Report",
        recommendedLabel: "Recommended Strategy",
        strategySuffix: "SAVES YOU MOST",
        savingsLabel: "Total Net Savings Estimate",
        oldRegimeLabel: "Old Regime",
        newRegimeLabel: "New Regime",
        taxableIncomeLabel: "Taxable Income",
        delayInterestLabel: "Delay Interest (234A/B)",
        totalPayableLabel: "Total Final Payable",
        downloadLabel: "Download Statement",
        printLabel: "Print Summary",
      },
    }),
  },
];

const gstCalculatorTemplates: SectionTemplate[] = [
  {
    type: "gst.hero",
    label: "Hero",
    description: "GST calculator page heading.",
    fields: [
      textField("titlePrefix", "Title Prefix", "GST &"),
      textField("titleHighlight", "Title Highlight", "Invoicing"),
      textareaField(
        "description",
        "Description",
        "Professional itemized billing and tax calculations compliant with the latest GST regulations."
      ),
    ],
    createSection: () => ({
      id: "gst-hero",
      type: "gst.hero",
      label: "Hero",
      description: "GST calculator page heading.",
      isVisible: true,
      data: {
        titlePrefix: "GST &",
        titleHighlight: "Invoicing",
        description:
          "Professional itemized billing and tax calculations compliant with the latest GST regulations.",
      },
    }),
  },
  {
    type: "gst.controls",
    label: "Controls",
    description: "Top control labels.",
    fields: [
      textField("exclusiveLabel", "Exclusive Label", "Exclusive"),
      textField("inclusiveLabel", "Inclusive Label", "Inclusive"),
      textField("marginLabel", "Margin Label", "Margin"),
      textField("regularLabel", "Regular Label", "Regular"),
      textField("compositionLabel", "Composition Label", "Composition"),
    ],
    createSection: () => ({
      id: "gst-controls",
      type: "gst.controls",
      label: "Controls",
      description: "Top control labels.",
      isVisible: true,
      data: {
        exclusiveLabel: "Exclusive",
        inclusiveLabel: "Inclusive",
        marginLabel: "Margin",
        regularLabel: "Regular",
        compositionLabel: "Composition",
      },
    }),
  },
  {
    type: "gst.entry",
    label: "Item Entry",
    description: "Item entry form and preset search labels.",
    fields: [
      textField("panelTitle", "Panel Title", "Add Item"),
      textField("panelSubtitle", "Panel Subtitle", "Goods or Services entry"),
      textField("goodsLabel", "Goods Label", "goods"),
      textField("servicesLabel", "Services Label", "services"),
      textField("searchPlaceholderGoods", "Goods Search Placeholder", "Search HSN presets..."),
      textField("searchPlaceholderServices", "Services Search Placeholder", "Search SAC presets..."),
      textField("noPresetResultsText", "No Preset Results Text", "No matching presets found"),
      textField("unitPriceLabel", "Unit Price Label", "Unit Price"),
      textField("quantityLabel", "Quantity Label", "Qty"),
      textField("gstRateLabel", "GST Rate Label", "GST %"),
      textField("discountLabel", "Discount Label", "Discount %"),
      textField("cessLabel", "Cess Label", "Cess %"),
      textField("addItemLabel", "Add Item Button", "Add Item"),
      textField("messagePlaceholder", "Item Name Placeholder", "Standard Product"),
    ],
    createSection: () => ({
      id: "gst-entry",
      type: "gst.entry",
      label: "Item Entry",
      description: "Item entry form and preset search labels.",
      isVisible: true,
      data: {
        panelTitle: "Add Item",
        panelSubtitle: "Goods or Services entry",
        goodsLabel: "goods",
        servicesLabel: "services",
        searchPlaceholderGoods: "Search HSN presets...",
        searchPlaceholderServices: "Search SAC presets...",
        noPresetResultsText: "No matching presets found",
        unitPriceLabel: "Unit Price",
        quantityLabel: "Qty",
        gstRateLabel: "GST %",
        discountLabel: "Discount %",
        cessLabel: "Cess %",
        addItemLabel: "Add Item",
        messagePlaceholder: "Standard Product",
      },
    }),
  },
  {
    type: "gst.compliance",
    label: "Compliance & ITC",
    description: "Place-of-supply and ITC card labels.",
    fields: [
      textField("placeOfSupplyTitle", "Place of Supply Title", "Place of Supply"),
      textField("intraLabel", "Intra-State Label", "Intra-State"),
      textField("interLabel", "Inter-State Label", "Inter-State"),
      textField("reverseChargeTitle", "Reverse Charge Title", "Reverse Charge"),
      textField("reverseChargeDescription", "Reverse Charge Description", "Tax paid by recipient"),
      textField("itcTitle", "ITC Title", "Purchase Inputs (ITC)"),
      textField("itcSubtitle", "ITC Subtitle", "Offset your tax liability"),
      textField("totalPurchasesLabel", "Total Purchases Label", "Total Purchases"),
      textField("inputGstLabel", "Input GST Label", "Input GST %"),
    ],
    createSection: () => ({
      id: "gst-compliance",
      type: "gst.compliance",
      label: "Compliance & ITC",
      description: "Place-of-supply and ITC card labels.",
      isVisible: true,
      data: {
        placeOfSupplyTitle: "Place of Supply",
        intraLabel: "Intra-State",
        interLabel: "Inter-State",
        reverseChargeTitle: "Reverse Charge",
        reverseChargeDescription: "Tax paid by recipient",
        itcTitle: "Purchase Inputs (ITC)",
        itcSubtitle: "Offset your tax liability",
        totalPurchasesLabel: "Total Purchases",
        inputGstLabel: "Input GST %",
      },
    }),
  },
  {
    type: "gst.entries",
    label: "Entries List",
    description: "Transaction list labels and empty state.",
    fields: [
      textField("title", "Title", "Transaction Entries"),
      textField("itemCountSuffix", "Item Count Suffix", "Items"),
      textField("emptyStateText", "Empty State Text", "No items added yet"),
      textField("descriptionColumn", "Description Column", "Description"),
      textField("quantityColumn", "Quantity Column", "Qty/Rate"),
      textField("totalColumn", "Total Column", "Total Net"),
    ],
    createSection: () => ({
      id: "gst-entries",
      type: "gst.entries",
      label: "Entries List",
      description: "Transaction list labels and empty state.",
      isVisible: true,
      data: {
        title: "Transaction Entries",
        itemCountSuffix: "Items",
        emptyStateText: "No items added yet",
        descriptionColumn: "Description",
        quantityColumn: "Qty/Rate",
        totalColumn: "Total Net",
      },
    }),
  },
  {
    type: "gst.summary",
    label: "Summary",
    description: "Invoice summary labels and CTAs.",
    fields: [
      textField("panelTitle", "Panel Title", "Invoice Summary"),
      textField("panelSubtitle", "Panel Subtitle", "Live Computation"),
      textField("totalPayableLabel", "Total Payable Label", "Total Amount Payable"),
      textField("totalPayableDescription", "Total Payable Description", "Inclusive of all taxes & cess"),
      textField("taxableBaseLabel", "Taxable Base Label", "Net Taxable Base"),
      textField("discountsLabel", "Discounts Label", "Discounts Applied"),
      textField("cgstLabel", "CGST Label", "CGST Breakdown"),
      textField("sgstLabel", "SGST Label", "SGST Breakdown"),
      textField("igstLabel", "IGST Label", "Integrated GST (IGST)"),
      textField("cessBreakdownLabel", "Cess Label", "Compensation Cess"),
      textField("itcOffsetLabel", "ITC Offset Label", "ITC Claimed Offset"),
      textField("netGstLabel", "Net GST Label", "Net GST Cash Payable"),
      textField("standardDescription", "Standard Description", "Standard Liability"),
      textField("creditDescription", "Credit Description", "Utilizing Input Credits"),
      textField("compositionDescription", "Composition Description", "Composition Scheme Rate"),
      textField("exportLabel", "Export Button", "Export Data"),
      textField("printLabel", "Print Button", "Print Invoice"),
      textField("marginAnalysisTitle", "Margin Analysis Title", "Profit Margin Analysis"),
      textField("expectedMarginLabel", "Expected Margin Label", "Expected Margin %"),
      textField("estimatedProfitLabel", "Estimated Profit Label", "Estimated Profit"),
    ],
    createSection: () => ({
      id: "gst-summary",
      type: "gst.summary",
      label: "Summary",
      description: "Invoice summary labels and CTAs.",
      isVisible: true,
      data: {
        panelTitle: "Invoice Summary",
        panelSubtitle: "Live Computation",
        totalPayableLabel: "Total Amount Payable",
        totalPayableDescription: "Inclusive of all taxes & cess",
        taxableBaseLabel: "Net Taxable Base",
        discountsLabel: "Discounts Applied",
        cgstLabel: "CGST Breakdown",
        sgstLabel: "SGST Breakdown",
        igstLabel: "Integrated GST (IGST)",
        cessBreakdownLabel: "Compensation Cess",
        itcOffsetLabel: "ITC Claimed Offset",
        netGstLabel: "Net GST Cash Payable",
        standardDescription: "Standard Liability",
        creditDescription: "Utilizing Input Credits",
        compositionDescription: "Composition Scheme Rate",
        exportLabel: "Export Data",
        printLabel: "Print Invoice",
        marginAnalysisTitle: "Profit Margin Analysis",
        expectedMarginLabel: "Expected Margin %",
        estimatedProfitLabel: "Estimated Profit",
      },
    }),
  },
  {
    type: "gst.goods-presets",
    label: "Goods Presets",
    description: "Editable HSN preset rows.",
    fields: [
      repeaterField(
        "items",
        "Goods Presets",
        "Add goods preset",
        [
          textField("hsn", "HSN", "8471"),
          textField("desc", "Description", "Laptops / Computers"),
          textField("rate", "Rate", "18"),
          textField("category", "Category", "Electronics"),
        ],
        () => ({ id: "goods-preset", isVisible: true, hsn: "", desc: "", rate: "", category: "" })
      ),
    ],
    createSection: () => ({
      id: "gst-goods-presets",
      type: "gst.goods-presets",
      label: "Goods Presets",
      description: "Editable HSN preset rows.",
      isVisible: true,
      data: {
        items: [
          { id: "goods-preset-1", hsn: "0101", desc: "Live Horses", rate: "0", category: "Agriculture", isVisible: true },
          { id: "goods-preset-2", hsn: "2106", desc: "Food Preparations", rate: "18", category: "Food", isVisible: true },
          { id: "goods-preset-3", hsn: "3004", desc: "Medicaments / Medicines", rate: "5", category: "Pharma", isVisible: true },
          { id: "goods-preset-4", hsn: "8471", desc: "Laptops / Computers", rate: "18", category: "Electronics", isVisible: true },
          { id: "goods-preset-5", hsn: "8517", desc: "Mobile Phones", rate: "18", category: "Electronics", isVisible: true },
        ],
      },
    }),
  },
  {
    type: "gst.service-presets",
    label: "Service Presets",
    description: "Editable SAC preset rows.",
    fields: [
      repeaterField(
        "items",
        "Service Presets",
        "Add service preset",
        [
          textField("hsn", "SAC", "9993"),
          textField("desc", "Description", "CA / Professional Services"),
          textField("rate", "Rate", "18"),
          textField("category", "Category", "Professional"),
        ],
        () => ({ id: "service-preset", isVisible: true, hsn: "", desc: "", rate: "", category: "" })
      ),
    ],
    createSection: () => ({
      id: "gst-service-presets",
      type: "gst.service-presets",
      label: "Service Presets",
      description: "Editable SAC preset rows.",
      isVisible: true,
      data: {
        items: [
          { id: "service-preset-1", hsn: "9954", desc: "Construction Services", rate: "18", category: "Construction", isVisible: true },
          { id: "service-preset-2", hsn: "9963", desc: "Hotel stays < Rs. 7,500/day", rate: "5", category: "Hospitality", isVisible: true },
          { id: "service-preset-3", hsn: "9983", desc: "IT / Software Services", rate: "18", category: "IT", isVisible: true },
          { id: "service-preset-4", hsn: "9993", desc: "CA / Professional Services", rate: "18", category: "Professional", isVisible: true },
        ],
      },
    }),
  },
];

function getPageTemplates(key: ManagedPageKey) {
  switch (key) {
    case "home":
      return homeTemplates;
    case "about":
      return aboutTemplates;
    case "contact":
      return contactTemplates;
    case "services":
      return servicesTemplates;
    case "articles":
      return articlesTemplates;
    case "global":
      return globalTemplates;
    case "serviceDetail":
      return serviceDetailTemplates;
    case "articleDetail":
      return articleDetailTemplates;
    case "taxCalculator":
      return taxCalculatorTemplates;
    case "gstCalculator":
      return gstCalculatorTemplates;
  }
}

export function getManagedPageDefinition(key: ManagedPageKey): ManagedPageDefinition {
  const meta: Record<ManagedPageKey, Omit<ManagedPageDefinition, "templates">> = {
    home: {
      key: "home",
      label: "Homepage",
      description: "Hero, homepage sections, ordering, and visibility.",
      route: "/",
      settingKey: "page_content_home",
    },
    about: {
      key: "about",
      label: "About Page",
      description: "Company story, expertise, reasons, and values.",
      route: "/about",
      settingKey: "page_content_about",
    },
    contact: {
      key: "contact",
      label: "Contact Page",
      description: "Contact hero, quick cards, form copy, and map intro.",
      route: "/contact",
      settingKey: "page_content_contact",
    },
    services: {
      key: "services",
      label: "Services Index",
      description: "Services landing page hero and CTA.",
      route: "/services",
      settingKey: "page_content_services",
    },
    articles: {
      key: "articles",
      label: "Articles Index",
      description: "Articles landing page hero and empty state.",
      route: "/articles",
      settingKey: "page_content_articles",
    },
    global: {
      key: "global",
      label: "Global Layout",
      description: "Navbar and footer content used across the entire website.",
      route: "All pages",
      settingKey: "page_content_global",
    },
    serviceDetail: {
      key: "serviceDetail",
      label: "Service Detail Template",
      description: "Shared copy for all individual service detail pages.",
      route: "/services/[slug]",
      settingKey: "page_content_service_detail",
    },
    articleDetail: {
      key: "articleDetail",
      label: "Article Detail Template",
      description: "Shared copy for article detail pages.",
      route: "/articles/[slug]",
      settingKey: "page_content_article_detail",
    },
    taxCalculator: {
      key: "taxCalculator",
      label: "Tax Calculator",
      description: "Income tax calculator page copy and labels.",
      route: "/tools/tax-calculator",
      settingKey: "page_content_tax_calculator",
    },
    gstCalculator: {
      key: "gstCalculator",
      label: "GST Calculator",
      description: "GST calculator page copy, labels, and preset tables.",
      route: "/tools/gst-calculator",
      settingKey: "page_content_gst_calculator",
    },
  };

  return {
    ...meta[key],
    templates: getPageTemplates(key),
  };
}

export function getManagedPageDefinitions() {
  return (
    [
      "home",
      "about",
      "contact",
      "services",
      "articles",
      "global",
      "serviceDetail",
      "articleDetail",
      "taxCalculator",
      "gstCalculator",
    ] as ManagedPageKey[]
  ).map((key) => getManagedPageDefinition(key));
}

function getDefaultSections(key: ManagedPageKey, settings: SettingsMap = {}) {
  const templates = getPageTemplates(key);
  const sections = templates.map((template) => template.createSection(settings));
  return key === "home" ? legacyHomeLayout(settings, sections) : sections;
}

function normalizeSection(section: ManagedSection, templates: SectionTemplate[]) {
  const template = templates.find((item) => item.type === section.type);
  if (!template) {
    return section;
  }

  const fallback = template.createSection();
  return {
    ...fallback,
    ...section,
    id: section.id || fallback.id || createContentId(template.type),
    data: mergeDeep(fallback.data, section.data),
  };
}

export function getManagedPageSections(key: ManagedPageKey, settings: SettingsMap = {}) {
  const definition = getManagedPageDefinition(key);
  const raw = settings[definition.settingKey];

  if (!raw) {
    return getDefaultSections(key, settings);
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return getDefaultSections(key, settings);
    }
    return parsed.map((section: ManagedSection) => normalizeSection(section, definition.templates));
  } catch {
    return getDefaultSections(key, settings);
  }
}

export function findManagedSection<T extends Record<string, unknown>>(sections: ManagedSection[], type: string) {
  return sections.find((section) => section.type === type) as (ManagedSection & { data: T }) | undefined;
}
