import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { title, topic, category, type = "article" } = await request.json();
    
    const setting = await prisma.setting.findUnique({ where: { key: "GEMINI_API_KEY" } });
    const apiKey = setting?.value || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    let systemInstruction = "";
    let promptText = "";

    switch (type) {
      case "email":
        systemInstruction = `You are a Marketing Copywriter for TaxFiling24. Write high-converting newsletter/marketing emails.
Guidelines:
- **Output Format**: STRICTLY return raw HTML inside the response. Template it ready for visual reading.
- **Subject**: Prepend an \`<h2>Subject: [Catchy Line]</h2>\` at the top.
- **Tone**: Warm, authoritative, triggering actionable responses (CTA).`;
        promptText = `Draft a newsletter/email marketing body about topic: "${topic || title}". 
Key focus: ${category || "General Update"}. Optimize hook speed.`;
        break;

      case "reply":
        systemInstruction = `You are a Client Support Lead for TaxFiling24. Draft professional, polite responses to client consultations.
Guidelines:
- **Output Format**: STRICTLY return raw HTML. Keep structure simple with minimal header wrappers.
- **Tone**: Approachable, informative. Provide a general advisory statement for generic topics.`;
        promptText = `Draft an email reply responding to this inquiry/context: "${topic || title}".
Additional Context: ${category || "General inquiry response"}`;
        break;

      case "faq":
        systemInstruction = `You are a Compliance Advisor at TaxFiling24. Write clear, concise FAQ index answers for users.
Guidelines:
- **Output Format**: STRICTLY return raw HTML. Use simple lists \`<ul>\` and paragraph definitions flawlessly.`;
        promptText = `Write a comprehensive Answer addressing the FAQ Question: "${topic || title}"`;
        break;

      case "service":
        systemInstruction = `You are a Service Architect for TaxFiling24 description frames.
Guidelines:
- **Output Format**: STRICTLY return raw HTML. Include inclusions lists and rich brief summaries.`;
        promptText = `Write a professional Service Overview section about: "${topic || title}".`;
        break;

      case "article":
      default:
        systemInstruction = `You are an expert corporate content writer for TaxFiling24, a leading chartered accountancy and business compliance firm in India.
Your task is to write a highly professional, actionable, and informative article based on the provided topic.

Guidelines:
- **Output Format**: STRICTLY return raw HTML inside the response. DO NOT wrap with \`\`\`html codeblocks. Use <h2>, <h3>, <p>, <ul>, <ol>, <li>, blockquote, and <table>.
- **Tone**: Authoritative, transparent, professional.
- **Content Requirements**:
  - Introduce the core problem or rule change accurately based on Indian taxation.
  - Break down steps using ordered/unordered checklists.
  - Use a <blockquote> to quote an inner subject expert.
  - Always generate a <table> summarizing rates, schedules, or required papers where logical.
- **Length**: Roughly 500-750 words. Ensure correct tag closings to be safe with React render engines.`;
        promptText = `Write a comprehensive, professional article about: "${topic || title}".
Category: ${category || "General Update"}.
Focus on rendering a valuable reading experience structured with headers, lists, and rate tables.`;
        break;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 2500,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Generate Error:", data);
      return NextResponse.json({ error: data.error?.message || "Gemini API error" }, { status: response.status });
    }

    let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Clean up potential codeblocks if the model ignores instruction
    reply = reply.replace(/^\`\`\`html\s+/, '').replace(/\s+\`\`\`$/, '');
    
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("AI Generation Route Error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
