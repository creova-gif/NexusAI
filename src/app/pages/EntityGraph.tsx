import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Search, Filter, ZoomIn, ZoomOut, Download, Network, Maximize, AlertOctagon, Shield, Eye, ChevronRight } from "lucide-react";

const nodes = [
  { id: "n1", x: 400, y: 280, label: "Global Trade Corp", sublabel: "ROOT NODE", r: 28, type: "root", risk: 92, color: "#A78BFA", glow: "rgba(139,92,246,0.35)" },
  { id: "n2", x: 220, y: 160, label: "Corp A", sublabel: "Subsidiary", r: 18, type: "medium", risk: 61, color: "#60A5FA", glow: "rgba(96,165,250,0.25)" },
  { id: "n3", x: 145, y: 215, label: "Shell LLC", sublabel: "High Risk", r: 14, type: "high", risk: 78, color: "#FBBF24", glow: "rgba(251,191,36,0.25)" },
  { id: "n4", x: 100, y: 310, label: "Phantom Intl", sublabel: "Unverified", r: 12, type: "medium", risk: 55, color: "#60A5FA", glow: "rgba(96,165,250,0.2)" },
  { id: "n5", x: 560, y: 165, label: "Partner XYZ", sublabel: "Associated", r: 20, type: "medium", risk: 44, color: "#60A5FA", glow: "rgba(96,165,250,0.2)" },
  { id: "n6", x: 660, y: 100, label: "Trade Fin. Ltd", sublabel: "Related", r: 13, type: "medium", risk: 39, color: "#60A5FA", glow: "rgba(96,165,250,0.15)" },
  { id: "n7", x: 290, y: 430, label: "Trust Acct #CA", sublabel: "Custodian", r: 18, type: "medium", risk: 67, color: "#FBBF24", glow: "rgba(251,191,36,0.2)" },
  { id: "n8", x: 580, y: 400, label: "Sanctioned Entity", sublabel: "OFAC MATCH", r: 22, type: "critical", risk: 99, color: "#F87171", glow: "rgba(248,113,113,0.4)" },
  { id: "n9", x: 695, y: 360, label: "Assoc 1", sublabel: "PEP Linked", r: 12, type: "high", risk: 82, color: "#F87171", glow: "rgba(248,113,113,0.25)" },
  { id: "n10", x: 670, y: 455, label: "Assoc 2", sublabel: "Unverified", r: 10, type: "medium", risk: 51, color: "#FBBF24", glow: "rgba(251,191,36,0.15)" },
  { id: "n11", x: 200, y: 370, label: "Crypto Wallet", sublabel: "BTC · Unknown", r: 15, type: "high", risk: 88, color: "#F87171", glow: "rgba(248,113,113,0.3)" },
  { id: "n12", x: 500, y: 300, label: "Exchange Acct", sublabel: "CAD→USD→BTC", r: 14, type: "high", risk: 71, color: "#FBBF24", glow: "rgba(251,191,36,0.25)" },
];

const edges = [
  { from: "n1", to: "n2", type: "normal" },
  { from: "n1", to: "n5", type: "normal" },
  { from: "n1", to: "n7", type: "suspicious" },
  { from: "n1", to: "n8", type: "critical" },
  { from: "n1", to: "n12", type: "suspicious" },
  { from: "n2", to: "n3", type: "normal" },
  { from: "n3", to: "n4", type: "normal" },
  { from: "n5", to: "n6", type: "normal" },
  { from: "n8", to: "n9", type: "critical" },
  { from: "n8", to: "n10", type: "suspicious" },
  { from: "n7", to: "n11", type: "critical" },
  { from: "n11", to: "n1", type: "suspicious" },
  { from: "n12", to: "n8", type: "suspicious" },
];

const getNodePos = (id: string) => nodes.find(n => n.id === id)!;

const edgeStyle = (type: string) => {
  switch (type) {
    case "critical":    return { stroke: "#F87171", dasharray: "none", width: 2 };
    case "suspicious":  return { stroke: "rgba(251,191,36,0.7)", dasharray: "5 3", width: 1.5 };
    default:            return { stroke: "rgba(167,139,250,0.25)", dasharray: "4 4", width: 1 };
  }
};

const analysisItems = [
  { entity: "Sanctioned Entity", id: "ENT-884-991", match: "OFAC SDN", pct: "99%", volume: "$4.25M", degree: "1st" },
  { entity: "Crypto Wallet", id: "BTC-3xf9...a1c2", match: "Unknown Origin", pct: "88%", volume: "$1.2M", degree: "2nd" },
  { entity: "Shell LLC", id: "ENT-234-776", match: "No Employees", pct: "78%", volume: "$820K", degree: "2nd" },
  { entity: "Assoc 1", id: "IND-991-004", match: "PEP Database", pct: "82%", volume: "$340K", degree: "2nd" },
];

export default function EntityGraph() {
  const [selectedNode, setSelectedNode] = useState<typeof nodes[0] | null>(nodes[7]);
  const [filter, setFilter] = useState("ALL");

  const riskColor = (risk: number) =>
    risk >= 90 ? "#F87171" : risk >= 70 ? "#FBBF24" : risk >= 50 ? "#A78BFA" : "#60A5FA";

  return (
    <DashboardLayout pageTitle="Entity Network Graph" breadcrumb="Link Analysis">
      <div className="flex flex-col h-[calc(100vh-120px)] gap-4">

        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--glass2)] border-[0.5px] border-[var(--border)] p-3.5 rounded-xl">
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 rounded-lg bg-[rgba(168,85,247,.15)] flex items-center justify-center border-[0.5px] border-[rgba(168,85,247,.3)]">
              <Network className="w-4.5 h-4.5 text-[var(--brand-hi)]" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm font-['Instrument_Serif']">Global Trade Corp — Network Map</h3>
              <p className="text-[0.65rem] text-[var(--text-purple-3)] font-['Geist_Mono']">3° separation · {nodes.length} nodes · {edges.length} edges · 3 critical paths</p>
            </div>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex gap-1 bg-[var(--glass)] border-[0.5px] border-[var(--border)] rounded-lg p-0.5">
              {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 text-[0.6rem] font-bold rounded-md transition-all font-['Geist_Mono'] ${filter === f ? "bg-[var(--brand)] text-white" : "text-[var(--text-purple-2)] hover:text-[var(--text-purple)]"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative hidden md:block w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-purple-3)]" />
              <input
                type="text"
                placeholder="Find node or connection..."
                className="w-full bg-[var(--bg1)] border-[0.5px] border-[var(--border)] rounded-md pl-9 pr-4 py-1.5 text-xs text-[var(--text-purple)] placeholder:text-[var(--text-purple-3)] outline-none focus:border-[var(--border-purple)]"
              />
            </div>
            <Button size="sm" className="gradient-purple text-white border-none text-xs h-8 gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export Map
            </Button>
          </div>
        </div>

        {/* Graph Area */}
        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">

          {/* Main Graph */}
          <Card className="flex-1 glass border-[0.5px] border-[var(--border)] relative overflow-hidden bg-[#050508]">
            {/* Grid pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(139,92,246,1)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Absolute Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
              <Button size="icon" variant="outline" className="w-7 h-7 glass border-[var(--border)] text-[var(--text-purple-2)]"><ZoomIn className="w-3.5 h-3.5" /></Button>
              <Button size="icon" variant="outline" className="w-7 h-7 glass border-[var(--border)] text-[var(--text-purple-2)]"><ZoomOut className="w-3.5 h-3.5" /></Button>
              <Button size="icon" variant="outline" className="w-7 h-7 glass border-[var(--border)] text-[var(--text-purple-2)]"><Maximize className="w-3.5 h-3.5" /></Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 bg-[rgba(5,4,15,0.85)] border-[0.5px] border-[var(--border)] rounded-lg px-3 py-2.5">
              {[
                { color: "#F87171", label: "Critical / OFAC Match" },
                { color: "#FBBF24", label: "High Risk / Suspicious" },
                { color: "#A78BFA", label: "Root Entity" },
                { color: "#60A5FA", label: "Associated Entity" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
                  <span className="text-[0.6rem] text-[var(--text-purple-2)] font-['Geist_Mono']">{l.label}</span>
                </div>
              ))}
              <div className="border-t-[0.5px] border-[var(--border)] mt-1 pt-1.5 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-0.5" style={{ background: "#F87171" }} />
                  <span className="text-[0.6rem] text-[var(--text-purple-2)] font-['Geist_Mono']">Critical path</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5" style={{ borderTop: "1.5px dashed rgba(251,191,36,0.7)" }} />
                  <span className="text-[0.6rem] text-[var(--text-purple-2)] font-['Geist_Mono']">Suspicious link</span>
                </div>
              </div>
            </div>

            {/* Graph SVG */}
            <svg viewBox="0 0 800 580" className="w-full h-full absolute inset-0" preserveAspectRatio="xMidYMid meet">
              <defs>
                {nodes.map(n => (
                  <radialGradient key={n.id} id={`glow-${n.id}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={n.glow} />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </radialGradient>
                ))}
              </defs>

              {/* Glow halos */}
              {nodes.filter(n => n.type === "critical" || n.type === "root").map(n => (
                <circle key={`halo-${n.id}`} cx={n.x} cy={n.y} r={n.r * 2.5} fill={`url(#glow-${n.id})`} />
              ))}

              {/* Edges */}
              {edges.map((e, i) => {
                const from = getNodePos(e.from);
                const to = getNodePos(e.to);
                const style = edgeStyle(e.type);
                return (
                  <line
                    key={i}
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke={style.stroke}
                    strokeWidth={style.width}
                    strokeDasharray={style.dasharray}
                    opacity={0.85}
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map(n => (
                <g
                  key={n.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedNode(n)}
                  style={{ opacity: selectedNode?.id === n.id ? 1 : 0.88 }}
                >
                  {/* Selection ring */}
                  {selectedNode?.id === n.id && (
                    <circle cx={n.x} cy={n.y} r={n.r + 6} fill="none" stroke={n.color} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
                  )}
                  {/* Node body */}
                  <circle
                    cx={n.x} cy={n.y} r={n.r}
                    fill={`${n.color}18`}
                    stroke={n.color}
                    strokeWidth={n.type === "critical" ? 2 : n.type === "root" ? 2 : 1}
                    opacity="1"
                  />
                  {/* Risk score inside large nodes */}
                  {n.r >= 18 && (
                    <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={n.r > 22 ? "11" : "9"} fontWeight="bold" fontFamily="Geist Mono, monospace">
                      {n.risk}
                    </text>
                  )}
                  {/* Label below */}
                  <text x={n.x} y={n.y + n.r + 13} textAnchor="middle" fill={n.color} fontSize="9.5" fontWeight="600" fontFamily="Geist, sans-serif">
                    {n.label}
                  </text>
                  <text x={n.x} y={n.y + n.r + 24} textAnchor="middle" fill="rgba(167,139,250,0.45)" fontSize="7.5" fontFamily="Geist Mono, monospace">
                    {n.sublabel}
                  </text>
                </g>
              ))}

              {/* Transaction amount label on critical edge */}
              <rect x="470" y="325" width="58" height="18" rx="4" fill="rgba(248,113,113,0.2)" stroke="#F87171" strokeWidth="0.5" />
              <text x="499" y="337" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="bold" fontFamily="Geist Mono, monospace">$4.25M</text>

              <rect x="295" y="345" width="52" height="18" rx="4" fill="rgba(251,191,36,0.2)" stroke="#FBBF24" strokeWidth="0.5" />
              <text x="321" y="357" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="bold" fontFamily="Geist Mono, monospace">$820K</text>
            </svg>
          </Card>

          {/* Right Panel */}
          <div className="hidden lg:flex w-[280px] flex-shrink-0 flex-col gap-3">
            {/* Node Detail */}
            {selectedNode && (
              <Card className="glass border-[0.5px] flex flex-col overflow-hidden" style={{ borderColor: `${selectedNode.color}40` }}>
                <div className="px-4 py-3 border-b-[0.5px] border-[var(--border)] bg-[var(--glass2)] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-['Geist_Mono']">Node Details</h3>
                  <Eye className="w-3.5 h-3.5" style={{ color: selectedNode.color }} />
                </div>
                <div className="p-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-lg font-bold" style={{ background: `${selectedNode.color}18`, border: `1px solid ${selectedNode.color}40`, color: selectedNode.color }}>
                    {selectedNode.risk}
                  </div>
                  <h4 className="text-base font-bold text-white font-['Instrument_Serif'] mb-0.5">{selectedNode.label}</h4>
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider mb-4" style={{ color: selectedNode.color }}>{selectedNode.sublabel}</p>

                  <div className="space-y-3 text-xs">
                    {[
                      { label: "Risk Score", val: `${selectedNode.risk}/100`, color: riskColor(selectedNode.risk) },
                      { label: "Node Type", val: selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1), color: "var(--text-purple)" },
                      { label: "Degree", val: selectedNode.type === "root" ? "Root" : edges.filter(e => e.from === selectedNode.id || e.to === selectedNode.id).length + " connections", color: "var(--text-purple)" },
                    ].map(r => (
                      <div key={r.label}>
                        <div className="text-[var(--text-purple-3)] mb-0.5">{r.label}</div>
                        <div className="font-semibold" style={{ color: r.color }}>{r.val}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t-[0.5px] border-[var(--border)]">
                    <div className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--text-purple-3)] font-['Geist_Mono'] mb-2">Risk Breakdown</div>
                    <div className="h-2 rounded-full overflow-hidden bg-[var(--glass3)] mb-1">
                      <div className="h-full rounded-full" style={{ width: `${selectedNode.risk}%`, background: riskColor(selectedNode.risk) }} />
                    </div>
                    <div className="flex justify-between text-[0.58rem] font-['Geist_Mono']">
                      <span className="text-[var(--text-purple-3)]">0</span>
                      <span style={{ color: riskColor(selectedNode.risk) }}>{selectedNode.risk}</span>
                      <span className="text-[var(--text-purple-3)]">100</span>
                    </div>
                  </div>

                  <Button className="w-full mt-4 gradient-purple text-white border-none text-xs h-8 gap-1.5">
                    Add to Case File <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Flagged Entities */}
            <Card className="glass border-[0.5px] border-[var(--border)] flex-1 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b-[0.5px] border-[var(--border)] flex items-center gap-2">
                <AlertOctagon className="w-3.5 h-3.5 text-[var(--coral)]" />
                <h3 className="text-[0.68rem] font-bold text-[var(--text-purple-2)] uppercase tracking-wider font-['Geist_Mono']">Flagged in Network</h3>
              </div>
              <div className="flex-1 overflow-y-auto divide-y-[0.5px] divide-[var(--border)]">
                {analysisItems.map((item, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 hover:bg-[var(--glass)] transition-colors cursor-pointer"
                    onClick={() => {
                      const n = nodes.find(n => n.label === item.entity);
                      if (n) setSelectedNode(n);
                    }}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white">{item.entity}</span>
                      <span className="text-[0.62rem] font-bold text-[var(--coral)] font-['Geist_Mono']">{item.pct}</span>
                    </div>
                    <div className="text-[0.6rem] text-[var(--text-purple-3)] font-['Geist_Mono'] mb-1">{item.id}</div>
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded text-[0.58rem] font-bold bg-[rgba(248,113,113,.12)] text-[var(--coral)] border-[0.5px] border-[rgba(248,113,113,.3)] font-['Geist_Mono']">{item.match}</span>
                      <span className="text-[0.62rem] text-[var(--brand-hi)] font-['Geist_Mono'] font-bold">{item.volume}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t-[0.5px] border-[var(--border)]">
                <Button size="sm" className="w-full gradient-purple text-white border-none text-xs h-7 gap-1.5">
                  <Shield className="w-3 h-3" /> Escalate All to SAR
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
