import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { useAuth } from "@/hooks/useAuth";
import { generateCampaign, type Variant } from "@/lib/campaign.functions";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Adgenix Studio — Generate persona-ready campaigns" },
      {
        name: "description",
        content:
          "Enter your Brand DNA, pick personas, objectives and channels, and generate full scored campaign packages with copy, CTA and visual direction.",
      },
      { property: "og:title", content: "Adgenix Studio" },
      {
        property: "og:description",
        content: "Brand DNA in, complete scored A/B campaign packages out.",
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
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (o: string) => {
    if (values.includes(o)) {
      if (values.length === 1) return;
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
            {on ? "✓ " : ""}
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

function VariantCard({
  variant,
  best,
  onEdit,
}: {
  variant: Variant;
  best: boolean;
  onEdit: (patch: Partial<Variant>) => void;
}) {
  const [copied, setCopied] = useState(false);
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

      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(variantToText(variant));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="self-start text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {copied ? "Copied!" : "Copy full package"}
      </button>

      <div className="mt-auto flex gap-4 pt-2">
        <Score label="Relevance" value={variant.relevance} />
        <Score label="Engagement" value={variant.engagement} />
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
  const [count, setCount] = useState(3);
  const [variants, setVariants] = useState<Variant[]>([]);
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  const generate = useServerFn(generateCampaign);
  const mutation = useMutation({
    mutationFn: () =>
      generate({
        data: { brandName, product, voice, personas, objectives, channels, count },
      }),
    onSuccess: (res) => setVariants(res.variants),
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

        <div className="grid gap-8 px-6 py-8 md:px-10 lg:grid-cols-[minmax(0,380px)_1fr]">
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

            <Field label="Variants per combination" hint={`${total} total packages`}>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={`h-10 w-10 rounded-full text-sm font-semibold transition-colors ${
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

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {mutation.isPending ? "Generating…" : `Generate ${total} package${total > 1 ? "s" : ""}`}
            </button>

            {mutation.isError ? (
              <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
            ) : null}
          </form>

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
          </section>
        </div>
      </div>
    </div>
  );
}
