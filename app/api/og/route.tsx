import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { SITE_DOMAIN } from "@/lib/seo";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function sanitizeOgParam(raw: string | null, fallback: string, maxLen: number): string {
  if (!raw) return fallback;
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLen);
}

export async function GET(request: NextRequest) {
  try {
    const rate = checkRateLimit("public-og", getClientIp(request), {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!rate.allowed) {
      return new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      });
    }

    const { searchParams } = new URL(request.url);

    // Strictly bounded dynamic parameters to prevent Satori CPU/memory exhaustion
    const title = sanitizeOgParam(searchParams.get("title"), "Complete Business & Tax Solutions", 120);
    const description = sanitizeOgParam(
      searchParams.get("description"),
      "TaxFiling24 - Your Trusted Partner for GST, Income Tax, and Business Compliance.",
      180
    );
    const category = sanitizeOgParam(searchParams.get("category"), "Advisory", 40);

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            backgroundColor: "#0A2540",
            backgroundImage: "radial-gradient(circle at 100% 0%, #1a365d 0%, #0A2540 70%)",
            padding: "80px",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          {/* Top Row: Brand & Category */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* Logo Text */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: "36px",
                  fontWeight: "bold",
                  letterSpacing: "-0.02em",
                }}
              >
                TaxFiling
              </span>
              <span
                style={{
                  color: "#D4AF37",
                  fontSize: "36px",
                  fontWeight: "bold",
                  letterSpacing: "-0.02em",
                }}
              >
                24
              </span>
            </div>

            {/* Category tag */}
            <div
              style={{
                display: "flex",
                backgroundColor: "rgba(212, 175, 55, 0.15)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                borderRadius: "30px",
                padding: "8px 20px",
              }}
            >
              <span
                style={{
                  color: "#D4AF37",
                  fontSize: "16px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {category}
              </span>
            </div>
          </div>

          {/* Middle: Large Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "40px",
              marginBottom: "40px",
              maxWidth: "1000px",
            }}
          >
            <span
              style={{
                color: "#FFFFFF",
                fontSize: "64px",
                fontWeight: "extrabold",
                lineHeight: "1.2",
                letterSpacing: "-0.03em",
                marginBottom: "20px",
              }}
            >
              {title}
            </span>
            <span
              style={{
                color: "#94A3B8",
                fontSize: "24px",
                lineHeight: "1.5",
                maxHeight: "80px",
                overflow: "hidden",
              }}
            >
              {description}
            </span>
          </div>

          {/* Bottom: URL and Trust Elements */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "30px",
            }}
          >
            <span
              style={{
                color: "#94A3B8",
                fontSize: "20px",
                fontWeight: "bold",
                letterSpacing: "0.05em",
              }}
            >
              {SITE_DOMAIN}
            </span>
            <span
              style={{
                color: "rgba(255, 255, 255, 0.4)",
                fontSize: "18px",
              }}
            >
              Business, Tax & Compliance Solutions
            </span>
          </div>

          {/* Dynamic Gold Accent Line */}
          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "0",
              right: "0",
              height: "8px",
              backgroundColor: "#D4AF37",
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error: any) {
    console.error("OG generation error:", error);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
