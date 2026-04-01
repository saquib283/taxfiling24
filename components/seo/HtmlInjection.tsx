import { createElement, type JSX } from "react";

type HtmlInjectionProps = {
  html?: string | null;
};

const SUPPORTED_TAG_PATTERN =
  /<(script|style|noscript)\b([^>]*)>([\s\S]*?)<\/\1>|<(meta|link|base)\b([^>]*)\/?>/gi;

const BOOLEAN_ATTRIBUTES = new Set([
  "async",
  "defer",
  "disabled",
  "nomodule",
]);

function normalizeAttributeName(name: string) {
  switch (name.toLowerCase()) {
    case "class":
      return "className";
    case "crossorigin":
      return "crossOrigin";
    case "fetchpriority":
      return "fetchPriority";
    case "http-equiv":
      return "httpEquiv";
    case "referrerpolicy":
      return "referrerPolicy";
    default:
      return name;
  }
}

function parseAttributes(rawAttributes: string) {
  const attributes: Record<string, string | boolean> = {};
  const attributePattern = /([:@A-Za-z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match = attributePattern.exec(rawAttributes);

  while (match) {
    const [, rawName, doubleQuoted, singleQuoted, unquoted] = match;
    const normalizedName = normalizeAttributeName(rawName);
    const value = doubleQuoted ?? singleQuoted ?? unquoted;

    attributes[normalizedName] =
      value !== undefined ? value : BOOLEAN_ATTRIBUTES.has(rawName.toLowerCase()) ? true : "";

    match = attributePattern.exec(rawAttributes);
  }

  return attributes;
}

export default function HtmlInjection({ html }: HtmlInjectionProps) {
  if (!html?.trim()) {
    return null;
  }

  const elements: JSX.Element[] = [];
  const tagPattern = new RegExp(SUPPORTED_TAG_PATTERN.source, SUPPORTED_TAG_PATTERN.flags);
  let match = tagPattern.exec(html);

  while (match) {
    const blockTag = match[1];
    const blockAttributes = match[2];
    const blockContent = match[3];
    const selfClosingTag = match[4];
    const selfClosingAttributes = match[5];
    const tag = blockTag || selfClosingTag;
    const rawAttributes = blockAttributes || selfClosingAttributes || "";

    if (!tag) {
      match = tagPattern.exec(html);
      continue;
    }

    const props = {
      key: `${tag}-${elements.length}`,
      ...parseAttributes(rawAttributes),
    };

    if (tag === "script" || tag === "style" || tag === "noscript") {
      elements.push(
        createElement(tag, {
          ...props,
          dangerouslySetInnerHTML: { __html: blockContent || "" },
        })
      );
    } else {
      elements.push(createElement(tag, props));
    }

    match = tagPattern.exec(html);
  }

  return <>{elements}</>;
}
