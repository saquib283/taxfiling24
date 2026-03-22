import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { title, content } = await request.json();
    
    const setting = await prisma.setting.findUnique({ where: { key: "GEMINI_API_KEY" } });
    const apiKey = setting?.value || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'KWEFK') {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const systemInstruction = `You are an SEO Specialist for TaxFiling24. 
Generate a Meta Title and Meta Description for the provided article to boost CTR and organic indexing.

Guidelines:
- **Output Format**: Strictly return JSON. No markdown code blocks.
- **Lengths Requirements**: 
  - metaTitle: 50-60 characters max.
  - metaDescription: 140-160 characters max.
  
Expected JSON:
{
  "metaTitle": "...',
  "metaDescription": "..."
}`;

    const promptText = `Generate SEO tags for this document:
Title: ${title}
Content snippet: ${content ? content.replace(/<[^>]*>/g, "").substring(0, 2000) : "No content available yet."}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1000,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "Gemini API error" }, { status: response.status });
    }

    let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    try {
      // Robustly extract the JSON block using Regex
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reply = jsonMatch[0];
      }
      
      const parsed = JSON.parse(reply);
      return NextResponse.json(parsed);
    } catch (e) {
      console.error("Failed to parse AI response:", reply);
      return NextResponse.json({ error: "Failed to parse AI response into JSON" }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
