import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, content } = await request.json();
    
    const setting = await prisma.setting.findUnique({ where: { key: "GEMINI_API_KEY" } });
    const apiKey = (setting?.value && setting.value.trim().length > 0)
      ? setting.value.trim()
      : (process.env.GEMINI_API_KEY?.trim() || "");

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured in .env or settings" }, { status: 500 });
    }

    const systemInstruction = `You are an SEO Specialist for TaxFiling24 (an Indian tax advisory and compliance firm). 
Generate a Meta Title and Meta Description for the provided article to boost CTR and organic search ranking.

Guidelines:
- **Output Format**: Strictly return JSON. No markdown code blocks.
- **Editorial Standard (Zero AI Slop)**: 
  - Never use AI clichés: "Unlock", "Delve", "Demystifying", "Comprehensive guide to", "Supercharge", "Everything you need to know".
  - Write concise, factual, search-friendly copy stating exact topics, sections, rates, or filing years.
- **Lengths Requirements**: 
  - metaTitle: 50-60 characters max.
  - metaDescription: 140-160 characters max.
  
Expected JSON:
{
  "metaTitle": "...",
  "metaDescription": "..."
}`;

    const promptText = `Generate SEO tags for this document:
Title: ${title}
Content snippet: ${content ? content.replace(/<[^>]*>/g, "").substring(0, 2000) : "No content available yet."}`;

    const modelsToTry = [
      "gemini-3.1-flash-lite",
      "gemini-3-flash-preview",
      "gemini-flash-latest",
      "gemini-3.5-flash",
      "gemini-2.5-flash",
    ];
    let data: any = null;
    let lastError = "Unable to reach Gemini AI service";
    let success = false;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
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

        data = await response.json();
        if (response.ok) {
          success = true;
          break;
        } else {
          lastError = data.error?.message || `Model ${model} returned error`;
          if ([404, 429, 500, 503].includes(response.status)) {
            console.warn(`Gemini Model ${model} returned ${response.status}. Trying next fallback model...`);
            continue;
          }
          console.error(`Gemini SEO Error (${model}):`, data);
          return NextResponse.json({ error: lastError }, { status: response.status });
        }
      } catch (err: any) {
        lastError = err.message || "Network error";
        console.warn(`Network error on model ${model}:`, err.message);
      }
    }

    if (!success) {
      console.error("Gemini SEO Error (All models exhausted):", lastError);
      return NextResponse.json({ error: lastError }, { status: 500 });
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p: any) => p.text && !p.thought) || parts.find((p: any) => p.text);
    let reply = textPart?.text || "{}";
    
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
