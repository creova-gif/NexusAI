import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "motion/react";
import { Link } from "wouter";
import { ArrowRight, Shield, Zap, Network, FileText, Brain, ChevronDown, Play, X } from "lucide-react";

/* ─── Particle Canvas ─────────────────────────────────────────────────────── */
function ParticleCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const COUNT = 80;
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.4,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139,92,246,0.75)";
        ctx.fill();
      }
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(139,92,246,${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${className}`} />;
}

/* ─── Counter ─────────────────────────────────────────────────────────────── */
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const ctrl = animate(0, target, {
      duration: 1.8, ease: "easeOut",
      onUpdate: v => { if (ref.current) ref.current.textContent = prefix + Math.round(v).toLocaleString() + suffix; }
    });
    return () => ctrl.stop();
  }, [inView, target, suffix, prefix]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

/* ─── Stat Card (extracted to avoid hooks-in-map) ────────────────────────── */
function StatCard({ val, suffix, label, delay }: { val: number; suffix: string; label: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="p-4 rounded-xl"
      style={{ background: "rgba(139,92,246,0.07)", border: "0.5px solid rgba(139,92,246,0.18)" }}>
      <div className="text-2xl font-bold font-['Instrument_Serif'] text-[#A78BFA]">
        <Counter target={val} suffix={suffix} />
      </div>
      <div className="text-xs text-[rgba(255,255,255,0.45)] mt-1">{label}</div>
    </motion.div>
  );
}

/* ─── Blueprint: AML Alert Flow ─────────────────────────────────────────── */
function AMLBlueprint() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const nodes = [
    { x: 80,  y: 145, label: "TXN INGEST",   color: "#8B5CF6" },
    { x: 240, y: 80,  label: "RULES ENGINE", color: "#A78BFA" },
    { x: 240, y: 200, label: "ML SCORER",    color: "#A78BFA" },
    { x: 395, y: 145, label: "AI TRIAGE",    color: "#8B5CF6" },
    { x: 395, y: 265, label: "KYC CHECK",    color: "#60A5FA" },
    { x: 395, y: 25,  label: "OFAC",         color: "#F87171" },
    { x: 555, y: 145, label: "CASE MGR",     color: "#34D399" },
    { x: 700, y: 80,  label: "FINTRAC",      color: "#FBBF24" },
    { x: 700, y: 200, label: "CLOSE",        color: "#34D399" },
  ];
  const edges = [
    { x1: 108, y1: 145, x2: 212, y2: 88,  delay: 0.1 },
    { x1: 108, y1: 145, x2: 212, y2: 192, delay: 0.2 },
    { x1: 267, y1: 88,  x2: 368, y2: 145, delay: 0.35 },
    { x1: 267, y1: 192, x2: 368, y2: 145, delay: 0.45 },
    { x1: 267, y1: 88,  x2: 368, y2: 33,  delay: 0.55 },
    { x1: 395, y1: 165, x2: 395, y2: 245, delay: 0.62 },
    { x1: 422, y1: 145, x2: 528, y2: 145, delay: 0.72 },
    { x1: 422, y1: 33,  x2: 528, y2: 125, delay: 0.80 },
    { x1: 422, y1: 265, x2: 528, y2: 160, delay: 0.87 },
    { x1: 582, y1: 125, x2: 672, y2: 88,  delay: 0.93 },
    { x1: 582, y1: 158, x2: 672, y2: 192, delay: 0.98 },
  ];
  return (
    <div ref={ref} className="relative w-full">
      <svg viewBox="0 0 780 300" className="w-full" style={{ filter: "drop-shadow(0 0 10px rgba(139,92,246,0.2))" }}>
        <defs>
          <pattern id="bp-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(139,92,246,0.07)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="780" height="300" fill="url(#bp-grid)" rx="12" />
        {edges.map((e, i) => (
          <motion.line key={i}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="rgba(139,92,246,0.5)" strokeWidth="1.5" strokeDasharray="5 3"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: e.delay }}
          />
        ))}
        {/* Animated dots along edges */}
        {inView && edges.slice(0, 6).map((e, i) => (
          <motion.circle key={`dot-${i}`} r="3.5" fill="#A78BFA" opacity="0.9"
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, delay: e.delay + 0.6, repeat: Infinity, repeatDelay: 2.5 }}>
            <animateMotion
              dur="1.6s" repeatCount="indefinite"
              begin={`${e.delay + 0.6}s`}
              path={`M ${e.x1} ${e.y1} L ${e.x2} ${e.y2}`}
            />
          </motion.circle>
        ))}
        {nodes.map((n, i) => (
          <motion.g key={n.label}
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: i * 0.07, ease: "backOut" }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
            <circle cx={n.x} cy={n.y} r="22" fill={`${n.color}15`} stroke={n.color} strokeWidth="1.2" />
            <circle cx={n.x} cy={n.y} r="4" fill={n.color} />
            <text x={n.x} y={n.y + 36} textAnchor="middle" fill={n.color} fontSize="7.5" fontFamily="Geist Mono,monospace" fontWeight="600">{n.label}</text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

/* ─── Rules Circuit ─────────────────────────────────────────────────────── */
function RulesCircuit() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const rules = [
    { name: "High Velocity Transfers",  cat: "AML",       score: 97, color: "#F87171" },
    { name: "PEP Name Match",           cat: "SANCTIONS",  score: 94, color: "#FBBF24" },
    { name: "Structuring Anomalies",    cat: "AML",       score: 82, color: "#FBBF24" },
    { name: "Offshore Jurisdiction",    cat: "AML",       score: 78, color: "#A78BFA" },
    { name: "Shell Company Pattern",    cat: "AML",       score: 91, color: "#F87171" },
  ];
  return (
    <div ref={ref} className="space-y-3">
      {rules.map((r, i) => (
        <motion.div key={i}
          initial={{ x: -50, opacity: 0 }}
          animate={inView ? { x: 0, opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
          className="flex items-center gap-4 px-5 py-4 rounded-xl border-[0.5px]"
          style={{ background: `${r.color}08`, borderColor: `${r.color}22` }}>
          <motion.div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: r.color, boxShadow: `0 0 0 0 ${r.color}` }}
            animate={inView ? { boxShadow: [`0 0 0 0 ${r.color}50`, `0 0 0 8px ${r.color}00`] } : {}}
            transition={{ duration: 1.4, delay: i * 0.1 + 0.5, repeat: Infinity }} />
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">{r.name}</div>
            <div className="text-[0.6rem] font-bold tracking-widest mt-0.5 font-['Geist_Mono']" style={{ color: r.color }}>{r.cat}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div className="h-full rounded-full" style={{ background: r.color }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${r.score}%` } : {}}
                transition={{ duration: 0.8, delay: i * 0.1 + 0.3 }} />
            </div>
            <span className="text-xs font-bold font-['Geist_Mono'] w-6 text-right" style={{ color: r.color }}>{r.score}</span>
            {/* Toggle */}
            <div className="w-9 h-5 rounded-full flex items-center px-0.5 transition-all"
              style={{ background: `${r.color}30`, border: `1px solid ${r.color}50` }}>
              <motion.div className="w-3.5 h-3.5 rounded-full"
                style={{ background: r.color }}
                initial={{ x: 0 }}
                animate={inView ? { x: 16 } : {}}
                transition={{ duration: 0.35, delay: i * 0.1 + 0.45, ease: "backOut" }} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Entity Blueprint ─────────────────────────────────────────────────── */
function EntityBlueprint() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const nodes = [
    { x: 220, y: 160, r: 32, label: "ROOT ENTITY",   color: "#8B5CF6", score: "92" },
    { x: 80,  y: 75,  r: 18, label: "Corp A",        color: "#60A5FA", score: "" },
    { x: 80,  y: 245, r: 14, label: "Shell LLC",     color: "#FBBF24", score: "" },
    { x: 360, y: 75,  r: 16, label: "Partner XYZ",   color: "#60A5FA", score: "" },
    { x: 360, y: 245, r: 24, label: "SANCTIONED",    color: "#F87171", score: "99" },
    { x: 220, y: 310, r: 14, label: "Crypto Wallet", color: "#F87171", score: "" },
    { x: 450, y: 160, r: 12, label: "Assoc",         color: "#FBBF24", score: "" },
  ];
  const edges = [
    { x1: 220, y1: 160, x2: 80,  y2: 75,  c: "#60A5FA", d: 0.1 },
    { x1: 220, y1: 160, x2: 80,  y2: 245, c: "#FBBF24", d: 0.18 },
    { x1: 220, y1: 160, x2: 360, y2: 75,  c: "#60A5FA", d: 0.26 },
    { x1: 220, y1: 160, x2: 360, y2: 245, c: "#F87171", d: 0.35, w: 2.5 },
    { x1: 220, y1: 160, x2: 220, y2: 310, c: "#F87171", d: 0.43, w: 2 },
    { x1: 360, y1: 245, x2: 450, y2: 160, c: "#FBBF24", d: 0.52 },
    { x1: 220, y1: 310, x2: 360, y2: 245, c: "#F87171", d: 0.60 },
  ];
  return (
    <div ref={ref} className="relative w-full">
      <svg viewBox="0 0 520 360" className="w-full" style={{ filter: "drop-shadow(0 0 10px rgba(139,92,246,0.15))" }}>
        <defs>
          <radialGradient id="eg-glow" cx="42%" cy="44%" r="50%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.2)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <rect width="520" height="360" fill="url(#eg-glow)" rx="12" />
        {edges.map((e, i) => (
          <motion.line key={i}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={e.c} strokeWidth={e.w || 1.2} opacity={0.65}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 0.65 } : {}}
            transition={{ duration: 0.45, delay: e.d }}
          />
        ))}
        {nodes.map((n, i) => (
          <motion.g key={n.label}
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: i * 0.09, ease: "backOut" }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
            <motion.circle cx={n.x} cy={n.y} r={n.r + 10} fill={`${n.color}08`}
              animate={inView && (n.color === "#F87171" || n.color === "#8B5CF6")
                ? { r: [n.r + 10, n.r + 18, n.r + 10] } : {}}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }} />
            <circle cx={n.x} cy={n.y} r={n.r} fill={`${n.color}18`} stroke={n.color} strokeWidth={n.r > 20 ? 2 : 1.2} />
            {n.score && (
              <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize="11" fontWeight="bold" fontFamily="Geist Mono,monospace">{n.score}</text>
            )}
            <text x={n.x} y={n.y + n.r + 15} textAnchor="middle"
              fill={n.color} fontSize="8.5" fontFamily="Geist Mono,monospace" fontWeight="600">{n.label}</text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

/* ─── Neural Network ────────────────────────────────────────────────────── */
function NeuralNet() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const layerDefs = [
    { x: 60,  count: 3 },
    { x: 185, count: 5 },
    { x: 310, count: 5 },
    { x: 435, count: 4 },
    { x: 545, count: 2 },
  ];
  const colors = ["#8B5CF6", "#A78BFA", "#60A5FA", "#34D399", "#FBBF24"];
  const labels = ["INPUT", "HIDDEN 1", "HIDDEN 2", "OUTPUT", "DECISION"];
  const HEIGHT = 260;
  const layerNodes = layerDefs.map(({ x, count }) =>
    Array.from({ length: count }, (_, i) => ({
      x,
      y: ((HEIGHT) / (count + 1)) * (i + 1) + 20,
    }))
  );
  return (
    <div ref={ref} className="relative w-full">
      <svg viewBox="0 0 610 300" className="w-full" style={{ filter: "drop-shadow(0 0 8px rgba(139,92,246,0.15))" }}>
        {/* Edges */}
        {layerNodes.map((layer, li) =>
          li < layerNodes.length - 1
            ? layer.flatMap((from, fi) =>
              layerNodes[li + 1].map((to, ti) => (
                <motion.line key={`e-${li}-${fi}-${ti}`}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={`${colors[li]}35`} strokeWidth="0.8"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.3, delay: li * 0.12 }}
                />
              ))
            ) : []
        )}
        {/* Nodes */}
        {layerNodes.map((layer, li) =>
          layer.map((n, ni) => (
            <motion.g key={`n-${li}-${ni}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: li * 0.14 + ni * 0.05, ease: "backOut" }}
              style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
              <motion.circle cx={n.x} cy={n.y} r="14" fill={`${colors[li]}18`} stroke={colors[li]} strokeWidth="1.2"
                animate={inView ? { strokeOpacity: [0.5, 1, 0.5] } : {}}
                transition={{ duration: 2.2, delay: li * 0.3 + ni * 0.15, repeat: Infinity }} />
              <circle cx={n.x} cy={n.y} r="4" fill={colors[li]} opacity="0.85" />
            </motion.g>
          ))
        )}
        {/* Signal dots */}
        {inView && layerNodes.slice(0, -1).map((layer, li) =>
          layer.slice(0, 2).map((from, fi) => {
            const to = layerNodes[li + 1][fi % layerNodes[li + 1].length];
            return (
              <motion.circle key={`sig-${li}-${fi}`} r="3" fill={colors[li]} opacity="0.85">
                <animateMotion dur={`${0.55 + li * 0.08}s`} repeatCount="indefinite"
                  begin={`${li * 0.28 + fi * 0.18}s`}
                  path={`M ${from.x} ${from.y} L ${to.x} ${to.y}`} />
              </motion.circle>
            );
          })
        )}
        {/* Labels */}
        {layerDefs.map((l, li) => (
          <motion.text key={li} x={l.x} y="296" textAnchor="middle"
            fill={`${colors[li]}70`} fontSize="7" fontFamily="Geist Mono,monospace"
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: li * 0.14 + 0.5 }}>{labels[li]}</motion.text>
        ))}
      </svg>
    </div>
  );
}

/* ─── Floating pill label ───────────────────────────────────────────────── */
function TourLabel({ children, color = "#8B5CF6" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-widest uppercase font-['Geist_Mono'] border-[0.5px] mb-5"
      style={{ color, background: `${color}12`, borderColor: `${color}30` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
      {children}
    </span>
  );
}

/* ─── Section ────────────────────────────────────────────────────────────── */
function TourSection({ children, id, className = "" }: { children: React.ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`relative min-h-screen flex items-center overflow-hidden ${className}`}>
      {children}
    </section>
  );
}

/* ─── Fade-in wrapper ────────────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, direction = "up", className = "" }: { children: React.ReactNode; delay?: number; direction?: "up" | "left" | "right"; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const initial = direction === "up" ? { opacity: 0, y: 30 } : direction === "left" ? { opacity: 0, x: -30 } : { opacity: 0, x: 30 };
  return (
    <motion.div ref={ref} initial={initial}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : initial}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function ProductTour() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="relative bg-[#05040F] text-white overflow-x-hidden"
      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(139,92,246,0.3) transparent" }}>

      {/* ── Sticky Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(5,4,15,0.88)", backdropFilter: "blur(12px)", borderBottom: "0.5px solid rgba(139,92,246,0.12)" }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)" }}>
            <div className="w-3 h-3 rounded-sm bg-[#8B5CF6]" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">NexusAI</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
          {["AML Intelligence", "Rules Engine", "Entity Network", "Reporting", "Federated AI"].map((item, i) => (
            <a key={i} href={`#s${i + 2}`}
              className="hover:text-[#A78BFA] transition-colors"
              onClick={e => { e.preventDefault(); document.getElementById(`s${i + 2}`)?.scrollIntoView({ behavior: "smooth" }); }}>
              {item}
            </a>
          ))}
        </div>
        <Link href="/dashboard">
          <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)" }}>
            Open Dashboard <ArrowRight className="w-3 h-3" />
          </button>
        </Link>
      </nav>

      {/* ── HERO ── */}
      <TourSection id="s1">
        <ParticleCanvas />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[700px] rounded-full opacity-[0.15]"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.9) 0%, transparent 65%)" }} />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 w-full pt-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <TourLabel>Interactive Product Tour</TourLabel>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="font-['Instrument_Serif'] leading-none mb-6 max-w-5xl"
            style={{
              fontSize: "clamp(3rem,8vw,6.5rem)",
              background: "linear-gradient(135deg, #fff 45%, rgba(167,139,250,0.9) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>
            The AI-Native Compliance OS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
            className="text-lg max-w-xl mb-10 font-['Geist']"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            Scroll through a live assembly of NexusAI's intelligent banking infrastructure — purpose-built for Canadian financial institutions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.65 }}
            className="flex gap-4 flex-wrap justify-center mb-20">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold text-white transition-all hover:scale-105 active:scale-100"
                style={{ background: "linear-gradient(135deg,#7C3AED,#8B5CF6)", boxShadow: "0 0 36px rgba(139,92,246,0.4)" }}>
                <Zap className="w-4 h-4" /> Open Live Dashboard
              </button>
            </Link>
            <button onClick={() => setShowVideo(true)}
              className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold transition-all hover:border-[rgba(139,92,246,0.5)]"
              style={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Play className="w-4 h-4" /> Watch Overview
            </button>
          </motion.div>

          {/* Hero stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.85 }}
            className="grid grid-cols-3 gap-4 max-w-2xl w-full">
            {[
              { val: 94, suffix: "%", label: "Faster alert triage" },
              { val: 10, suffix: "+", label: "AML rule templates" },
              { val: 99, suffix: "%", label: "FINTRAC compliance" },
            ].map((s, i) => (
              <div key={i} className="px-6 py-4 rounded-2xl text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(139,92,246,0.18)" }}>
                <div className="text-3xl font-bold font-['Instrument_Serif'] text-[#A78BFA]">
                  <Counter target={s.val} suffix={s.suffix} />
                </div>
                <div className="text-xs mt-1 font-['Geist']" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div className="mt-14 flex flex-col items-center gap-2"
            style={{ color: "rgba(255,255,255,0.25)" }}
            animate={{ y: [0, 8, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
            <span className="text-[0.62rem] font-['Geist_Mono'] tracking-widest uppercase">Scroll to explore</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </TourSection>

      {/* ── SECTION 2: AML Intelligence ── */}
      <TourSection id="s2" className="py-24">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.6) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-8 w-full grid md:grid-cols-2 gap-16 items-center">
          <div>
            <FadeIn>
              <TourLabel color="#8B5CF6">AML Intelligence</TourLabel>
              <h2 className="font-['Instrument_Serif'] text-[clamp(2rem,4vw,3.2rem)] leading-tight mb-6" style={{ fontSize: "clamp(2rem,4vw,3.2rem)" }}>
                End-to-End Alert Processing Pipeline
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
                Every suspicious transaction enters a multi-stage intelligence pipeline — rules engine, ML scoring, KYC verification, and OFAC screening — all orchestrated in milliseconds before a human analyst ever opens the case.
              </p>
            </FadeIn>
            <div className="grid grid-cols-2 gap-4">
              <StatCard val={48} suffix="ms" label="Avg decision latency" delay={0.1} />
              <StatCard val={6} suffix="%" label="False positive rate" delay={0.2} />
              <StatCard val={24} suffix="/7" label="Continuous monitoring" delay={0.3} />
              <StatCard val={100} suffix="%" label="PCMLTFA coverage" delay={0.4} />
            </div>
          </div>
          <FadeIn direction="right" delay={0.2}>
            <AMLBlueprint />
          </FadeIn>
        </div>
      </TourSection>

      {/* ── SECTION 3: Rules Engine ── */}
      <TourSection id="s3" className="py-24">
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle,#8B5CF6 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(139,92,246,1) 0%,transparent 70%)" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-8 w-full grid md:grid-cols-2 gap-16 items-center">
          <FadeIn direction="left" delay={0.1}>
            <RulesCircuit />
          </FadeIn>
          <div>
            <FadeIn direction="right">
              <TourLabel color="#A78BFA">Rules Engine</TourLabel>
              <h2 className="font-['Instrument_Serif'] leading-tight mb-6" style={{ fontSize: "clamp(2rem,4vw,3.2rem)" }}>
                10 Pre-Built AML Templates, Fully Configurable
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
                From high-velocity transfer detection to PEP name matching and offshore jurisdiction screening — each rule fires in real time with live risk scores, false-positive tracking, and one-click threshold editing.
              </p>
              <div className="space-y-3">
                {[
                  "No-code threshold editor with live preview",
                  "Category filters: AML / Sanctions / Fraud",
                  "Live trigger log with entity context",
                  "Weekly performance chart per rule",
                ].map((f, i) => (
                  <FadeIn key={i} direction="right" delay={0.1 + i * 0.08}>
                    <div className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#8B5CF6]" />
                      {f}
                    </div>
                  </FadeIn>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </TourSection>

      {/* ── SECTION 4: Entity Network ── */}
      <TourSection id="s4" className="py-24">
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "linear-gradient(rgba(96,165,250,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,0.6) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-[0.06] pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(248,113,113,1) 0%,transparent 70%)" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-8 w-full grid md:grid-cols-2 gap-16 items-center">
          <div>
            <FadeIn>
              <TourLabel color="#60A5FA">Entity Network Graph</TourLabel>
              <h2 className="font-['Instrument_Serif'] leading-tight mb-6" style={{ fontSize: "clamp(2rem,4vw,3.2rem)" }}>
                3° Link Analysis Across Entire Networks
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
                NexusAI maps every entity relationship across 12+ node types — subsidiaries, shell companies, crypto wallets, PEP associates, and sanctioned counterparties — surfacing hidden risk invisible to traditional systems.
              </p>
              <div className="flex flex-wrap gap-2">
                {["OFAC SDN Matching", "Shell Company Detection", "Crypto Wallet Tracing", "PEP Network Mapping", "UBO Discovery", "FINTRAC Integration"].map((tag, i) => (
                  <FadeIn key={i} delay={i * 0.07}>
                    <span className="px-3 py-1 rounded-full text-[0.65rem] font-bold font-['Geist_Mono']"
                      style={{ background: "rgba(96,165,250,0.1)", border: "0.5px solid rgba(96,165,250,0.25)", color: "#60A5FA" }}>
                      {tag}
                    </span>
                  </FadeIn>
                ))}
              </div>
            </FadeIn>
          </div>
          <FadeIn direction="right" delay={0.15}>
            <EntityBlueprint />
          </FadeIn>
        </div>
      </TourSection>

      {/* ── SECTION 5: FINTRAC Reporting ── */}
      <TourSection id="s5" className="py-24">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle,rgba(52,211,153,0.8) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-8 w-full grid md:grid-cols-2 gap-16 items-center">
          <div>
            <FadeIn>
              <TourLabel color="#34D399">FINTRAC Reporting</TourLabel>
              <h2 className="font-['Instrument_Serif'] leading-tight mb-6" style={{ fontSize: "clamp(2rem,4vw,3.2rem)" }}>
                AI-Drafted STRs Ready for E-Filing
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
                From alert to acknowledged FINTRAC filing in under 4 hours. NexusAI generates complete Suspicious Transaction Reports with PCMLTFA-compliant XML/JSON, automatic reference tracking, and resubmission handling.
              </p>
            </FadeIn>
            <div className="space-y-4">
              {[
                { label: "Avg time to STR submission", val: "3.8h", sub: "vs 72h manual" },
                { label: "FINTRAC acknowledgement rate", val: "97%", sub: "across all filings" },
                { label: "Rejection auto-correction", val: "Active", sub: "resubmit + correction note" },
              ].map((item, i) => (
                <FadeIn key={i} direction="left" delay={i * 0.12}>
                  <div className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: "rgba(52,211,153,0.06)", border: "0.5px solid rgba(52,211,153,0.18)" }}>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{item.label}</span>
                    <div className="text-right">
                      <div className="text-base font-bold font-['Instrument_Serif']" style={{ color: "#34D399" }}>{item.val}</div>
                      <div className="text-[0.62rem] font-['Geist_Mono']" style={{ color: "rgba(255,255,255,0.3)" }}>{item.sub}</div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
          {/* Animated XML doc */}
          <FadeIn direction="right" delay={0.2}>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#0a0914", border: "0.5px solid rgba(52,211,153,0.2)", boxShadow: "0 0 40px rgba(52,211,153,0.05)" }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "0.5px solid rgba(52,211,153,0.12)" }}>
                <div className="w-2.5 h-2.5 rounded-full bg-[#F87171]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                <span className="text-[0.6rem] font-['Geist_Mono'] ml-2" style={{ color: "rgba(255,255,255,0.3)" }}>STR-2026-0041.xml</span>
              </div>
              <div className="p-5 space-y-0.5">
                {[
                  { t: '<?xml version="1.0"?>',                         c: "rgba(255,255,255,0.28)", d: 0.3 },
                  { t: "<FinancialIntelligenceReport>",                  c: "#A78BFA", d: 0.4 },
                  { t: '  <ReportType>STR</ReportType>',                c: "#34D399", d: 0.5 },
                  { t: "  <FilingInstitution>NexusBank</FilingInstitution>", c: "#60A5FA", d: 0.6 },
                  { t: "  <ReportDate>2026-05-25</ReportDate>",          c: "#60A5FA", d: 0.68 },
                  { t: "  <SuspiciousTransaction>",                      c: "#A78BFA", d: 0.76 },
                  { t: "    <Subject>Global Trade Corp</Subject>",       c: "#34D399", d: 0.82 },
                  { t: "    <ActivityType>Structuring</ActivityType>",   c: "#FBBF24", d: 0.88 },
                  { t: "    <Amount>$4,250,000</Amount>",                c: "#F87171", d: 0.94 },
                  { t: "    <Agency>FINTRAC</Agency>",                   c: "#60A5FA", d: 1.0 },
                  { t: "  </SuspiciousTransaction>",                     c: "#A78BFA", d: 1.06 },
                  { t: "</FinancialIntelligenceReport>",                 c: "#A78BFA", d: 1.12 },
                ].map((l, i) => (
                  <FadeIn key={i} direction="left" delay={l.d}>
                    <div className="text-[0.68rem] font-['Geist_Mono'] leading-relaxed" style={{ color: l.c }}>{l.t}</div>
                  </FadeIn>
                ))}
              </div>
              <div className="px-5 pb-4 flex items-center gap-3">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(52,211,153,0.12)" }}>
                  <motion.div className="h-full bg-[#34D399] rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, delay: 1.4 }} />
                </div>
                <motion.span className="text-[0.6rem] font-bold font-['Geist_Mono'] whitespace-nowrap" style={{ color: "#34D399" }}
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                  transition={{ delay: 2.8 }}>
                  ACKNOWLEDGED
                </motion.span>
              </div>
            </div>
          </FadeIn>
        </div>
      </TourSection>

      {/* ── SECTION 6: Federated AI ── */}
      <TourSection id="s6" className="py-24">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(251,191,36,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(251,191,36,0.5) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-8 w-full grid md:grid-cols-2 gap-16 items-center">
          <FadeIn direction="left" delay={0.1}>
            <NeuralNet />
          </FadeIn>
          <div>
            <FadeIn direction="right">
              <TourLabel color="#FBBF24">Federated AI Learning</TourLabel>
              <h2 className="font-['Instrument_Serif'] leading-tight mb-6" style={{ fontSize: "clamp(2rem,4vw,3.2rem)" }}>
                Shared Intelligence. Zero Data Exposure.
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
                NexusAI's federated learning layer lets every participating institution improve the shared AML model without ever exposing raw customer data. Encrypted gradient updates. Privacy-preserving by design.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Shield, label: "Zero raw data sharing",  color: "#FBBF24" },
                  { icon: Brain,  label: "Gradient encryption",    color: "#A78BFA" },
                  { icon: Network, label: "Multi-bank model",      color: "#60A5FA" },
                  { icon: FileText, label: "PIPEDA compliant",     color: "#34D399" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <FadeIn key={i} delay={i * 0.1}>
                      <div className="flex items-center gap-3 p-4 rounded-xl"
                        style={{ background: `${item.color}08`, border: `0.5px solid ${item.color}20` }}>
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{item.label}</span>
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            </FadeIn>
          </div>
        </div>
      </TourSection>

      {/* ── CTA ── */}
      <TourSection className="py-24">
        <ParticleCanvas className="opacity-35" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[900px] h-[900px] rounded-full opacity-[0.12]"
            style={{ background: "radial-gradient(circle,rgba(139,92,246,0.9) 0%,transparent 65%)" }} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-8 text-center w-full">
          <FadeIn>
            <TourLabel>Ready to Deploy</TourLabel>
            <h2 className="font-['Instrument_Serif'] leading-tight mb-6" style={{ fontSize: "clamp(2.5rem,6vw,5rem)" }}>
              Built for Canada's Financial Institutions
            </h2>
            <p className="text-lg mb-12 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
              From major banks to regional credit unions — NexusAI is the compliance intelligence layer your institution needs for the era of AI-native finance.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/dashboard">
                <button className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#8B5CF6)", boxShadow: "0 0 52px rgba(139,92,246,0.4)" }}>
                  <Zap className="w-4 h-4" /> Launch Dashboard
                </button>
              </Link>
              <Link href="/">
                <button className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition-all hover:border-[rgba(139,92,246,0.5)]"
                  style={{ color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  Back to Home <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-xs font-['Geist_Mono'] uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.28)" }}>
              {["SOC 2 Type II", "ISO 27001", "PCMLTFA", "PIPEDA", "CDBA Phase 1"].map((t, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full" style={{ background: "rgba(139,92,246,0.6)" }} />
                  {t}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </TourSection>

      {/* ── Video Modal ── */}
      {showVideo && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(5,4,15,0.92)", backdropFilter: "blur(12px)" }}
          onClick={() => setShowVideo(false)}>
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-3xl mx-6 rounded-2xl overflow-hidden"
            style={{ background: "#0a0914", border: "0.5px solid rgba(139,92,246,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "0.5px solid rgba(139,92,246,0.15)" }}>
              <span className="text-sm font-bold text-white font-['Instrument_Serif']">NexusAI Platform Overview</span>
              <button onClick={() => setShowVideo(false)} style={{ color: "rgba(255,255,255,0.35)" }} className="hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video flex items-center justify-center" style={{ background: "rgba(139,92,246,0.04)" }}>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)" }}>
                  <Play className="w-7 h-7 text-[#A78BFA]" />
                </div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Platform demo video</p>
                <p className="text-xs mt-1 font-['Geist_Mono']" style={{ color: "rgba(255,255,255,0.2)" }}>Coming soon — book a live demo instead</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
