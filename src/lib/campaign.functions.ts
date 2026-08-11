import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  brandName: z.string().min(1).max(120),
  product: z.string().min(1).max(2000),
  voice: z.string().max(600).default(""),
  personas: z.array(z.string().min(1).max(200)).min(1).max(5),
  objectives: z.array(z.string().min(1).max(200)).min(1).max(5),
  channels: z.array(z.string().min(1).max(60)).min(1).max(5),
  count: z.number().int().min(1).max(6),
});

export type Variant = {
  id: string;
  angle: string;
  persona: string;
  objective: string;
  channel: string;
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  tagline: string;
  keyMessage: string;
  visualDirection: string;
  imagePrompt: string;
  hashtags: string[];
  relevance: number;
  engagement: number;
};

export const generateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<{ variants: Variant[] }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured yet.");

    const combos = data.personas.length * data.objectives.length * data.channels.length;
    const total = Math.min(24, data.count * combos);

    const prompt = `You are Adgenix, a brand-aware marketing copy engine.

BRAND DNA
- Brand: ${data.brandName}
- Product / brief: ${data.product}
- Tone of voice: ${data.voice || "confident, clear, human"}

TARGETING MATRIX
- Personas: ${data.personas.join(", ")}
- Objectives: ${data.objectives.join(", ")}
- Channels: ${data.channels.join(", ")}

Produce exactly ${total} campaign variants: ${data.count} variant(s) for EVERY combination of
persona x objective x channel listed above. Each variant must state which persona, objective and
channel it targets, and use a distinct creative angle (emotional, value-driven, curiosity/FOMO,
social proof, urgency...).

For each variant deliver a complete, production-ready creative package:
- headline: the hook, respecting channel length conventions
- subheadline: one supporting line that adds specificity
- body: the main copy, formatted naturally for the channel
- cta: a short button/action phrase
- tagline: a memorable brand line
- keyMessage: one sentence describing the core promise of this variant
- visualDirection: art direction for the accompanying visual (subject, composition, colour, mood)
- imagePrompt: a single-sentence prompt a designer or image model could use directly
- hashtags: 3-5 relevant hashtags (empty array for channels where hashtags do not apply)
Score each variant honestly from 60-98 for persona relevance and predicted engagement.
No stereotypes, no copyrighted slogans.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_variants",
              description: "Return the generated campaign variants",
              parameters: {
                type: "object",
                properties: {
                  variants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        angle: { type: "string" },
                        persona: { type: "string" },
                        objective: { type: "string" },
                        channel: { type: "string" },
                        headline: { type: "string" },
                        subheadline: { type: "string" },
                        body: { type: "string" },
                        cta: { type: "string" },
                        tagline: { type: "string" },
                        keyMessage: { type: "string" },
                        visualDirection: { type: "string" },
                        imagePrompt: { type: "string" },
                        hashtags: { type: "array", items: { type: "string" } },
                        relevance: { type: "number" },
                        engagement: { type: "number" },
                      },
                      required: [
                        "angle",
                        "persona",
                        "objective",
                        "channel",
                        "headline",
                        "subheadline",
                        "body",
                        "cta",
                        "tagline",
                        "keyMessage",
                        "visualDirection",
                        "imagePrompt",
                        "hashtags",
                        "relevance",
                        "engagement",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["variants"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "emit_variants" } },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    if (!res.ok) throw new Error(`Generation failed (${res.status})`);

    const json = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("The model returned no variants.");

    const parsed = JSON.parse(args) as { variants: Omit<Variant, "id">[] };
    return {
      variants: parsed.variants.slice(0, total).map((v, i) => ({
        ...v,
        hashtags: Array.isArray(v.hashtags) ? v.hashtags : [],
        relevance: Math.round(v.relevance),
        engagement: Math.round(v.engagement),
        id: `v${i + 1}`,
      })),
    };
  });
