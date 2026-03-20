import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { message, history = [] } = await request.json();
    const setting = await prisma.setting.findUnique({ where: { key: "GEMINI_API_KEY" } });
    const apiKey = setting?.value || process.env.GEMINI_API_KEY;

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
  - **Phone/WhatsApp**: +91 7011246157
  - **Email**: support@taxfiling24.com
- **Conciseness**: Keep responses moderately detailed but easy to read in a small chat box. Ideal length is roughly 250-400 words.
- **Formatting**: Use bold headings, clear bullet lists, or numbered lists in markdown with spacing in response structure where logical. Do not hesitate to emphasize with **bolding** to guide important labels. Do not hallucinate URLs other than contact emails.`;





    // Map history to Gemini format
    const contents = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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


    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return NextResponse.json({ error: data.error?.message || "Gemini API error" }, { status: response.status });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
