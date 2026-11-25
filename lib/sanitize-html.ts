import DOMPurify from "isomorphic-dompurify";

const ALLOWED_IFRAME_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "maps.google.com",
  "www.google.com",
]);

let hooksRegistered = false;

function ensureSanitizerHooks() {
  if (hooksRegistered) return;
  hooksRegistered = true;

  // Restrict iframe embedding to verified HTTPS video/map origins with strict sandboxing
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName === "iframe" && "getAttribute" in node) {
      const el = node as Element;
      const src = (el.getAttribute("src") || "").trim();
      try {
        const url = new URL(src);
        const host = url.hostname.toLowerCase();
        const isAllowedProtocol = url.protocol === "https:";
        const isAllowedHost = ALLOWED_IFRAME_HOSTS.has(host);
        const isAllowedGooglePath =
          host !== "www.google.com" || url.pathname.startsWith("/maps/embed");

        if (!isAllowedProtocol || !isAllowedHost || !isAllowedGooglePath) {
          el.remove();
          return;
        }

        el.removeAttribute("allow");
        el.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation");
        el.setAttribute("referrerpolicy", "no-referrer");
      } catch {
        el.remove();
      }
    }
  });

  // Prevent reverse-tabnabbing on links opening in new tabs
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if ("tagName" in node && (node as Element).tagName === "A") {
      const el = node as Element;
      if (el.getAttribute("target") === "_blank") {
        el.setAttribute("rel", "noopener noreferrer");
      }
    }
  });
}

export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  ensureSanitizerHooks();

  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "target",
      "rel",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "sandbox",
      "referrerpolicy",
      "data-type",
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/(?!\/)|#)/i,
  });
}
