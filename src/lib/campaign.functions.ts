import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  brandName: z.string().min(1).max(120),
  product: z.string().min(1).max(2000),
  voice: z.string().max(600).default(""),
  persona: z.string().min(1).max(200),
  objective: z.string().min(1).max(200),
  channel: z.string().min(1).max(60),
  count: z.number().int().min(1).max(6),
});

export type Variant = {
  id: string;
  headline: string;
  body: string;
  cta: string;
  tagline: string;
  relevance: number;
  engagement: number;
  angle: string;
};

export const generateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<{ variants: Variant[] }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured yet.");

    const prompt = `You are Adgenix, a brand-aware marketing copy engine.

BRAND DNA
- Brand: ${data.brandName}
- Product / brief: ${data.product}
- Tone of voice: ${data.voice || "confident, clear, human"}

TARGETING
- Customer persona: ${data.persona}
- Campaign objective: ${data.objective}
- Channel: ${data.channel}

Produce exactly ${data.count} distinct A/B campaign variants for that channel, each using a different creative angle
(e.g. emotional, value-driven, curiosity/FOMO). Respect channel conventions and length.
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
                        headline: { type: "string" },
                        body: { type: "string" },
                        cta: { type: "string" },
                        tagline: { type: "string" },
                        relevance: { type: "number" },
                        engagement: { type: "number" },
                      },
                      required: [
                        "angle",
                        "headline",
                        "body",
                        "cta",
                        "tagline",
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
      variants: parsed.variants.slice(0, data.count).map((v, i) => ({
        ...v,
        relevance: Math.round(v.relevance),
        engagement: Math.round(v.engagement),
        id: `v${i + 1}`,
      })),
    };
  });
