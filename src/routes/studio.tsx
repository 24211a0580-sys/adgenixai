import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { generateCampaign, type Variant } from "@/lib/campaign.functions";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Adgenix Studio — Generate persona-ready campaigns" },
      {
        name: "description",
        content:
          "Enter your Brand DNA, pick a persona and channel, and generate three scored campaign variants you can edit and compare.",
      },
      { property: "og:title", content: "Adgenix Studio" },
      {
        property: "og:description",
        content: "Brand DNA in, three scored A/B campaign variants out.",
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

function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
            value === o
              ? "bg-ink text-primary-foreground"
              : "border border-border bg-card hover:bg-secondary"
          }`}
        >
          {o}
        </button>
      ))}
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
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
          {variant.angle}
        </span>
        {best ? (
          <span className="rounded-full bg-sun px-3 py-1 text-xs font-semibold text-accent-foreground">
            Top pick
          </span>
        ) : null}
      </div>

      <textarea
        value={variant.headline}
        onChange={(e) => onEdit({ headline: e.target.value })}
        rows={2}
        className="w-full resize-none rounded-xl bg-transparent font-display text-xl leading-snug font-semibold outline-none"
      />
      <textarea
        value={variant.body}
        onChange={(e) => onEdit({ body: e.target.value })}
        rows={5}
        className="w-full resize-none rounded-xl bg-secondary/60 p-3 text-sm outline-none"
      />
      <p className="text-sm text-muted-foreground italic">“{variant.tagline}”</p>

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
          {variant.cta}
        </span>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard?.writeText(
              `${variant.headline}\n\n${variant.body}\n\n${variant.cta}`,
            )
          }
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Copy
        </button>
      </div>

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
  const [persona, setPersona] = useState(PERSONAS[1]!);
  const [objective, setObjective] = useState(OBJECTIVES[0]!);
  const [channel, setChannel] = useState(CHANNELS[0]!);
  const [variants, setVariants] = useState<Variant[]>([]);

  const generate = useServerFn(generateCampaign);
  const mutation = useMutation({
    mutationFn: () => generate({ data: { brandName, product, voice, persona, objective, channel } }),
    onSuccess: (res) => setVariants(res.variants),
  });

  const bestId = variants.length
    ? variants.reduce((a, b) => (a.relevance + a.engagement >= b.relevance + b.engagement ? a : b))
        .id
    : null;

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

            <Field label="Persona">
              <Chips options={PERSONAS} value={persona} onChange={setPersona} />
            </Field>

            <Field label="Objective">
              <Chips options={OBJECTIVES} value={objective} onChange={setObjective} />
            </Field>

            <Field label="Channel">
              <Chips options={CHANNELS} value={channel} onChange={setChannel} />
            </Field>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {mutation.isPending ? "Generating…" : "Generate 3 variants"}
            </button>

            {mutation.isError ? (
              <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
            ) : null}
          </form>

          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-bold">A/B variants</h2>
              <span className="hand -rotate-3">scored by the model</span>
            </div>

            {variants.length === 0 && !mutation.isPending ? (
              <div className="mt-4 grid place-items-center rounded-3xl border border-dashed border-border p-16 text-center">
                <p className="max-w-sm text-muted-foreground">
                  Fill in the brief on the left and Adgenix will write three persona-tuned variants
                  for <span className="font-medium text-foreground">{channel}</span>.
                </p>
              </div>
            ) : null}

            {mutation.isPending ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-72 animate-pulse rounded-3xl bg-secondary" />
                ))}
              </div>
            ) : null}

            {variants.length > 0 && !mutation.isPending ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {variants.map((v) => (
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
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
