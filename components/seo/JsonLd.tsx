interface JsonLdProps {
  data: Record<string, any> | Record<string, any>[];
}

export default function JsonLd({ data }: JsonLdProps) {
  const jsonLd = Array.isArray(data) ? data : [data];
  return (
    <>
      {jsonLd.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}

// ─── Schema Generators ───────────────────────────────────────────────

const BASE_URL = "https://taxfiling24.com";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TaxFiling24",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      "Your Trusted Partner for Business Registration, Taxation, Compliance & Financial Advisory across India.",
    foundingDate: "2020",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-7011246157",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "E-244/G First Floor Shaheen Bagh, Okhla",
      addressLocality: "New Delhi",
      addressRegion: "Delhi",
      postalCode: "110025",
      addressCountry: "IN",
    },
    sameAs: [
      "https://wa.me/917011246157",
    ],
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TaxFiling24",
    url: BASE_URL,
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

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "TaxFiling24",
    url: BASE_URL,
    image: `${BASE_URL}/logo.png`,
    telephone: "+91-7011246157",
    email: "support@taxfiling24.com",
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: "E-244/G First Floor Shaheen Bagh, Okhla",
      addressLocality: "New Delhi",
      addressRegion: "Delhi",
      postalCode: "110025",
      addressCountry: "IN",
    },
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
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: article.url,
    ...(article.image ? { image: article.image } : {}),
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
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
