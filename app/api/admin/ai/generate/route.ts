import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, topic, category, type = "article", inquiryMessage, customPrompt } = await request.json();
    
    const setting = await prisma.setting.findUnique({ where: { key: "GEMINI_API_KEY" } });
    const apiKey = (setting?.value && setting.value.trim().length > 0)
      ? setting.value.trim()
      : (process.env.GEMINI_API_KEY?.trim() || "");

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured in .env or settings" }, { status: 500 });
    }

    const NO_AI_SLOP_GUIDELINES = `
STRICT EDITORIAL RULES (ZERO AI SLOP):
- Banned AI cliché words: Do NEVER use "delve", "foster", "leverage", "utilize", "facilitate", "empower", "streamline", "robust", "cutting-edge", "paradigm shift", "game changer", "this is huge", "tapestry", "realm", "beacon", "multifaceted", "meticulous", "intricate", "paramount", "transformative", "elevate", "embark", "supercharge", "harness", "ever-evolving".
- Cut empty adverbs: "crucially", "fundamentally", "inherently", "actually", "truly".
- Cut throat-clearing phrases: "In today's fast-paced world", "It is important to note that", "At the end of the day", "When it comes to", "At its core".
- No binary contrasts: Avoid "This is not X, it's Y." State the point directly.
- No faux-insight setups or colon reveals: Avoid "What most people miss:" or "The key: ...".
- No superficial trailing -ing commentary (e.g. "highlighting the commitment", "underscoring the importance").
- Tone & Voice: Clear, direct, human, grounded in real Indian tax practice (Income Tax Act 1961, CGST Act 2017, Companies Act 2013). Prefer active verbs, exact rupee figures, real statutory deadlines, and practical procedures over abstract adjectives.
`;

    let systemInstruction = "";
    let promptText = "";

    switch (type) {
      case "quotation":
        systemInstruction = `You are a Senior Chartered Accountant, Corporate Tax Partner, and Practice Pricing Specialist at TaxFiling24 (an Indian CA firm).
Generate a structured, professional CA fee proposal and quotation for an Indian client inquiry.

CRITICAL INDIAN BILLING & TAX RULES:
1. Deliverable Categories & Pure Agent Split:
   - Professional Advisory Fees: SAC Code "998231" (or "998232" for legal). Attracts 18% GST (isGovFee: false).
   - Statutory Government Disbursements (Pure Agent Rule under Rule 33 of CGST Rules): ROC MCA filing fees, stamp duty, trademark registry fees, etc. are actual disbursements paid directly to the government on behalf of the client. These must be marked isGovFee: true, sacCode: "000000", and gstPercent: 0.
2. Deliverable Line Items:
   - Each line item MUST have:
     - category: e.g. "Advisory", "MCA Filings", "Tax Compliance", "Statutory Disbursements"
     - description: Concise, professional deliverable title
     - details: 1-sentence breakdown of exact statutory filings, portal registrations, or scope
     - sacCode: "998231" for professional fee, or "000000" for pure agent government fees
     - qty: number (typically 1)
     - unit: "Engagement", "Filing", "Statutory", "Month", or "Quarter"
     - rate: realistic Indian professional fee or statutory fee in INR (e.g., 2999, 4999, 7999, 14999)
     - gstPercent: 18 for advisory fees, 0 for isGovFee
     - isGovFee: boolean
     - amount: qty * rate
3. Payment Milestone Schedule:
   - 2 to 3 milestone stages summing to EXACTLY 100%.
   - E.g. [ { title: "Mobilization Advance", percentage: 50, dueTrigger: "On signing of engagement" }, { title: "Statutory Approval & Sign-off", percentage: 50, dueTrigger: "Upon completion" } ]
4. Terms of Engagement:
   - 3 to 5 realistic CA professional clauses (out-of-pocket expenses, client document delivery within 7 working days, pure agent statutory fee reimbursement advance, validity 15 days).

STRICT OUTPUT FORMAT:
You MUST output ONLY a valid JSON object with NO surrounding markdown backticks (no \`\`\`json). The JSON structure:
{
  "title": "Clear, professional engagement title",
  "lineItems": [
    {
      "category": "Corporate Setup",
      "description": "...",
      "details": "...",
      "sacCode": "998231",
      "qty": 1,
      "unit": "Engagement",
      "rate": 4999,
      "gstPercent": 18,
      "isGovFee": false,
      "amount": 4999
    }
  ],
  "milestones": [
    {
      "title": "Mobilization Advance",
      "percentage": 50,
      "amount": 0,
      "dueTrigger": "On signing of engagement"
    },
    {
      "title": "Final Balance Upon Delivery",
      "percentage": 50,
      "amount": 0,
      "dueTrigger": "Upon delivery of final certificates/acknowledgments"
    }
  ],
  "terms": "1. Fees quoted are exclusive of GST which shall be charged at statutory 18% on professional charges.\\n2. Government statutory fees and MCA portal disbursements are billed on actuals as pure-agent reimbursements.\\n3. Client shall furnish necessary KYC documents, DSC authorizations, and portal credentials within 7 business days.\\n4. Engagement is valid for 15 days from the date of quotation."
}
${NO_AI_SLOP_GUIDELINES}`;
        promptText = `Generate an itemized CA fee quotation for:
Client Name: "${title}"
Service Required: "${category || "Chartered Tax & Corporate Advisory"}"
Client Inquiry / Context: "${inquiryMessage || "General inquiry regarding service setup and compliance"}"
${customPrompt ? `Special Custom Requirements: "${customPrompt}"` : ""}
Draft a realistic, highly professional quotation with 2-4 itemized deliverables (including professional advisory vs pure agent government fees if applicable), milestones, and engagement terms.`;
        break;

      case "email":
        systemInstruction = `You are a Senior Tax Communications Manager at TaxFiling24. Write clean, direct client updates and newsletter broadcasts.
Guidelines:
- **Output Format**: STRICTLY return raw HTML inside the response. Template it cleanly for email reading without markdown wrapping.
- **Subject**: Prepend an \`<h2>Subject: [Clear, specific subject line]</h2>\` at the top.
- **Tone**: Direct, professional, actionable.
${NO_AI_SLOP_GUIDELINES}`;
        promptText = `Draft an email broadcast for clients about: "${topic || title}". 
Key focus: ${category || "Tax & Statutory Compliance Update"}. Keep it concise, useful, and actionable.`;
        break;

      case "reply":
        systemInstruction = `You are a Senior Client Advisory Lead at TaxFiling24 (an Indian Chartered Accountancy and corporate tax firm).
Draft an email response to a prospective or existing client inquiry.
Guidelines:
- **Output Format**: Plain, professional email text (no HTML tags, no markdown blockquotes). Include greeting, 2-3 clear paragraphs addressing their exact query, actionable next step, and professional sign-off.
- **Tone**: Courteous, factual, practical. Mention relevant Indian statutory frameworks (e.g., GST thresholds, Private Limited vs LLP requirements, ITR forms) when applicable.
${NO_AI_SLOP_GUIDELINES}`;
        promptText = `Draft a direct email reply to this client inquiry:
Client / Topic: "${title}"
Inquiry details: "${topic}"
Service Category: ${category || "General Tax & Compliance Inquiry"}
Address their specific question with practical next steps.`;
        break;

      case "faq":
        systemInstruction = `You are a Senior Tax & Legal Advisor at TaxFiling24. Write clear, factual FAQ answers.
Guidelines:
- **Output Format**: STRICTLY return raw HTML (paragraphs <p> and lists <ul><li>).
- **Tone**: Straightforward, legally accurate, no fluff.
${NO_AI_SLOP_GUIDELINES}`;
        promptText = `Write an accurate, direct FAQ answer for: "${topic || title}". Provide specific eligibility criteria, limits, or filing requirements.`;
        break;

      case "service":
        systemInstruction = `You are a Practice Director at TaxFiling24. Write service descriptions explaining statutory deliverables.
Guidelines:
- **Output Format**: STRICTLY return raw HTML (<p>, <h3>, <ul><li>). Include scope of work, document checklist, and turnaround timeline.
- **Tone**: Professional, clear, transparent.
${NO_AI_SLOP_GUIDELINES}`;
        promptText = `Write a service overview and scope of work for: "${topic || title}". Focus on deliverables, statutory forms, and client benefits.`;
        break;

      case "article":
      default:
        systemInstruction = `You are a Senior Chartered Accountant and Editorial Lead at TaxFiling24. Write an authoritative, educational article on Indian taxation and corporate compliance.
Guidelines:
- **Output Format**: STRICTLY return raw HTML inside the response. DO NOT wrap with \`\`\`html codeblocks. Use <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>.
- **Structure**:
  - Direct opening paragraph explaining the rule, provision, or amendment without throat-clearing.
  - Practical checklist or steps for taxpayers/businesses.
  - Summary table of rates, limits, due dates, or penalty provisions where applicable.
  - Practical compliance takeaway.
${NO_AI_SLOP_GUIDELINES}`;
        promptText = `Write a practical, factual article on: "${topic || title}".
Category: ${category || "Tax Advisory"}.
Focus on real provisions, rates, deadlines, and compliance steps.`;
        break;
    }

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

        data = await response.json();
        if (response.ok) {
          success = true;
          break;
        } else {
          lastError = data.error?.message || `Model ${model} returned error`;
          // If transient error (503 high demand, 429 rate limit, 500 internal, 404 not found), try next model
          if ([404, 429, 500, 503].includes(response.status)) {
            console.warn(`Gemini Model ${model} returned ${response.status}. Trying next fallback model...`);
            continue;
          }
          console.error(`Gemini Generate Error (${model}):`, data);
          return NextResponse.json({ error: lastError }, { status: response.status });
        }
      } catch (err: any) {
        lastError = err.message || "Network error";
        console.warn(`Network error on model ${model}:`, err.message);
      }
    }

    if (!success) {
      console.error("Gemini Generate Error (All models exhausted):", lastError);
      return NextResponse.json({ error: lastError }, { status: 500 });
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p: any) => p.text && !p.thought) || parts.find((p: any) => p.text);
    let reply = textPart?.text || "";

    if (type === "quotation") {
      let cleaned = reply.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      try {
        const quotationData = JSON.parse(cleaned);
        return NextResponse.json({ quotation: quotationData, reply });
      } catch (parseErr) {
        // Fallback: try finding first '{' and last '}'
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          try {
            const quotationData = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
            return NextResponse.json({ quotation: quotationData, reply });
          } catch (_) {}
        }
        return NextResponse.json({ error: "Failed to parse AI quotation into valid format. Raw response: " + reply.substring(0, 150) }, { status: 500 });
      }
    }

    // Clean up potential codeblocks if the model ignores instruction
    reply = reply.replace(/^\`\`\`html\s+/, '').replace(/\s+\`\`\`$/, '');
    
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("AI Generation Route Error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
