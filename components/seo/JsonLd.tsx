import { getSiteContact } from "@/lib/site-contact";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export default function JsonLd({ data }: JsonLdProps) {
  const jsonLd = Array.isArray(data) ? data : [data];
  return (
    <>
      {jsonLd.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}

// ─── Schema Generators ───────────────────────────────────────────────

const BASE_URL = SITE_URL;
const ORG_ID = `${BASE_URL}/#organization`;
const WEBSITE_ID = `${BASE_URL}/#website`;
const LOCAL_BUSINESS_ID = `${BASE_URL}/#localbusiness`;
type SiteSettings = Record<string, string>;

function buildPostalAddress(address: string) {
  return {
    "@type": "PostalAddress",
    streetAddress: address,
    addressLocality: "New Delhi",
    addressRegion: "DL",
    postalCode: "110025",
    addressCountry: "IN",
  };
}

export function organizationSchema(settings: SiteSettings = {}) {
  const { phone, address, whatsapp } = getSiteContact(settings);
  const socialSameAs = [
    settings.social_linkedin,
    settings.social_twitter,
    settings.social_facebook,
    settings.social_instagram,
    whatsapp,
  ].filter((url): url is string => Boolean(url && /^https?:\/\//i.test(url)));

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "TaxFiling24",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/brand-logo.png`,
      width: 1277,
      height: 444,
    },
    description:
      "Your Trusted Partner for Business Registration, Taxation, Compliance & Financial Advisory across India.",
    foundingDate: "2020",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: phone,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    address: buildPostalAddress(address),
    ...(socialSameAs.length > 0 ? { sameAs: socialSameAs } : {}),
  };
}

export function webSiteSchema(siteName = "TaxFiling24") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: siteName,
    alternateName: ["TaxFiling24.com", "Tax Filing 24"],
    url: `${BASE_URL}/`,
    publisher: {
      "@id": ORG_ID,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/services?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function localBusinessSchema(settings: SiteSettings = {}) {
  const { phone, email, address } = getSiteContact(settings);
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": LOCAL_BUSINESS_ID,
    name: "TaxFiling24",
    url: BASE_URL,
    image: `${BASE_URL}/logo.png`,
    telephone: phone,
    email,
    priceRange: "INR 1000-10000",
    parentOrganization: {
      "@id": ORG_ID,
    },
    address: buildPostalAddress(address),
    geo: {
      "@type": "GeoCoordinates",
      latitude: "28.5494",
      longitude: "77.3005",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
        ],
        opens: "09:00",
        closes: "20:00",
      },
    ],
    areaServed: {
      "@type": "Country",
      name: "India",
    },
  };
}

export function collectionPageSchema(page: {
  description: string;
  name: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    description: page.description,
    isPartOf: {
      "@type": "WebSite",
      name: "TaxFiling24",
      url: BASE_URL,
    },
    name: page.name,
    url: page.url,
  };
}

export function itemListSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      name: item.name,
      position: index + 1,
      url: item.url,
    })),
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function serviceSchema(service: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.name,
    name: service.name,
    description: service.description,
    url: service.url,
    provider: {
      "@type": "Organization",
      name: "TaxFiling24",
      url: BASE_URL,
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
  };
}

export function articleSchema(article: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  author: string;
  tags?: string[];
}) {
  const normalizedAuthor = article.author?.trim();
  const isGenericAdmin =
    !normalizedAuthor || normalizedAuthor.toLowerCase() === "admin";
  const resolvedImage = article.image ? absoluteUrl(article.image) : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: article.url,
    ...(resolvedImage ? { image: resolvedImage } : {}),
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: isGenericAdmin
      ? {
          "@type": "Organization",
          name: "TaxFiling24 Editorial Team",
          url: BASE_URL,
        }
      : {
          "@type": "Person",
          name: normalizedAuthor,
        },
    publisher: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: "TaxFiling24",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    ...(article.tags && article.tags.length > 0
      ? { keywords: article.tags.join(", ") }
      : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.url,
    },
  };
}

export function webPageSchema(page: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.name,
    description: page.description,
    url: page.url,
    isPartOf: {
      "@type": "WebSite",
      name: "TaxFiling24",
      url: BASE_URL,
    },
  };
}

export function softwareApplicationSchema(app: {
  description: string;
  name: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    applicationCategory: "FinanceApplication",
    description: app.description,
    name: app.name,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    operatingSystem: "Web",
    url: app.url,
  };
}
