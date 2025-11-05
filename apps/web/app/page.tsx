import Image from "next/image";

import { Button } from "./components/ui/button";

const testimonials = [
  {
    name: "Priya Desai",
    role: "Head of Platform • Nova Robotics",
    quote:
      "We reduced integration backlogs by 62% and orchestrate agents across on-prem clusters without custom glue code.",
  },
  {
    name: "Jordan Miles",
    role: "Director of Engineering • Prism Labs",
    quote:
      "The hybrid canvas lets our staff engineers drop into TypeScript where it matters. Everything else ships in minutes.",
  },
  {
    name: "Lina Kozlova",
    role: "AI Operations Lead • Strata AI",
    quote:
      "Observability and audit trails are built-in. Security signed off in one review. That never happens for new tooling.",
  },
];

const workflowSteps = [
  {
    title: "Parse Issue Context",
    description: "LLM classifies scope + urgency",
    badgeClass:
      "bg-gradient-to-br from-[#1f0b3d] via-[#382273] to-[#4c1d95] shadow-[0_10px_30px_-14px_rgba(124,58,237,0.8)]",
  },
  {
    title: "Retrieve Knowledge",
    description: "Vector search across design docs",
    badgeClass:
      "bg-gradient-to-br from-[#0f172a] via-[#123353] to-[#1e293b] shadow-[0_10px_30px_-14px_rgba(14,165,233,0.8)]",
  },
  {
    title: "Draft Solution",
    description: "Generate PR plan + infrastructure notes",
    badgeClass:
      "bg-gradient-to-br from-[#1f2937] via-[#314155] to-[#4b5563] shadow-[0_10px_30px_-14px_rgba(22,163,74,0.8)]",
  },
  {
    title: "Notify Squad",
    description: "Sync to Slack & Linear with context",
    badgeClass:
      "bg-gradient-to-br from-[#2c0f26] via-[#4c1d95] to-[#ff6b2c] shadow-[0_10px_30px_-14px_rgba(255,107,44,0.8)]",
  },
];

const footerColumns = [
  {
    heading: "Company",
    links: ["Careers", "Contact", "Press", "Legal"],
  },
  {
    heading: "Resources",
    links: ["Case studies", "AI agent report", "Tools", "Brand kit"],
  },
  {
    heading: "Popular integrations",
    links: ["Google Sheets", "Slack", "Postgres", "Show more"],
  },
  {
    heading: "Top guides",
    links: ["Open-source LLM", "Automation blueprints", "Zapier alternatives", "Show more"],
  },
];

export default function Home() {
  const copyrightYear = new Date().getFullYear();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05010d] text-white">
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.35),transparent_65%)] blur-[120px]" />
        <div className="absolute top-1/2 left-[12%] h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,107,44,0.3),transparent_60%)] blur-[120px]" />
        <div className="absolute bottom-[-30%] right-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.4),transparent_55%)] blur-[140px]" />
      </div>

      {/* Navigation */}
      <header className="relative z-20 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-8 px-6 py-6 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[conic-gradient(at_top_left,#7C3AED,#FF6B2C,#0EA5E9,#7C3AED)] text-lg font-bold text-white shadow-[0_15px_45px_-25px_rgba(124,58,237,0.8)]">
              AI
            </span>
            <div>
              <p className="text-lg font-semibold text-white">FlowForge</p>
              <p className="text-xs uppercase tracking-[0.28em] text-white/40">Automation cloud</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button href="/signin" variant="ghost" className="hidden sm:inline-flex">
              Sign in
            </Button>
            <Button
              href="/signup"
              className="border-none bg-[linear-gradient(120deg,#7C3AED_0%,#FF6B2C_45%,#FACC15_100%)] text-white shadow-magic hover:shadow-[0_28px_90px_-40px_rgba(255,107,44,0.95)]"
            >
              Sign up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[calc(100vh-110px)] items-center justify-center px-6 py-24 sm:px-10">
        <div className="mx-auto grid w-full max-w-6xl gap-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          {/* Copy column */}
          <div className="flex flex-col justify-center gap-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-white/70 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#FF6B2C] shadow-[0_0_16px_rgba(255,107,44,0.7)]" />
              Ai Flow Studio
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
                Flexible AI workflow automation
                <span className="block text-[#FF6B2C] drop-shadow-[0_8px_35px_rgba(255,107,44,0.35)]">
                  for technical teams 🔥
                </span>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                Build with the precision of code or the speed of drag-n-drop. Host on-prem or in-cloud. Integrate apps faster than with any other tool.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                href="/signup"
                className="group overflow-hidden border-none bg-[linear-gradient(120deg,#7C3AED_0%,#FF6B2C_45%,#FACC15_100%)] text-white shadow-magic transition-transform hover:scale-[1.03] hover:shadow-[0_28px_90px_-40px_rgba(255,107,44,0.95)] focus-visible:ring-brand-400"
              >
                <span className="relative">Get started for free</span>
              </Button>
            </div>

            <div className="grid gap-6 pt-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 shadow-[0_15px_45px_-30px_rgba(124,58,237,0.85)] transition-all duration-300 hover:border-white/25 hover:bg-white/10">
                <p className="font-semibold text-white">Low-code + high-control</p>
                <p className="pt-1 text-xs leading-relaxed text-white/60">
                  Mix drag-n-drop canvases with inline code cells to keep velocity and precision.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 shadow-[0_15px_45px_-30px_rgba(14,165,233,0.75)] transition-all duration-300 hover:border-white/25 hover:bg-white/10">
                <p className="font-semibold text-white">Deploy anywhere</p>
                <p className="pt-1 text-xs leading-relaxed text-white/60">
                  Ship to your private cloud, on-prem, or the managed runtime in a single click.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 shadow-[0_15px_45px_-30px_rgba(255,107,44,0.75)] transition-all duration-300 hover:border-white/25 hover:bg-white/10">
                <p className="font-semibold text-white">Integrate faster</p>
                <p className="pt-1 text-xs leading-relaxed text-white/60">
                  250+ prebuilt connectors and an SDK for internal systems keep your agents in sync.
                </p>
              </div>
            </div>
          </div>

          {/* Visual column */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -top-16 left-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,107,44,0.35),transparent_60%)] blur-2xl" />
            <div className="absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.5),transparent_65%)] blur-3xl" />

            <div className="group relative w-full max-w-lg">
              <div className="absolute inset-0 rounded-[32px] bg-[conic-gradient(at_top_left,#7C3AED,#FF6B2C,#0EA5E9,#7C3AED)] opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-80" />
              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.06] p-8 shadow-[0_45px_140px_-60px_rgba(124,58,237,0.85)] backdrop-blur-xl">
                <div className="flex items-center justify-between text-xs uppercase text-white/40">
                  <span>Automation run</span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    Live
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f0a1f]/80 p-5 shadow-[0_24px_60px_-40px_rgba(79,70,229,0.6)]">
                    <div className="absolute -top-3 -right-3 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(255,107,44,0.4),transparent_70%)] blur-xl" />
                    <p className="text-sm font-semibold text-white">Trigger: New Github Issue</p>
                    <p className="pt-1 text-xs text-white/60">Repo: platform/main · Label: ai-agent</p>
                  </div>

                  <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0b0716]/90 p-5">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/40">
                      <span>Workflow graph</span>
                      <span>4 steps</span>
                    </div>
                    <div className="grid gap-4">
                      {workflowSteps.map((step, index) => (
                        <div
                          key={step.title}
                          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] p-3 text-sm text-white/70"
                        >
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl text-base font-semibold text-white ${step.badgeClass}`}
                          >
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-white/90">{step.title}</p>
                            <p className="text-xs text-white/50">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs text-white/60">
                  <div>
                    <p className="text-white/80">Avg deployment</p>
                    <p className="text-lg font-semibold text-white">3.2 min</p>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div>
                    <p className="text-white/80">Playbooks automated</p>
                    <p className="text-lg font-semibold text-white">42</p>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div>
                    <p className="text-white/80">API reliability</p>
                    <p className="text-lg font-semibold text-emerald-400">99.98%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 pb-24 sm:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 rounded-[32px] border border-white/10 bg-white/[0.04] p-10 shadow-[0_60px_120px_-70px_rgba(124,58,237,0.75)] backdrop-blur-xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Loved by technical teams</p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              "FlowForge gives our engineers the clarity of code with the velocity of visual automation."
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="group relative flex h-full flex-col justify-between gap-6 rounded-2xl border border-white/10 bg-[#0b0716]/80 p-6 text-white/70 transition-all duration-300 hover:border-white/25 hover:bg-[#0f0a1f]/90"
              >
                <p className="text-sm leading-relaxed text-white/80">{testimonial.quote}</p>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p>{testimonial.role}</p>
                  </div>
                  <span className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.4),rgba(255,107,44,0.4))] opacity-80 shadow-[0_14px_40px_-20px_rgba(255,107,44,0.6)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer with inspiration image */}
      <footer className="relative z-10 border-t border-white/10 bg-[#070118] px-6 py-16 sm:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,rgba(255,107,44,0.6),rgba(124,58,237,0.4))] text-xl font-bold text-white shadow-[0_20px_45px_-25px_rgba(255,107,44,0.8)]">
                  AI
                </span>
                <div>
                  <p className="text-lg font-semibold text-white">FlowForge</p>
                  <p className="text-sm text-white/60">Automate without limits</p>
                </div>
              </div>

              <p className="max-w-sm text-sm text-white/60">
                Launch AI workflows across your stack with confidence. Visualize every agent run, secure every deployment, and scale across teams.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-white/40">
                {["X", "GitHub", "Discord", "LinkedIn", "YouTube"].map((label) => (
                  <span
                    key={label}
                    className="text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:text-white/80"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-10 text-sm text-white/60 sm:grid-cols-2 lg:grid-cols-4">
              {footerColumns.map((column) => (
                <div key={column.heading} className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/45">
                    {column.heading}
                  </p>
                  <ul className="space-y-2">
                    {column.links.map((link) => (
                      <li key={link} className="transition-colors hover:text-white">
                        {link}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-white/60">
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">Platform snapshots</p>
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0716]">
              <Image
                src="/footer-inspiration.svg"
                alt="FlowForge inspiration"
                width={1548}
                height={768}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-white/40">
              <div className="flex items-center gap-3">
                <span>© {copyrightYear} FlowForge. All rights reserved.</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 uppercase tracking-[0.25em]">
                <span>Security</span>
                <span>Privacy</span>
                <span>Imprint</span>
                <span>Report a vulnerability</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
