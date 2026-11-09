import DOMPurify from "isomorphic-dompurify";

const ALLOWED_IFRAME_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "maps.google.com",
  "www.google.com",
]);

// Restrict iframe embedding to verified, safe video and mapping hosts
DOMPurify.addHook("uponSanitizeElement", (node, data) => {
  if (data.tagName === "iframe" && "getAttribute" in node) {
    const el = node as Element;
    const src = el.getAttribute("src") || "";
    try {
      const url = new URL(src);
      if (!ALLOWED_IFRAME_HOSTS.has(url.hostname.toLowerCase())) {
        el.remove();
      }
    } catch {
      el.remove();
    }
  }
});

export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";
  
  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "target",
      "rel",
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "data-type",
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

