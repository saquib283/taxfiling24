import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getSiteContact } from "@/lib/site-contact";

const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();

export async function POST(request: Request) {
  try {
    const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const clientIp = rawIp.slice(0, 45); // Sanitize IPv4/IPv6 length
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10; // 10 messages per minute

    const rateData = rateLimitMap.get(clientIp) || { count: 0, lastRequest: now };

    if (now - rateData.lastRequest > windowMs) {
      rateData.count = 1;
      rateData.lastRequest = now;
    } else {
      rateData.count = (rateData.count || 0) + 1;
    }

    rateLimitMap.set(clientIp, { count: rateData.count, lastRequest: now });

    if (rateData.count > maxRequests) {
      return NextResponse.json({ error: "Too many messages. Please wait a minute before trying again." }, { status: 429 });
    }

    const body = await request.json();
    const rawMessage = body?.message;
    const rawHistory = body?.history;

    if (typeof rawMessage !== "string" || !rawMessage.trim()) {
      return NextResponse.json({ error: "A non-empty message string is required." }, { status: 400 });
    }

    const cleanMessage = rawMessage.trim();
    if (cleanMessage.length > 1000) {
      return NextResponse.json({ error: "Message exceeds maximum allowed length of 1,000 characters." }, { status: 400 });
    }

    // Limit history to last 6 items and cap message length to 1000 chars per item
    const safeHistory = (Array.isArray(rawHistory) ? rawHistory : [])
      .slice(-6)
      .filter((msg: any) => msg && (msg.role === "user" || msg.role === "model") && typeof msg.text === "string")
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: String(msg.text).slice(0, 1000) }]
      }));
    const [setting, contactSettingRows] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "GEMINI_API_KEY" } }),
      prisma.setting.findMany({
        where: {
          key: {
            in: [
              "contact_phone",
              "SUPPORT_PHONE",
              "contact_email",
              "SUPPORT_EMAIL",
              "contact_address",
              "SUPPORT_ADDRESS",
              "contact_whatsapp",
              "SUPPORT_WHATSAPP",
            ],
          },
        },
      }),
    ]);
    const apiKey = (setting?.value && setting.value.trim().length > 0)
      ? setting.value.trim()
      : (process.env.GEMINI_API_KEY?.trim() || "");
    const contactSettings = contactSettingRows.reduce<Record<string, string>>((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    const { phone, email } = getSiteContact(contactSettings);

    if (!apiKey || apiKey === 'KWEFK') {
      return NextResponse.json({ error: "API Key not configured or placeholder" }, { status: 500 });
    }

    const systemInstruction = `You are the AI Assistant for TaxFiling24, a professional chartered accountant and business compliance firm in India.

Key Services Offered by TaxFiling24:
1. Business Setup & Registration (Company, LLP, Partnership)
2. Licenses, IP & Legal Registrations (Trademarks, GST Registration)
3. Taxation, GST & Compliance Management (ITR, Audits)
4. Corporate & ROC Filings (Annual filings)
5. Accounting & Financial Management
6. Audit, Forensic & Risk Investigation

Guidelines:
- **Tone**: Always polite, helpful, and professional.
- **Accuracy**: Provide general informational guidance regarding tax/registrations in India.
- **Disclaimers**: State that you provide general guidelines, not final legal/financial advice.
- **Call to Action**: For complex queries, custom pricing, or to book a service, direct them to contact support:
  - **Phone/WhatsApp**: ${phone}
  - **Email**: ${email}
- **Conciseness**: Keep responses moderately detailed but easy to read in a small chat box. Ideal length is roughly 250-400 words.
- **Formatting**: Use bold headings, clear bullet lists, or numbered lists in markdown with spacing in response structure where logical. Do not hesitate to emphasize with **bolding** to guide important labels. Do not hallucinate URLs other than contact emails.`;





    // Append validated history and current user message
    const contents = [...safeHistory];
    contents.push({
      role: "user",
      parts: [{ text: cleanMessage }]
    });

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
    let data: any = null;
    let lastError = "Unable to reach Gemini AI service";
    let success = false;

    for (const model of modelsToTry) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        })
      });

      data = await response.json();
      if (response.ok) {
        success = true;
        break;
      } else {
        lastError = data.error?.message || `Model ${model} returned error`;
        if (response.status !== 404) {
          console.error(`Gemini Chat Error (${model}):`, data);
          return NextResponse.json({ error: lastError }, { status: response.status });
        }
      }
    }

    if (!success) {
      console.error("Gemini Chat Error (All models exhausted):", lastError);
      return NextResponse.json({ error: lastError }, { status: 500 });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
