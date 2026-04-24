import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDemo } from "@/hooks/useDemo";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Brain,
  BarChart3,
  Bell,
  Truck,
  ScanLine,
  TrendingUp,
  Users,
  ArrowRight,
  Shield,
  Sparkles,
  Zap,
  Menu,
  X,
  Boxes,
  LineChart,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "StockMind — Inteligência para o seu Estoque" },
      {
        name: "description",
        content:
          "StockMind é o sistema de gerenciamento de estoque com inteligência artificial: previsões, alertas inteligentes e visibilidade em tempo real.",
      },
      { property: "og:title", content: "StockMind — Inteligência para o seu Estoque" },
      {
        property: "og:description",
        content:
          "Gerencie seu estoque com IA: previsão de demanda, reposição automática e analytics em tempo real.",
      },
    ],
  }),
});

/* ─── Brand tokens (Ice Blue palette) ──────────────────── */
import logoCube from "@/assets/logo-cube.png";

const BRAND = {
  petrol: "#0B2A5B",
  emerald: "#1E6FD9",
  orange: "#5BC0F8",
};

const navLinks = [
  { label: "Recursos", href: "#features" },
  { label: "Inteligência", href: "#ai" },
  { label: "Como funciona", href: "#how" },
];

const features = [
  { icon: Brain, title: "IA preditiva", description: "Previsão de demanda com modelos estatísticos que aprendem com o seu histórico." },
  { icon: Bell, title: "Alertas inteligentes", description: "Receba avisos antes do estoque acabar — ruptura zero, sem ansiedade." },
  { icon: BarChart3, title: "Visibilidade em tempo real", description: "Dashboards vivos para cada localização, SKU e movimento." },
  { icon: Truck, title: "Fornecedores conectados", description: "Lead times, performance e pedidos de compra integrados." },
  { icon: ScanLine, title: "Código de barras", description: "Recebimento e contagem cíclica em segundos via scanner ou câmera." },
  { icon: Users, title: "Equipe alinhada", description: "Permissões por papel e fluxos de aprovação para Admin, Gestor e Solicitante." },
];

const aiCapabilities = [
  { icon: Sparkles, title: "Sugestões de reposição", desc: "Quanto e quando comprar — calculado por IA." },
  { icon: TrendingUp, title: "Forecast Holt-Winters", desc: "Sazonalidade e tendência detectadas automaticamente." },
  { icon: Activity, title: "Detecção de anomalias", desc: "Movimentos suspeitos sinalizados em tempo real." },
];

const steps = [
  { n: "01", title: "Conecte seu estoque", desc: "Importe via CSV ou comece com dados de demonstração." },
  { n: "02", title: "Deixe a IA aprender", desc: "Em minutos, o StockMind entende seus padrões de venda." },
  { n: "03", title: "Aja com confiança", desc: "Alertas, sugestões e relatórios prontos para decidir." },
];

/* ─── Helpers ─────────────────────────────────────────── */

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function StickyNav({ onTryDemo }: { onTryDemo: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 font-brand transition-all duration-300 ${
        scrolled ? "bg-white/85 border-b border-slate-200 shadow-sm backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">StockMind</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {l.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={onTryDemo}
          className="hidden items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 md:inline-flex"
          style={{ background: `linear-gradient(135deg, ${BRAND.petrol}, ${BRAND.emerald})` }}
        >
          Acessar demo
          <ArrowRight className="h-4 w-4" />
        </button>

        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-slate-700 md:hidden" aria-label="Menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                setMobileOpen(false);
                document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="block py-3 text-sm font-medium text-slate-600"
            >
              {l.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => { setMobileOpen(false); onTryDemo(); }}
            className="mt-2 w-full rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow"
            style={{ background: `linear-gradient(135deg, ${BRAND.petrol}, ${BRAND.emerald})` }}
          >
            Acessar demo
          </button>
        </div>
      )}
    </nav>
  );
}

function Logo() {
  return (
    <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl shadow-md ring-1 ring-slate-200 bg-gradient-to-br from-slate-50 to-white">
      <img src={logoCube} alt="StockMind cube logo" width={40} height={40} className="h-9 w-9 object-contain" />
    </span>
  );
}

/* ─── Animated hero illustration ──────────────────────── */
function HeroVisual() {
  const metrics = [
    { label: "Acurácia IA", value: "99,2%", color: BRAND.emerald, icon: Brain },
    { label: "SKUs ativos", value: "12.847", color: BRAND.petrol, icon: Boxes },
    { label: "Reposições sugeridas", value: "37", color: BRAND.orange, icon: Sparkles },
  ];
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-md sm:h-[480px]">
      {/* Floating gradient blobs */}
      <div className="pointer-events-none absolute -left-16 -top-10 h-72 w-72 rounded-full opacity-40 blur-3xl animate-blob" style={{ background: BRAND.petrol }} />
      <div className="pointer-events-none absolute -right-10 top-20 h-72 w-72 rounded-full opacity-40 blur-3xl animate-blob" style={{ background: BRAND.emerald, animationDelay: "-6s" }} />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full opacity-30 blur-3xl animate-blob" style={{ background: BRAND.orange, animationDelay: "-12s" }} />

      {/* Central card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="absolute left-1/2 top-1/2 w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-tech">Live</p>
              <p className="text-sm font-bold text-slate-900">StockMind AI</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: `${BRAND.emerald}15`, color: BRAND.emerald }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: BRAND.emerald }} />
            Online
          </span>
        </div>

        <div className="mt-5 space-y-2.5">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${m.color}18`, color: m.color }}>
                  <m.icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium text-slate-600">{m.label}</span>
              </div>
              <span className="font-tech text-sm font-bold text-slate-900">{m.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Mini sparkline */}
        <div className="mt-4 rounded-xl border border-slate-100 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Demanda prevista · 7d</span>
            <span className="font-tech text-[11px]" style={{ color: BRAND.emerald }}>+12,4%</span>
          </div>
          <Sparkline />
        </div>
      </motion.div>

      {/* Floating chips */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute -left-2 top-6 flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-lg ring-1 ring-slate-200 animate-float-soft"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: `${BRAND.orange}20`, color: BRAND.orange }}>
          <Bell className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-tech">Alerta</p>
          <p className="text-xs font-semibold text-slate-800">Reposição em 3 dias</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute -right-2 bottom-10 flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-lg ring-1 ring-slate-200 animate-float-soft"
        style={{ animationDelay: "-3s" }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: `${BRAND.emerald}20`, color: BRAND.emerald }}>
          <TrendingUp className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-tech">IA</p>
          <p className="text-xs font-semibold text-slate-800">Pico em 12 dias</p>
        </div>
      </motion.div>
    </div>
  );
}

function Sparkline() {
  const points = [22, 28, 25, 33, 30, 38, 36, 44, 42, 52, 48, 58];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 220;
  const h = 44;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / (max - min)) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={BRAND.emerald} stopOpacity="0.35" />
          <stop offset="100%" stopColor={BRAND.emerald} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#sparkFill)" />
      <motion.path
        d={path}
        fill="none"
        stroke={BRAND.emerald}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />
    </svg>
  );
}

/* ─── Page ────────────────────────────────────────────── */
function LandingPage() {
  const { enterDemoMode } = useDemo();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  const handleTryDemo = () => {
    enterDemoMode();
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="min-h-screen bg-white font-brand text-slate-900">
      <StickyNav onTryDemo={handleTryDemo} />

      {/* ── Hero ─────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden px-4 pt-28 pb-20 sm:px-6 sm:pt-36 sm:pb-28">
        {/* Background grid + gradient wash */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #1e293b 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: BRAND.orange }} />
              Inteligência artificial para estoques modernos
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-[40px] font-extrabold leading-[1.05] tracking-tight sm:text-[56px] lg:text-[64px]"
            >
              Gerencie seu estoque com{" "}
              <span
                className="bg-clip-text text-transparent animate-gradient-text"
                style={{ backgroundImage: `linear-gradient(120deg, ${BRAND.petrol}, ${BRAND.emerald}, ${BRAND.orange}, ${BRAND.emerald}, ${BRAND.petrol})` }}
              >
                inteligência
              </span>
              .
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
            >
              O StockMind usa IA para prever demanda, sugerir reposições e detectar anomalias —
              transformando o seu inventário em uma vantagem competitiva.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <button
                type="button"
                onClick={handleTryDemo}
                className="group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ background: BRAND.orange }}
              >
                Experimentar grátis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#features"
                onClick={(e) => { e.preventDefault(); document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" }); }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 transition-all hover:border-slate-400 hover:-translate-y-0.5"
              >
                Ver recursos
              </a>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500"
            >
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" style={{ color: BRAND.petrol }} /> Dados seguros</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" style={{ color: BRAND.emerald }} /> Setup em minutos</span>
              <span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" style={{ color: BRAND.orange }} /> IA integrada</span>
            </motion.div>
          </div>

          <div>
            <HeroVisual />
          </div>
        </motion.div>
      </section>

      {/* ── Features grid ───────────────────────────── */}
      <section id="features" className="relative px-4 py-24 sm:py-32">
        <RevealSection className="mx-auto max-w-3xl text-center">
          <span className="font-tech text-xs font-bold uppercase tracking-[0.2em]" style={{ color: BRAND.petrol }}>Recursos</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">Tudo o que você precisa, em um só lugar</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
            Da operação ao planejamento estratégico — o StockMind cobre todas as etapas com elegância.
          </p>
        </RevealSection>

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <RevealSection key={f.title} delay={i * 70}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-2xl">
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `linear-gradient(135deg, ${BRAND.petrol}08, ${BRAND.emerald}08)` }}
                />
                <div className="relative">
                  <div
                    className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ background: `linear-gradient(135deg, ${BRAND.petrol}, ${BRAND.emerald})` }}
                  >
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ── AI section ───────────────────────────────── */}
      <section id="ai" className="relative overflow-hidden px-4 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: `linear-gradient(135deg, ${BRAND.petrol}, ${BRAND.emerald})` }} />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <RevealSection>
            <span className="font-tech text-xs font-bold uppercase tracking-[0.2em] text-white/80">Inteligência artificial</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Decisões mais rápidas. Estoques mais inteligentes.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/85 sm:text-lg">
              Modelos de previsão Holt-Winters, detecção de anomalias e sugestões automáticas trabalham 24/7
              pelo seu negócio. Sem planilhas. Sem achismo.
            </p>
            <button
              type="button"
              onClick={handleTryDemo}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold shadow-xl transition-all hover:-translate-y-0.5"
              style={{ color: BRAND.petrol }}
            >
              Ver IA em ação
              <ArrowRight className="h-4 w-4" />
            </button>
          </RevealSection>

          <div className="space-y-4">
            {aiCapabilities.map((c, i) => (
              <RevealSection key={c.title} delay={i * 100}>
                <div className="flex items-start gap-4 rounded-2xl bg-white/12 p-5 backdrop-blur-md ring-1 ring-white/20 transition-all hover:bg-white/18">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-lg" style={{ color: BRAND.petrol }}>
                    <c.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">{c.title}</h3>
                    <p className="mt-1 text-sm text-white/80">{c.desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section id="how" className="px-4 py-24 sm:py-32">
        <RevealSection className="mx-auto max-w-3xl text-center">
          <span className="font-tech text-xs font-bold uppercase tracking-[0.2em]" style={{ color: BRAND.emerald }}>Como funciona</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">Três passos para começar</h2>
        </RevealSection>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <RevealSection key={s.n} delay={i * 120}>
              <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-xl">
                <span
                  className="font-tech text-5xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND.petrol}, ${BRAND.emerald})`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {s.n}
                </span>
                <h3 className="mt-3 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────── */}
      <section className="px-4 pb-24">
        <RevealSection className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl px-6 py-16 text-center shadow-2xl sm:px-12 sm:py-20" style={{ background: `linear-gradient(120deg, ${BRAND.petrol}, ${BRAND.emerald})` }}>
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl" style={{ background: BRAND.orange }} />
            <div className="pointer-events-none absolute -left-10 -bottom-10 h-56 w-56 rounded-full opacity-20 blur-3xl bg-white" />

            <div className="relative">
              <Logo />
              <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Pronto para um estoque mais inteligente?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
                Comece com o ambiente de demonstração. Sem cadastro, sem cartão.
              </p>
              <button
                type="button"
                onClick={handleTryDemo}
                className="mt-9 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold shadow-xl transition-all hover:-translate-y-0.5"
                style={{ background: BRAND.orange, color: "#fff" }}
              >
                Acessar StockMind
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-slate-200 px-4 py-10 text-center">
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-bold text-slate-700">StockMind</span>
          </div>
          <span className="font-tech text-xs">© {new Date().getFullYear()} · Inteligência para o seu estoque</span>
        </div>
      </footer>
    </div>
  );
}

// silence unused import lint when LineChart isn't referenced visually
void LineChart;
