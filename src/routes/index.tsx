import { Link, createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import tile1 from "@/assets/tile-1.jpg";
import tile2 from "@/assets/tile-2.jpg";
import tile3 from "@/assets/tile-3.jpg";
import tile4 from "@/assets/tile-4.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Adgenix — AI Marketing Campaign Generator" },
      {
        name: "description",
        content:
          "Adgenix turns your Brand DNA and customer personas into on-brand ads, emails and social copy with AI scoring for A/B variants.",
      },
      { property: "og:title", content: "Adgenix — AI Marketing Campaign Generator" },
      {
        property: "og:description",
        content:
          "One brief in, a full multi-channel campaign out. Brand-aware, persona-specific copy with AI relevance scores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const tiles = [tile1, tile2, tile3, tile4, tile2, tile3];

const rotations = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "-rotate-3", "rotate-1"];

function Marquee() {
  const row = [...tiles, ...tiles];
  return (
    <div className="relative overflow-hidden py-6">
      <div className="marquee-track gap-5">
        {row.map((src, i) => (
          <img
            key={i}
            src={src}
            alt="Campaign creative example"
            loading="lazy"
            width={640}
            height={900}
            className={`tile-shadow h-52 w-40 shrink-0 rounded-2xl object-cover md:h-64 md:w-48 ${rotations[i % rotations.length]}`}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

const steps = [
  {
    n: "01",
    t: "Feed your Brand DNA",
    d: "Product brief, tone of voice, past winners. Stored once, reused on every generation.",
  },
  {
    n: "02",
    t: "Pick a persona",
    d: "Students, working professionals, premium buyers — or write your own segment.",
  },
  {
    n: "03",
    t: "Generate & compare",
    d: "Three A/B variants per channel with relevance and engagement scores you can edit.",
  },
];

const personas = [
  { emoji: "🎓", name: "Students", note: "Price-first, meme-fluent, short attention" },
  { emoji: "💼", name: "Working professionals", note: "Time-saving, credibility, ROI" },
  { emoji: "💎", name: "Premium customers", note: "Craft, exclusivity, restraint" },
  { emoji: "🚀", name: "Early adopters", note: "Novelty, capability, being first" },
];

const channels = [
  "Instagram caption",
  "Google Ad",
  "Email subject line",
  "LinkedIn post",
  "SMS blast",
  "Landing hero",
  "YouTube pre-roll",
  "Push notification",
];

function Index() {
  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="shell overflow-hidden">
        <SiteNav />

        <section className="relative px-6 pt-6 text-center md:px-10">
          <span className="inline-flex rounded-full bg-sun px-4 py-1.5 text-xs font-semibold text-accent-foreground">
            Brand DNA + Persona context layer
          </span>

          <div className="relative mx-auto mt-6 max-w-4xl">
            <h1 className="text-5xl leading-[0.95] font-bold text-balance md:text-7xl">
              One brief in. <br /> A whole campaign out.
            </h1>
            <span className="hand absolute -top-2 -left-2 hidden -rotate-12 md:block">
              on-brand, always ↘
            </span>
            <span className="hand absolute -right-4 bottom-0 hidden rotate-12 md:block">
              3 variants, scored
            </span>
          </div>

          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Adgenix reads your product, tone of voice and customer persona, then writes ads, emails
            and social posts for every channel — with AI scoring to pick the winner.
          </p>
        </section>

        <Marquee />

        <div className="relative flex flex-col items-center pb-14">
          <Link
            to="/studio"
            className="rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5"
          >
            Generate a campaign
          </Link>
          <span className="hand mt-2 -rotate-6">it's free to try</span>
        </div>

        <section id="how" className="border-t border-border px-6 py-16 md:px-10">
          <h2 className="text-3xl font-bold md:text-4xl">How Adgenix works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-3xl bg-secondary p-6">
                <span className="font-display text-4xl text-primary">{s.n}</span>
                <h3 className="mt-3 text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="personas" className="grid gap-10 px-6 py-16 md:grid-cols-2 md:px-10">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">
              Personas that actually change the copy
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every persona carries its own psychographics into the prompt, so a student ad and a
              premium ad never read like the same sentence with a different noun.
            </p>
            <span className="hand mt-4 block -rotate-3">no generic AI slop</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {personas.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-1"
              >
                <span className="text-2xl">{p.emoji}</span>
                <h3 className="mt-2 font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="channels" className="px-6 pb-16 md:px-10">
          <div className="rounded-3xl bg-ink p-8 text-primary-foreground md:p-12">
            <h2 className="max-w-lg text-3xl font-bold md:text-4xl">
              One campaign, adapted to every channel.
            </h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {channels.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm opacity-90"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="impact" className="grid gap-4 px-6 pb-16 md:grid-cols-3 md:px-10">
          {[
            ["~30%", "better targeting accuracy with AI-driven content"],
            ["3 variants", "generated and scored in a single pass"],
            ["Minutes", "from brand brief to a full A/B-ready set"],
          ].map(([big, small]) => (
            <div key={big} className="rounded-3xl bg-accent p-7 text-accent-foreground">
              <p className="font-display text-4xl font-bold">{big}</p>
              <p className="mt-2 text-sm opacity-80">{small}</p>
            </div>
          ))}
        </section>

        <footer className="flex flex-col items-center gap-3 border-t border-border px-6 py-10 text-sm text-muted-foreground md:flex-row md:justify-between md:px-10">
          <p>© {new Date().getFullYear()} Adgenix — Generative AI for brand-consistent marketing.</p>
          <Link to="/studio" className="font-medium text-foreground">
            Open the Studio →
          </Link>
        </footer>
      </div>
    </div>
  );
}
