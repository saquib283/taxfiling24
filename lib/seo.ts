import type { Metadata } from "next";

type SiteSettings = Record<string, string>;

type MetadataType = "article" | "website";

type ArticleMetadata = {
  authors?: string[];
  modifiedTime?: string;
  publishedTime?: string;
  tags?: string[];
};

type BuildMetadataInput = {
  canonical?: string;
  description: string;
  image?: string | null;
  keywords?: string[];
  noIndex?: boolean;
  openGraphTitle?: string;
  path?: string;
  settings?: SiteSettings;
  title: string;
  type?: MetadataType;
} & ArticleMetadata;

type PageMetadataDefaults = {
  description: string;
  image?: string | null;
  keywords?: string[];
  path: string;
  title: string;
  type?: MetadataType;
} & ArticleMetadata;

const DEFAULT_SITE_NAME = "TaxFiling24";
const DEFAULT_DESCRIPTION =
  "Trusted business registration, tax filing, GST compliance, and financial advisory services across India.";
const DEFAULT_OG_IMAGE = "/logo.png";
const DEFAULT_KEYWORDS = [
  "tax filing",
  "GST registration",
  "company registration",
  "chartered accountant",
  "income tax return",
  "ITR filing",
  "business registration India",
  "LLP registration",
  "ROC compliance",
  "tax planning",
  "virtual CFO",
  "audit services",
  "trademark registration",
  "MSME registration",
  "financial advisory",
  "TaxFiling24",
];

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://taxfiling24.com";

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

export function parseKeywordList(value?: string | null) {
  if (!value) {
    return [];
  }

  return uniqueStrings(value.split(","));
}

export function absoluteUrl(pathOrUrl: string = "/") {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}

export function resolveSeoImage(image?: string | null, settings: SiteSettings = {}) {
  const fallback = settings.seo_default_og_image || DEFAULT_OG_IMAGE;
  return absoluteUrl(image || fallback);
}

export function getSiteName(settings: SiteSettings = {}) {
  return settings.seo_site_name?.trim() || DEFAULT_SITE_NAME;
}

export function mergeKeywords(settings: SiteSettings = {}, pageKeywords: string[] = []) {
  return uniqueStrings([
    ...DEFAULT_KEYWORDS,
    ...parseKeywordList(settings.seo_default_keywords),
    ...pageKeywords,
  ]);
}

export function buildMetadata({
  canonical,
  description,
  image,
  keywords = [],
  noIndex = false,
  openGraphTitle,
  path = "/",
  settings = {},
  title,
  type = "website",
  authors,
  modifiedTime,
  publishedTime,
  tags,
}: BuildMetadataInput): Metadata {
  const siteName = getSiteName(settings);
  const canonicalUrl = absoluteUrl(canonical || path);
  const imageUrl = resolveSeoImage(image, settings);
  const metadataKeywords = mergeKeywords(settings, keywords);

  return {
    title,
    description,
    keywords: metadataKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            "max-image-preview": "none",
            "max-snippet": 0,
            "max-video-preview": 0,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type,
      locale: "en_IN",
      siteName,
      title: openGraphTitle || `${title} | ${siteName}`,
      description,
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(type === "article"
        ? {
            authors,
            modifiedTime,
            publishedTime,
            tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    category: "finance",
  };
}

export function buildPageMetadataFromSettings(
  settings: SiteSettings,
  pageKey: string,
  defaults: PageMetadataDefaults
) {
  return buildMetadata({
    canonical: settings[`seo_${pageKey}_canonical`] || defaults.path,
    description: settings[`seo_${pageKey}_description`] || defaults.description,
    image: settings[`seo_${pageKey}_og_image`] || defaults.image,
    keywords: [
      ...(defaults.keywords || []),
      ...parseKeywordList(settings[`seo_${pageKey}_keywords`]),
    ],
    path: defaults.path,
    settings,
    title: settings[`seo_${pageKey}_title`] || defaults.title,
    type: defaults.type,
    authors: defaults.authors,
    modifiedTime: defaults.modifiedTime,
    publishedTime: defaults.publishedTime,
    tags: defaults.tags,
  });
}

export function buildNoIndexMetadata(title: string, settings: SiteSettings = {}) {
  return buildMetadata({
    description: `${title} area`,
    noIndex: true,
    path: "/",
    settings,
    title,
  });
}

export function getDefaultDescription(settings: SiteSettings = {}) {
  return settings.seo_default_description || DEFAULT_DESCRIPTION;
}
