import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Sliders, Search, Zap, Shield, AlertOctagon, TrendingUp, Activity, Clock, ChevronRight, Filter } from "lucide-react";

const allRules = [
  { id: "R-1001", name: "High Velocity Transfers", category: "AML", riskLevel: "high", enabled: true, description: "Flags accounts sending more than 5 transfers over $10,000 within a 24-hour period.", triggeredToday: 12, triggeredWeek: 84, falsePositiveRate: 6.2, lastTriggered: "4m ago", threshold: "$10,000 × 5 in 24h" },
  { id: "R-1002", name: "PEP Name Match", category: "Sanctions", riskLevel: "critical", enabled: true, description: "Flags transactions involving names matching politically exposed persons (PEP) lists with ≥85% confidence.", triggeredToday: 3, triggeredWeek: 17, falsePositiveRate: 2.1, lastTriggered: "22m ago", threshold: "85% name similarity" },
  { id: "R-1003", name: "Structuring Anomalies", category: "AML", riskLevel: "medium", enabled: true, description: "Identifies multiple deposits just under the $10,000 PCMLTFA reporting threshold — classic smurfing pattern.", triggeredToday: 8, triggeredWeek: 61, falsePositiveRate: 9.4, lastTriggered: "1h ago", threshold: "$9,000–$9,999 × 3" },
  { id: "R-1004", name: "New Device Login Spike", category: "Fraud", riskLevel: "low", enabled: false, description: "Alerts when a user logs in from more than 3 unknown devices in a rolling 7-day window.", triggeredToday: 0, triggeredWeek: 29, falsePositiveRate: 18.3, lastTriggered: "disabled", threshold: "3+ new devices / 7d" },
  { id: "R-1005", name: "Crypto Exchange Velocity", category: "AML", riskLevel: "high", enabled: true, description: "Monitors rapid fund movement to and from known cryptocurrency exchanges within 48 hours of origination.", triggeredToday: 7, triggeredWeek: 49, falsePositiveRate: 7.8, lastTriggered: "12m ago", threshold: ">3 crypto txns in 48h" },
  { id: "R-1006", name: "Round-Dollar Transfers", category: "AML", riskLevel: "medium", enabled: true, description: "Flags repetitive transfers of exactly round dollar amounts (e.g. $5,000.00) which are statistically anomalous for retail banking.", triggeredToday: 5, triggeredWeek: 38, falsePositiveRate: 14.7, lastTriggered: "2h ago", threshold: "Exactly $X,000.00 × 4" },
  { id: "R-1007", name: "Offshore Jurisdiction Wire", category: "AML", riskLevel: "high", enabled: true, description: "Detects international wire transfers to FATF grey-list or high-risk jurisdictions (e.g. Cayman Islands, Panama).", triggeredToday: 4, triggeredWeek: 22, falsePositiveRate: 11.3, lastTriggered: "45m ago", threshold: "Wire to grey-list country" },
  { id: "R-1008", name: "Shell Company Pattern", category: "AML", riskLevel: "critical", enabled: true, description: "Identifies entity clusters consistent with shell company usage: no employees, brief operating history, cross-entity fund cycling.", triggeredToday: 2, triggeredWeek: 9, falsePositiveRate: 3.8, lastTriggered: "3h ago", threshold: "3-node fund loop detected" },
  { id: "R-1009", name: "Dormant Account Reactivation", category: "Fraud", riskLevel: "medium", enabled: true, description: "Flags accounts inactive for 90+ days that suddenly initiate large transfers, often indicative of account takeover.", triggeredToday: 1, triggeredWeek: 14, falsePositiveRate: 21.0, lastTriggered: "5h ago", threshold: "90d inactive + >$5K txn" },
  { id: "R-1010", name: "Adverse Media Entity Match", category: "Sanctions", riskLevel: "high", enabled: true, description: "Cross-references transaction counterparties against real-time adverse media feeds covering crime, fraud, and corruption allegations.", triggeredToday: 6, triggeredWeek: 41, falsePositiveRate: 8.6, lastTriggered: "18m ago", threshold: "Media match ≥70% conf." },
];

const recentTriggers = [
  { ruleId: "R-1001", ruleName: "High Velocity Transfers", entity: "Acct #CA-4471", score: 97, time: "4m ago", status: "escalated" },
  { ruleId: "R-1010", ruleName: "Adverse Media Entity Match", entity: "Global Trade Corp", score: 88, time: "18m ago", status: "reviewing" },
  { ruleId: "R-1002", ruleName: "PEP Name Match", entity: "Viktor Sokolov", score: 94, time: "22m ago", status: "escalated" },
  { ruleId: "R-1005", ruleName: "Crypto Exchange Velocity", entity: "Acct #CA-7722", score: 74, time: "12m ago", status: "open" },
  { ruleId: "R-1007", ruleName: "Offshore Jurisdiction Wire", entity: "Blue Horizon Finance", score: 81, time: "45m ago", status: "reviewing" },
  { ruleId: "R-1003", ruleName: "Structuring Anomalies", entity: "Acct #CA-3391", score: 68, time: "1h ago", status: "open" },
];

const categories = ["ALL", "AML", "Sanctions", "Fraud"];

const getRiskBadge = (level: string) => {
  switch (level) {
    case "critical": return { cls: "bg-[rgba(248,113,113,.12)] text-[var(--coral)] border-[rgba(248,113,113,.3)]", dot: "var(--coral)" };
    case "high":     return { cls: "bg-[rgba(251,191,36,.12)] text-[var(--amber)] border-[rgba(251,191,36,.3)]", dot: "var(--amber)" };
    case "medium":   return { cls: "bg-[var(--brand-glow)] text-[var(--brand-hi)] border-[var(--border-purple)]", dot: "var(--brand-hi)" };
    default:         return { cls: "bg-[rgba(52,211,153,.10)] text-[var(--teal)] border-[rgba(52,211,153,.28)]", dot: "var(--teal)" };
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "escalated": return "bg-[rgba(248,113,113,.12)] text-[var(--coral)] border-[rgba(248,113,113,.3)]";
    case "reviewing": return "bg-[rgba(251,191,36,.12)] text-[var(--amber)] border-[rgba(251,191,36,.3)]";
    default:          return "bg-[var(--brand-glow)] text-[var(--brand-hi)] border-[var(--border-purple)]";
  }
};

export default function RulesEngine() {
  const [rules, setRules] = useState(allRules);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [selected, setSelected] = useState<typeof allRules[0] | null>(allRules[0]);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const filtered = rules.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "ALL" || r.category === category;
    return matchSearch && matchCat;
  });

  const totalTriggeredToday = rules.filter(r => r.enabled).reduce((sum, r) => sum + r.triggeredToday, 0);
  const activeRules = rules.filter(r => r.enabled).length;
  const avgFP = (rules.filter(r => r.enabled).reduce((sum, r) => sum + r.falsePositiveRate, 0) / activeRules).toFixed(1);

  const rb = selected ? getRiskBadge(selected.riskLevel) : null;

  return (
    <DashboardLayout pageTitle="Rules Engine" breadcrumb="Configuration">
      <div className="flex flex-col gap-4">

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Rules", value: rules.length.toString(), color: "var(--brand-hi)", icon: Shield },
            { label: "Active Rules", value: activeRules.toString(), color: "var(--teal)", icon: Zap },
            { label: "Triggered Today", value: totalTriggeredToday.toString(), color: "var(--amber)", icon: Activity },
            { label: "Avg False Positive", value: `${avgFP}%`, color: "var(--sky)", icon: TrendingUp },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="glass-2 border-[0.5px] border-[var(--border)] p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }} />
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-3.5 h-3.5 opacity-60" style={{ color: stat.color }} />
                  <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--text-purple-3)] font-['Geist_Mono']">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold font-['Instrument_Serif']" style={{ color: stat.color }}>{stat.value}</div>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-4 flex-1">
          {/* Left: Rules List */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-purple-3)]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search rules, typologies..."
                  className="w-full bg-[var(--glass)] border-[0.5px] border-[var(--border)] rounded-lg pl-9 pr-4 py-2 text-xs text-[var(--text-purple)] placeholder:text-[var(--text-purple-3)] outline-none focus:border-[var(--border-purple)]"
                />
              </div>
              <div className="flex gap-1 bg-[var(--glass)] border-[0.5px] border-[var(--border)] rounded-lg p-0.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 text-[0.62rem] font-bold rounded-md transition-all font-['Geist_Mono'] ${category === cat ? "bg-[var(--brand)] text-white" : "text-[var(--text-purple-2)] hover:text-[var(--text-purple)]"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <Button className="gradient-purple text-white border-none ml-auto text-xs h-8 gap-1.5">
                + Create Custom Rule
              </Button>
            </div>

            {/* Rules Table */}
            <Card className="glass border-[0.5px] border-[var(--border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-[0.5px] border-[var(--border)] bg-[var(--glass2)]">
                      {["Rule", "Category", "Risk", "Triggered Today", "FP Rate", "Last Triggered", "Status"].map(h => (
                        <th key={h} className="px-4 py-3 text-[0.58rem] font-bold text-[var(--text-purple-3)] uppercase tracking-wider font-['Geist_Mono']">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y-[0.5px] divide-[var(--border)]">
                    {filtered.map(rule => {
                      const badge = getRiskBadge(rule.riskLevel);
                      return (
                        <tr
                          key={rule.id}
                          onClick={() => setSelected(rule)}
                          className={`cursor-pointer transition-colors ${selected?.id === rule.id ? "bg-[var(--glass2)]" : "hover:bg-[rgba(255,255,255,0.02)]"}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: rule.enabled ? badge.dot : "var(--text-purple-3)" }} />
                              <div>
                                <div className="text-xs font-semibold text-white">{rule.name}</div>
                                <div className="text-[0.6rem] text-[var(--text-purple-3)] font-['Geist_Mono']">{rule.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-[rgba(168,85,247,.1)] border border-[rgba(168,85,247,.2)] text-[var(--brand-hi)] uppercase font-['Geist_Mono']">
                              {rule.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[0.58rem] font-bold border-[0.5px] font-['Geist_Mono'] capitalize ${badge.cls}`}>{rule.riskLevel}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold font-['Instrument_Serif']" style={{ color: rule.triggeredToday > 5 ? "var(--amber)" : "var(--text-purple)" }}>{rule.enabled ? rule.triggeredToday : "—"}</span>
                              {rule.enabled && rule.triggeredToday > 8 && <Activity className="w-3 h-3 text-[var(--amber)]" />}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-['Geist_Mono']" style={{ color: rule.falsePositiveRate > 15 ? "var(--coral)" : "var(--teal)" }}>{rule.enabled ? `${rule.falsePositiveRate}%` : "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-[0.65rem] text-[var(--text-purple-3)]">
                              <Clock className="w-3 h-3" />
                              {rule.lastTriggered}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={() => toggleRule(rule.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Recent Triggers Log */}
            <Card className="glass border-[0.5px] border-[var(--border)] overflow-hidden">
              <div className="px-5 py-3 border-b-[0.5px] border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2 font-['Geist_Mono'] text-[0.7rem] font-bold tracking-wider uppercase text-[var(--text-purple-2)]">
                  <Activity className="w-3.5 h-3.5 text-[var(--amber)]" /> Recent Trigger Log
                </div>
                <span className="text-[0.6rem] text-[var(--text-purple-3)] font-['Geist_Mono']">Last 6 events · live</span>
              </div>
              <div className="divide-y-[0.5px] divide-[var(--border)]">
                {recentTriggers.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--glass)] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[var(--brand-hi)]" style={{ boxShadow: "0 0 0 3px rgba(139,92,246,.15)" }} />
                    <span className="text-[0.62rem] text-[var(--text-purple-3)] font-['Geist_Mono'] w-16 flex-shrink-0">{t.ruleId}</span>
                    <span className="text-xs text-[var(--text-purple)] font-semibold flex-1 truncate">{t.entity}</span>
                    <span className="text-[0.62rem] text-[var(--text-purple-3)] flex-shrink-0">{t.ruleName}</span>
                    <span className="text-xs font-bold font-['Geist_Mono'] flex-shrink-0" style={{ color: t.score >= 90 ? "var(--coral)" : t.score >= 75 ? "var(--amber)" : "var(--brand-hi)" }}>{t.score}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[0.57rem] font-bold border-[0.5px] font-['Geist_Mono'] flex-shrink-0 ${getStatusStyle(t.status)}`}>{t.status.toUpperCase()}</span>
                    <span className="text-[0.6rem] text-[var(--text-purple-3)] flex-shrink-0">{t.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Rule Detail */}
          {selected && (
            <div className="w-[300px] flex-shrink-0 flex flex-col gap-3">
              <Card className="glass-2 border-[0.5px] border-[var(--border-purple)] overflow-hidden">
                <div className="px-5 py-4 border-b-[0.5px] border-[var(--border)] bg-[var(--brand-glow)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[0.6rem] font-bold font-['Geist_Mono'] text-[var(--text-purple-3)] uppercase tracking-wider">{selected.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[0.58rem] font-bold border-[0.5px] font-['Geist_Mono'] capitalize ${rb?.cls}`}>{selected.riskLevel}</span>
                  </div>
                  <h3 className="text-base font-bold text-white font-['Instrument_Serif']">{selected.name}</h3>
                  <p className="text-xs text-[var(--text-purple-2)] mt-1 leading-relaxed">{selected.description}</p>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <div className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--text-purple-3)] font-['Geist_Mono'] mb-1">Threshold</div>
                    <div className="text-xs font-semibold text-[var(--brand-hi)] font-['Geist_Mono']">{selected.threshold}</div>
                  </div>
                  <div>
                    <div className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--text-purple-3)] font-['Geist_Mono'] mb-1">Category</div>
                    <div className="text-xs font-semibold text-white">{selected.category}</div>
                  </div>

                  <div className="border-t-[0.5px] border-[var(--border)] pt-3 space-y-2.5">
                    {[
                      { label: "Triggered Today", val: selected.enabled ? selected.triggeredToday : "—", color: selected.triggeredToday > 8 ? "var(--amber)" : "var(--teal)" },
                      { label: "Triggered This Week", val: selected.enabled ? selected.triggeredWeek : "—", color: "var(--brand-hi)" },
                      { label: "False Positive Rate", val: selected.enabled ? `${selected.falsePositiveRate}%` : "—", color: selected.falsePositiveRate > 15 ? "var(--coral)" : "var(--teal)" },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-[0.65rem] text-[var(--text-purple-2)]">{row.label}</span>
                        <span className="text-sm font-bold font-['Instrument_Serif']" style={{ color: row.color }}>{row.val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-[0.5px] border-[var(--border)] pt-3">
                    <div className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--text-purple-3)] font-['Geist_Mono'] mb-2">Weekly Trigger Volume</div>
                    <div className="flex items-end gap-0.5 h-12">
                      {[3, 8, 5, 12, 9, selected.triggeredWeek > 10 ? 14 : 7, selected.triggeredToday].map((v, i) => {
                        const max = Math.max(3, 8, 5, 12, 9, 14, selected.triggeredToday);
                        return (
                          <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${(v / max) * 100}%`, background: i === 6 ? "var(--amber)" : "rgba(139,92,246,.35)" }} />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1 text-[0.55rem] text-[var(--text-purple-3)] font-['Geist_Mono']">
                      {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => <span key={d}>{d}</span>)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-[var(--text-purple-2)]">{selected.enabled ? "Rule is active" : "Rule is disabled"}</span>
                    <Switch checked={selected.enabled} onCheckedChange={() => { toggleRule(selected.id); setSelected({ ...selected, enabled: !selected.enabled }); }} />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 glass border-[var(--border)] text-[var(--text-purple-2)] text-xs h-7">
                      <Sliders className="w-3 h-3 mr-1" /> Edit Threshold
                    </Button>
                    <Button size="sm" className="flex-1 gradient-purple text-white border-none text-xs h-7 gap-1">
                      View Triggers <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
