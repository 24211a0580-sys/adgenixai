import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { useAuth } from "@/hooks/useAuth";
import { generateCampaign, type Carousel, type Variant } from "@/lib/campaign.functions";
import {
  deleteCampaign,
  listBrands,
  listCampaigns,
  saveCampaign,
  type CampaignRecord,
} from "@/lib/history.functions";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Adgenix Studio — Generate persona-ready campaigns" },
      {
        name: "description",
        content:
          "Enter your Brand DNA, pick personas, objectives and channels, and generate full scored campaign packages plus Instagram carousel storyboards.",
      },
      { property: "og:title", content: "Adgenix Studio" },
      {
        property: "og:description",
        content: "Brand DNA in, complete scored campaign packages and carousels out.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});

const PERSONAS = [
  "Students",
  "Working professionals",
  "Premium customers",
  "Early adopters",
  "Small business owners",
];
const CHANNELS = [
  "Instagram caption",
  "Google Ad",
  "Email subject line",
  "LinkedIn post",
  "SMS blast",
];
const OBJECTIVES = ["Drive sign-ups", "Boost sales", "Grow awareness", "Re-engage churned users"];
const VARIATION_TYPES = [
  "Different Headlines",
  "Different Hooks",
  "Different CTAs",
  "Different Messaging Angles",
  "Different Visual Directions",
];
const CAROUSEL_STYLES = [
  "Problem → Solution",
  "Benefits → Features",
  "Storytelling",
  "Statistics / Data",
  "Customer Pain Point",
];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="ml-2 text-xs text-muted-foreground">{hint}</span> : null}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

function MultiChips({
  options,
  values,
  onChange,
  allowEmpty = false,
  check = false,
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  allowEmpty?: boolean;
  check?: boolean;
}) {
  const toggle = (o: string) => {
    if (values.includes(o)) {
      if (!allowEmpty && values.length === 1) return;
      onChange(values.filter((v) => v !== o));
    } else {
      onChange([...values, o]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = values.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              on
                ? "bg-ink text-primary-foreground"
                : "border border-border bg-card hover:bg-secondary"
            }`}
          >
            {check ? (on ? "☑ " : "☐ ") : on ? "✓ " : ""}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-semibold text-foreground">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{children}</span>
  );
}

function variantToText(v: Variant) {
  return [
    `${v.channel} · ${v.persona} · ${v.objective} · ${v.angle}`,
    "",
    v.headline,
    v.subheadline,
    "",
    v.body,
    "",
    `CTA: ${v.cta}`,
    `Tagline: ${v.tagline}`,
    `Key message: ${v.keyMessage}`,
    `Visual: ${v.visualDirection}`,
    v.hashtags.length ? v.hashtags.join(" ") : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function carouselToText(c: Carousel) {
  return [
    `${c.style} — ${c.title}`,
    "",
    ...c.slides.map(
      (s, i) => `Slide ${i + 1} — ${s.label}\n${s.headline}\n${s.body}\nVisual: ${s.visual}\n`,
    ),
    `Caption: ${c.caption}`,
    c.hashtags.join(" "),
  ]
    .filter(Boolean)
    .join("\n");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="self-start text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
    >
      {copied ? "Copied!" : "Copy full package"}
    </button>
  );
}

function VariantCard({
  variant,
  best,
  onEdit,
}: {
  variant: Variant;
  best: boolean;
  onEdit: (patch: Partial<Variant>) => void;
}) {
  return (
    <article
      className={`flex flex-col gap-3 rounded-3xl border bg-card p-5 ${
        best ? "border-primary ring-2 ring-primary/25" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Tag>{variant.channel}</Tag>
        <Tag>{variant.persona}</Tag>
        <Tag>{variant.objective}</Tag>
        {best ? (
          <span className="ml-auto rounded-full bg-sun px-3 py-1 text-xs font-semibold text-accent-foreground">
            Top pick
          </span>
        ) : null}
      </div>

      <span className="hand -rotate-2 text-lg">{variant.angle}</span>

      <div>
        <span className="text-[11px] tracking-wide text-muted-foreground uppercase">Headline</span>
        <textarea
          value={variant.headline}
          onChange={(e) => onEdit({ headline: e.target.value })}
          rows={2}
          className="autosize w-full resize-none rounded-xl bg-transparent px-1 font-display text-xl leading-snug font-semibold outline-none"
        />
        <textarea
          value={variant.subheadline}
          onChange={(e) => onEdit({ subheadline: e.target.value })}
          rows={2}
          className="autosize w-full resize-none rounded-xl bg-transparent px-1 text-sm text-muted-foreground outline-none"
        />
      </div>

      <div>
        <span className="text-[11px] tracking-wide text-muted-foreground uppercase">Content</span>
        <textarea
          value={variant.body}
          onChange={(e) => onEdit({ body: e.target.value })}
          rows={5}
          className="autosize mt-1 w-full resize-none rounded-xl bg-secondary/60 p-3 text-sm outline-none"
        />
      </div>

      <div>
        <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
          Call to action
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <input
            value={variant.cta}
            onChange={(e) => onEdit({ cta: e.target.value })}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground outline-none"
            size={Math.max(8, variant.cta.length)}
          />
          <p className="text-sm text-muted-foreground italic">“{variant.tagline}”</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-3">
        <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
          Visual direction
        </span>
        <p className="mt-1 text-sm">{variant.visualDirection}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Image prompt:</span> {variant.imagePrompt}
        </p>
      </div>

      <div className="text-sm">
        <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
          Key message
        </span>
        <p className="mt-1">{variant.keyMessage}</p>
      </div>

      {variant.hashtags.length ? (
        <p className="text-sm text-primary">{variant.hashtags.join(" ")}</p>
      ) : null}

      <CopyButton text={variantToText(variant)} />

      <div className="mt-auto flex gap-4 pt-2">
        <Score label="Relevance" value={variant.relevance} />
        <Score label="Engagement" value={variant.engagement} />
      </div>
    </article>
  );
}

function CarouselCard({ carousel, index }: { carousel: Carousel; index: number }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-primary-foreground">
          CAROUSEL {String(index + 1).padStart(2, "0")}
        </span>
        <Tag>{carousel.style}</Tag>
        {carousel.persona ? <Tag>{carousel.persona}</Tag> : null}
      </div>

      <h4 className="mt-3 font-display text-xl font-semibold">{carousel.title}</h4>

      <div className="-mx-1 mt-4 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {carousel.slides.map((s, i) => (
          <div
            key={i}
            className="flex min-h-56 w-56 shrink-0 snap-start flex-col gap-2 rounded-2xl bg-secondary/70 p-4"
          >
            <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
              Slide {i + 1} — {s.label}
            </span>
            <p className="font-display text-lg leading-snug font-semibold">{s.headline}</p>
            <p className="text-sm text-muted-foreground">{s.body}</p>
            <p className="mt-auto text-xs text-muted-foreground italic">🎨 {s.visual}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm">{carousel.caption}</p>
      {carousel.hashtags.length ? (
        <p className="mt-1 text-sm text-primary">{carousel.hashtags.join(" ")}</p>
      ) : null}

      <div className="mt-3">
        <CopyButton text={carouselToText(carousel)} />
      </div>

      <div className="mt-3 flex gap-4">
        <Score label="Relevance" value={carousel.relevance} />
        <Score label="Engagement" value={carousel.engagement} />
      </div>
    </article>
  );
}

function Studio() {
  const [brandName, setBrandName] = useState("Lumen Coffee Co.");
  const [product, setProduct] = useState(
    "A subscription for small-batch specialty coffee roasted to order and delivered every two weeks.",
  );
  const [voice, setVoice] = useState("Warm, witty, never corporate. Short sentences. No hype.");
  const [personas, setPersonas] = useState<string[]>([PERSONAS[1]!]);
  const [objectives, setObjectives] = useState<string[]>([OBJECTIVES[0]!]);
  const [channels, setChannels] = useState<string[]>([CHANNELS[0]!]);
  const [variationTypes, setVariationTypes] = useState<string[]>([
    VARIATION_TYPES[0]!,
    VARIATION_TYPES[1]!,
    VARIATION_TYPES[2]!,
    VARIATION_TYPES[3]!,
  ]);
  const [carouselStyles, setCarouselStyles] = useState<string[]>([
    CAROUSEL_STYLES[0]!,
    CAROUSEL_STYLES[1]!,
  ]);
  const [count, setCount] = useState(3);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  const generate = useServerFn(generateCampaign);
  const save = useServerFn(saveCampaign);
  const fetchCampaigns = useServerFn(listCampaigns);
  const fetchBrands = useServerFn(listBrands);
  const removeCampaign = useServerFn(deleteCampaign);

  const history = useQuery({
    queryKey: ["campaign-history"],
    queryFn: () => fetchCampaigns({ data: undefined }),
    enabled: !!session,
  });
  const brands = useQuery({
    queryKey: ["brands"],
    queryFn: () => fetchBrands({ data: undefined }),
    enabled: !!session,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await generate({
        data: {
          brandName,
          product,
          voice,
          personas,
          objectives,
          channels,
          count,
          variationTypes,
          carouselStyles,
        },
      });
      await save({
        data: {
          brandName,
          product,
          voice,
          personas,
          objectives,
          channels,
          variationTypes,
          count,
          variants: res.variants as unknown as Record<string, unknown>[],
          carousels: res.carousels as unknown as Record<string, unknown>[],
        },
      }).catch(() => null);
      return res;
    },
    onSuccess: (res) => {
      setVariants(res.variants);
      setCarousels(res.carousels);
      queryClient.invalidateQueries({ queryKey: ["campaign-history"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });

  const combos = personas.length * objectives.length * channels.length;
  const total = Math.min(24, combos * count);

  const bestId = variants.length
    ? variants.reduce((a, b) => (a.relevance + a.engagement >= b.relevance + b.engagement ? a : b))
        .id
    : null;

  const groups = useMemo(() => {
    const map = new Map<string, Variant[]>();
    for (const v of variants) {
      const list = map.get(v.channel) ?? [];
      list.push(v);
      map.set(v.channel, list);
    }
    return [...map.entries()];
  }, [variants]);

  const loadCampaign = (c: CampaignRecord) => {
    setBrandName(c.brand_name);
    setProduct(c.product);
    setVoice(c.voice ?? "");
    if (c.personas?.length) setPersonas(c.personas);
    if (c.objectives?.length) setObjectives(c.objectives);
    if (c.channels?.length) setChannels(c.channels);
    if (c.variation_types?.length) setVariationTypes(c.variation_types);
    setCount(c.variant_count);
    setVariants(c.variants ?? []);
    setCarousels(c.carousels ?? []);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-muted-foreground">Checking your session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="shell overflow-hidden">
        <SiteNav />

        <div className="grid gap-8 px-6 py-8 md:px-10 lg:grid-cols-[minmax(0,400px)_1fr]">
          <div className="space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
              className="space-y-5 rounded-3xl bg-secondary/60 p-6"
            >
              <div>
                <h1 className="text-3xl font-bold">Campaign Studio</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your Brand DNA guides every word Adgenix writes.
                </p>
              </div>

              {brands.data?.brands?.length ? (
                <Field label="Previous brands" hint="reuse a saved Brand DNA">
                  <div className="flex flex-wrap gap-2">
                    {brands.data.brands.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBrandName(b.name);
                          setProduct(b.product);
                          setVoice(b.voice ?? "");
                        }}
                        className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm hover:bg-secondary"
                      >
                        ↺ {b.name}
                      </button>
                    ))}
                  </div>
                </Field>
              ) : null}

              <Field label="Brand name">
                <input
                  className={inputCls}
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  required
                />
              </Field>

              <Field label="Product brief">
                <textarea
                  className={`${inputCls} min-h-24 resize-y`}
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  required
                />
              </Field>

              <Field label="Tone of voice" hint="optional">
                <textarea
                  className={`${inputCls} min-h-20 resize-y`}
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                />
              </Field>

              <Field label="Personas" hint="select one or more">
                <MultiChips options={PERSONAS} values={personas} onChange={setPersonas} />
              </Field>

              <Field label="Objectives" hint="select one or more">
                <MultiChips options={OBJECTIVES} values={objectives} onChange={setObjectives} />
              </Field>

              <Field label="Channels" hint="select one or more">
                <MultiChips options={CHANNELS} values={channels} onChange={setChannels} />
              </Field>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="font-display text-lg font-semibold">Generate Variations</h2>

                <Field label="Number of Variations" hint={`${total} total packages`}>
                  <div className="flex flex-wrap gap-2">
                    {[3, 5, 7].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCount(n)}
                        className={`h-11 w-11 rounded-2xl text-base font-semibold transition-colors ${
                          count === n
                            ? "bg-ink text-primary-foreground"
                            : "border border-border bg-card hover:bg-secondary"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="mt-4">
                  <Field label="Variation Type" hint="what should differ">
                    <MultiChips
                      options={VARIATION_TYPES}
                      values={variationTypes}
                      onChange={setVariationTypes}
                      check
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="font-display text-lg font-semibold">Instagram Carousels</h2>
                <p className="mb-3 text-sm text-muted-foreground">
                  Full 5-slide storyboards, not just captions.
                </p>
                <MultiChips
                  options={CAROUSEL_STYLES}
                  values={carouselStyles}
                  onChange={setCarouselStyles}
                  allowEmpty
                  check
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {mutation.isPending
                  ? "Generating…"
                  : `Generate ${total} package${total > 1 ? "s" : ""}${
                      carouselStyles.length ? ` + ${carouselStyles.length} carousels` : ""
                    }`}
              </button>

              {mutation.isError ? (
                <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
              ) : null}
            </form>

            <section className="rounded-3xl border border-border p-6">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">History</h2>
                <span className="hand -rotate-2 text-sm">your past campaigns</span>
              </div>

              {history.isLoading ? (
                <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
              ) : history.data?.campaigns?.length ? (
                <ul className="mt-3 space-y-2">
                  {history.data.campaigns.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-3 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => loadCampaign(c)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm font-medium">{c.brand_name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleString()} · {c.variants?.length ?? 0}{" "}
                          variants
                          {c.carousels?.length ? ` · ${c.carousels.length} carousels` : ""}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label="Delete campaign"
                        onClick={async () => {
                          await removeCampaign({ data: { id: c.id } });
                          queryClient.invalidateQueries({ queryKey: ["campaign-history"] });
                        }}
                        className="text-sm text-muted-foreground hover:text-destructive"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nothing yet — your generations save here automatically.
                </p>
              )}
            </section>
          </div>

          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-bold">Campaign packages</h2>
              <span className="hand -rotate-3">scored by the model</span>
            </div>

            {variants.length === 0 && !mutation.isPending ? (
              <div className="mt-4 grid place-items-center rounded-3xl border border-dashed border-border p-16 text-center">
                <p className="max-w-sm text-muted-foreground">
                  Fill in the brief on the left and Adgenix will write {total} full package(s) —
                  headline, content, CTA and visual direction — across{" "}
                  <span className="font-medium text-foreground">{channels.length}</span> channel(s).
                </p>
              </div>
            ) : null}

            {mutation.isPending ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: total }, (_, i) => i).map((i) => (
                  <div key={i} className="h-96 animate-pulse rounded-3xl bg-secondary" />
                ))}
              </div>
            ) : null}

            {variants.length > 0 && !mutation.isPending
              ? groups.map(([channel, list]) => (
                  <div key={channel} className="mt-8">
                    <h3 className="mb-3 font-display text-lg font-semibold">{channel}</h3>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {list.map((v) => (
                        <VariantCard
                          key={v.id}
                          variant={v}
                          best={v.id === bestId}
                          onEdit={(patch) =>
                            setVariants((prev) =>
                              prev.map((x) => (x.id === v.id ? { ...x, ...patch } : x)),
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))
              : null}

            {carousels.length > 0 && !mutation.isPending ? (
              <div className="mt-12">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-2xl font-bold">Carousel storyboards</h2>
                  <span className="hand -rotate-3">slide by slide</span>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  {carousels.map((c, i) => (
                    <CarouselCard key={c.id} carousel={c} index={i} />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
