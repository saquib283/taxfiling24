import {
  ABOUT_FEATURES,
  CONTACT,
  FEATURES,
  PROCESS_STEPS,
  SITE_CONTENT_DEFAULTS,
} from "@/lib/constants";

export type SettingsMap = Record<string, string>;

export type ManagedPageKey = "home" | "about" | "contact" | "services" | "articles";
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
      textField("title", "Title", SITE_CONTENT_DEFAULTS.about_title),
      textareaField("description", "Description", SITE_CONTENT_DEFAULTS.about_description),
      textField("primaryCtaLabel", "Primary Button", "Talk To Expert"),
      textField("secondaryCtaLabel", "Secondary Button", "Schedule Appointment"),
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
          title: settings.about_title || SITE_CONTENT_DEFAULTS.about_title,
          description: settings.about_description || SITE_CONTENT_DEFAULTS.about_description,
          primaryCtaLabel: "Talk To Expert",
          secondaryCtaLabel: "Schedule Appointment",
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
  };

  return {
    ...meta[key],
    templates: getPageTemplates(key),
  };
}

export function getManagedPageDefinitions() {
  return (["home", "about", "contact", "services", "articles"] as ManagedPageKey[]).map((key) =>
    getManagedPageDefinition(key)
  );
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
