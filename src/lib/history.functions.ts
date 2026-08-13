import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Carousel, Variant } from "@/lib/campaign.functions";

const saveSchema = z.object({
  brandName: z.string().min(1).max(120),
  product: z.string().min(1).max(2000),
  voice: z.string().max(600).default(""),
  personas: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  channels: z.array(z.string()).default([]),
  variationTypes: z.array(z.string()).default([]),
  count: z.number().int().min(1).max(7),
  variants: z.array(z.record(z.string(), z.unknown())).default([]),
  carousels: z.array(z.record(z.string(), z.unknown())).default([]),
});

export type CampaignRecord = {
  id: string;
  brand_name: string;
  product: string;
  voice: string;
  personas: string[];
  objectives: string[];
  channels: string[];
  variation_types: string[];
  variant_count: number;
  variants: Variant[];
  carousels: Carousel[];
  created_at: string;
};

export type BrandRecord = {
  id: string;
  name: string;
  product: string;
  voice: string;
  updated_at: string;
};

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => saveSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: brand } = await supabase
      .from("brands")
      .upsert(
        {
          user_id: userId,
          name: data.brandName,
          product: data.product,
          voice: data.voice,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,name" },
      )
      .select("id")
      .single();

    const { data: row, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: userId,
        brand_id: brand?.id ?? null,
        brand_name: data.brandName,
        product: data.product,
        voice: data.voice,
        personas: data.personas,
        objectives: data.objectives,
        channels: data.channels,
        variation_types: data.variationTypes,
        variant_count: data.count,
        variants: data.variants as unknown as never,
        carousels: data.carousels as unknown as never,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ campaigns: CampaignRecord[] }> => {
    const { data, error } = await context.supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return { campaigns: (data ?? []) as unknown as CampaignRecord[] };
  });

export const listBrands = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ brands: BrandRecord[] }> => {
    const { data, error } = await context.supabase
      .from("brands")
      .select("id, name, product, voice, updated_at")
      .order("updated_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return { brands: (data ?? []) as BrandRecord[] };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("campaigns").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
