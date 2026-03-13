import { useState, useEffect } from "react";

// ========== MOCK DATA ==========
const MOCK_PROJECTS = [
  { id: "PRJ-I", name: "量化交易策略 v2", status: "executing", urgency: "urgens", pipeline: "senate", step: 5, progress: 65, agents: 8, startedAt: "III.Kal.Mar" },
  { id: "PRJ-II", name: "品牌官网重构", status: "deliberating", urgency: "ordinaria", pipeline: "senate", step: 2, progress: 30, agents: 5, startedAt: "Prid.Id.Mar" },
  { id: "PRJ-III", name: "风控系统升级", status: "executing", urgency: "maxima", pipeline: "praetorian", step: 5, progress: 42, agents: 4, startedAt: "a.d.V.Kal.Mar" },
  { id: "PRJ-IV", name: "用户增长实验", status: "completed", urgency: "ordinaria", pipeline: "senate", step: 6, progress: 100, agents: 0, startedAt: "Kal.Feb" },
];

const MOCK_AGENTS = [
  { id: "consul", name: "Consul", latin: "执政官", lifecycle: "always", status: "running", health: 98, uptime: "47d 12h", lastAction: "分配议题 PRJ-II" },
  { id: "annalist", name: "Annalist", latin: "史官", lifecycle: "always", status: "running", health: 100, uptime: "47d 12h", lastAction: "归档 SC-041" },
  { id: "quaestor", name: "Quaestor", latin: "财务官", lifecycle: "always", status: "running", health: 95, uptime: "47d 12h", lastAction: "月度报表生成" },
  { id: "curator", name: "Curator", latin: "水道官", lifecycle: "always", status: "running", health: 99, uptime: "47d 12h", lastAction: "API 健康检查" },
  { id: "explorator", name: "Explorator", latin: "探路者", lifecycle: "always", status: "running", health: 92, uptime: "47d 12h", lastAction: "3条新情报" },
  { id: "tribune", name: "Tribune", latin: "护民官", lifecycle: "always", status: "sleeping", health: 88, uptime: "47d 12h", lastAction: "舆情扫描完成" },
  { id: "cs-a-strat", name: "Strategus", latin: "谋略官·CS-α", lifecycle: "persistent", status: "running", health: 96, uptime: "12d 8h", lastAction: "策略修正 v3" },
  { id: "cs-a-custos", name: "Custos", latin: "守卫官·CS-α", lifecycle: "persistent", status: "running", health: 94, uptime: "12d 8h", lastAction: "边界检查通过" },
  { id: "cs-a-exec", name: "Executor", latin: "执行官·CS-α", lifecycle: "persistent", status: "running", health: 91, uptime: "12d 8h", lastAction: "核心模块部署" },
  { id: "cs-a-tab", name: "Tabularius", latin: "记录官·CS-α", lifecycle: "persistent", status: "running", health: 97, uptime: "12d 8h", lastAction: "数据同步完成" },
];

const MOCK_TASKS = [
  { id: "LEG-CXXVII", name: "API 端点开发", status: "executing", agent: "Miles I", project: "PRJ-I", progress: 78 },
  { id: "LEG-CXXVIII", name: "前端组件重构", status: "executing", agent: "Miles II", project: "PRJ-II", progress: 45 },
  { id: "LEG-CXXIX", name: "数据库迁移脚本", status: "pending", agent: null, project: "PRJ-I", progress: 0 },
  { id: "LEG-CXXX", name: "单元测试编写", status: "executing", agent: "Miles III", project: "PRJ-I", progress: 60 },
  { id: "LEG-CXXXI", name: "UI 设计稿评审", status: "reviewing", agent: null, project: "PRJ-II", progress: 90 },
  { id: "LEG-CXXXII", name: "性能压测报告", status: "completed", agent: null, project: "PRJ-I", progress: 100 },
  { id: "LEG-CXXXIII", name: "合规文档整理", status: "pending", agent: null, project: "PRJ-III", progress: 0 },
];

const MOCK_TIMELINE = [
  { time: "Hora IX", type: "edictum", icon: "🏛", color: "#C9A84C", title: "Caesar：启动品牌官网重构", detail: "PRJ-II" },
  { time: "Hora VIII", type: "consultum", icon: "📜", color: "#E85D75", title: "Senatus Consultum SC-042 通过", detail: "量化交易策略方案 v2" },
  { time: "Hora VII", type: "conscriptio", icon: "⚔️", color: "#8B5CF6", title: "征召 3 名军团兵执行 PRJ-I", detail: "Miles I, II, III" },
  { time: "Hora VI", type: "praetorian", icon: "🛡️", color: "#EF4444", title: "CS-α 完成风控模型迭代", detail: "PRJ-III 进度更新 42%" },
  { time: "Hora V", type: "nuntius", icon: "🔍", color: "#F59E0B", title: "Explorator：发现竞品新动向", detail: "3条高优情报待阅" },
  { time: "Hora IV", type: "missio", icon: "🏠", color: "#6B7280", title: "Miles IV 完成任务并退役", detail: "LEG-CXXXII 性能压测报告" },
  { time: "Hora III", type: "system", icon: "🌐", color: "#10B981", title: "Curator：系统健康检查通过", detail: "所有 API 正常，延迟 23ms" },
];

const URGENCY = { ordinaria: { label: "Ordinaria", color: "#10B981" }, urgens: { label: "Urgens", color: "#F59E0B" }, maxima: { label: "Maxima!", color: "#EF4444" } };
const STATUS_LABELS = { deliberating: "议事中", executing: "执行中", completed: "已完成", archived: "已归档" };
const PIPELINE_LABELS = { senate: "元老院线", praetorian: "禁卫军线", consul: "执政官直办" };
const TASK_STATUS = { pending: { label: "待征召", color: "#6B7280" }, executing: { label: "执行中", color: "#4A9EFF" }, reviewing: { label: "待验收", color: "#F59E0B" }, completed: { label: "已完成", color: "#10B981" } };

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 100, padding: "10px 12px", borderRadius: 4,
      background: "#1a1520", border: `2px solid ${color}33`,
      fontFamily: "'Press Start 2P', monospace", imageRendering: "pixelated",
      boxShadow: `inset 2px 2px 0 ${color}11, inset -2px -2px 0 #111`,
    }}>
      <div style={{ fontSize: 7, color: "#555", marginBottom: 4 }}>{icon} {label}</div>
      <div style={{ fontSize: 16, color, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 7, color: "#444", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function PixelProgressBar({ value, color, height = 8 }) {
  return (
    <div style={{
      width: "100%", height, background: "#111", border: "1px solid #333",
      imageRendering: "pixelated",
    }}>
      <div style={{
        width: `${value}%`, height: "100%", background: color,
        boxShadow: `inset 0 2px 0 rgba(255,255,255,0.3)`,
        transition: "width 0.5s steps(10)",
      }} />
    </div>
  );
}

export default function Dashboard() {
  const [view, setView] = useState("overview");
  const views = [
    { id: "overview", label: "CONSPECTUS", zh: "总览" },
    { id: "agents", label: "VIGILARIUM", zh: "Agent" },
    { id: "tasks", label: "CAMPUS", zh: "任务" },
    { id: "timeline", label: "ANNALES", zh: "编年史" },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`}</style>

      {/* Dashboard Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 12px", marginBottom: 6,
        background: "#1a1520", border: "2px solid #C9A84C33",
        fontFamily: "'Press Start 2P', monospace", imageRendering: "pixelated",
        boxShadow: "inset 2px 2px 0 #333, inset -2px -2px 0 #111",
      }}>
        <span style={{ fontSize: 9, color: "#C9A84C" }}>📊 TABULA IMPERIALIS</span>
        <span style={{ fontSize: 7, color: "#555" }}>凯撒指挥台</span>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
        {views.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            flex: 1, padding: "6px 4px", cursor: "pointer",
            fontFamily: "'Press Start 2P', monospace", fontSize: 7,
            background: view === v.id ? "#2a2030" : "#15101e",
            border: view === v.id ? "2px solid #C9A84C44" : "2px solid #222",
            color: view === v.id ? "#C9A84C" : "#444",
            boxShadow: view === v.id ? "inset 0 -2px 0 #C9A84C33" : "none",
            imageRendering: "pixelated",
          }}>
            {v.label}<br/><span style={{ fontFamily: "sans-serif", fontSize: 9 }}>{v.zh}</span>
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW ===== */}
      {view === "overview" && (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
            <StatCard icon="📋" label="PROJECTA" value="III" sub="3 活跃项目" color="#C9A84C" />
            <StatCard icon="🤖" label="AGENTES" value="XIV" sub="14 运行中" color="#10B981" />
            <StatCard icon="⚔️" label="MISSIONES" value="VII" sub="7 活跃任务" color="#4A9EFF" />
            <StatCard icon="⚠️" label="ATTENTIO" value="II" sub="2 待决事项" color="#F59E0B" />
          </div>

          <div style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 7,
            color: "#555", marginBottom: 4, padding: "0 4px",
          }}>PROJECTA ACTIVA · 活跃项目</div>

          {MOCK_PROJECTS.filter(p => p.status !== "completed").map(p => (
            <div key={p.id} style={{
              padding: "10px 12px", marginBottom: 4, borderRadius: 4,
              background: "#15101e", border: `2px solid ${URGENCY[p.urgency].color}22`,
              imageRendering: "pixelated",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#C9A84C",
                  }}>{p.id}</span>
                  <span style={{ fontSize: 13, color: "#DDD", fontWeight: 600 }}>{p.name}</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <span style={{
                    padding: "2px 6px", borderRadius: 2, fontSize: 8,
                    background: `${URGENCY[p.urgency].color}15`, color: URGENCY[p.urgency].color,
                    fontFamily: "'Press Start 2P', monospace", border: `1px solid ${URGENCY[p.urgency].color}33`,
                  }}>{URGENCY[p.urgency].label}</span>
                  <span style={{
                    padding: "2px 6px", borderRadius: 2, fontSize: 9,
                    background: "rgba(255,255,255,0.03)", color: "#888",
                  }}>{STATUS_LABELS[p.status]}</span>
                </div>
              </div>
              <PixelProgressBar value={p.progress} color={URGENCY[p.urgency].color} />
              <div style={{
                display: "flex", justifyContent: "space-between", marginTop: 4,
                fontSize: 9, color: "#555",
              }}>
                <span>🤖 {p.agents} agents · {PIPELINE_LABELS[p.pipeline]}</span>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7 }}>{p.progress}%</span>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ===== AGENTS ===== */}
      {view === "agents" && (
        <>
          {[
            { label: "ALWAYS-ON · 常驻卫戍", color: "#10B981", filter: "always" },
            { label: "PROJECT-PERSISTENT · 禁卫军", color: "#F59E0B", filter: "persistent" },
          ].map(group => (
            <div key={group.filter} style={{ marginBottom: 12 }}>
              <div style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 7,
                color: group.color, marginBottom: 4, padding: "0 4px",
              }}>{group.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {MOCK_AGENTS.filter(a => a.lifecycle === group.filter).map(a => (
                  <div key={a.id} style={{
                    padding: "8px 10px", borderRadius: 4,
                    background: "#15101e", border: `1px solid ${group.color}22`,
                    imageRendering: "pixelated",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#DDD" }}>{a.name}</span>
                      <span style={{
                        fontSize: 7, fontFamily: "'Press Start 2P', monospace",
                        color: a.status === "running" ? "#10B981" : "#F59E0B",
                      }}>● {a.status === "running" ? "RUN" : "ZZZ"}</span>
                    </div>
                    <div style={{ fontSize: 9, color: "#555", marginBottom: 4 }}>{a.latin}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#666" }}>
                      <span>HP {a.health}%</span>
                      <span>{a.uptime}</span>
                    </div>
                    <PixelProgressBar value={a.health} color={a.health > 95 ? "#10B981" : a.health > 85 ? "#F59E0B" : "#EF4444"} height={4} />
                    <div style={{ fontSize: 9, color: "#888", marginTop: 4 }}>→ {a.lastAction}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ===== TASKS ===== */}
      {view === "tasks" && (
        <>
          <div style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 7,
            color: "#555", marginBottom: 6, padding: "0 4px",
          }}>CAMPUS LEGIONARIUS · 军团兵任务看板</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
            {["pending", "executing", "reviewing", "completed"].map(status => (
              <div key={status}>
                <div style={{
                  padding: "4px 8px", marginBottom: 4, textAlign: "center",
                  background: `${TASK_STATUS[status].color}15`,
                  border: `1px solid ${TASK_STATUS[status].color}33`,
                  fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                  color: TASK_STATUS[status].color,
                }}>{TASK_STATUS[status].label}</div>
                {MOCK_TASKS.filter(t => t.status === status).map(t => (
                  <div key={t.id} style={{
                    padding: 8, marginBottom: 3, borderRadius: 3,
                    background: "#15101e", border: "1px solid #222",
                    fontSize: 9,
                  }}>
                    <div style={{
                      fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                      color: TASK_STATUS[status].color, marginBottom: 3,
                    }}>{t.id}</div>
                    <div style={{ color: "#CCC", marginBottom: 4, fontSize: 10 }}>{t.name}</div>
                    {t.agent && <div style={{ fontSize: 8, color: "#4A9EFF" }}>⚔️ {t.agent}</div>}
                    <div style={{ fontSize: 8, color: "#555" }}>{t.project}</div>
                    {t.progress > 0 && t.progress < 100 && (
                      <div style={{ marginTop: 4 }}>
                        <PixelProgressBar value={t.progress} color={TASK_STATUS[status].color} height={4} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== TIMELINE ===== */}
      {view === "timeline" && (
        <>
          <div style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 7,
            color: "#555", marginBottom: 6, padding: "0 4px",
          }}>ANNALES IMPERII · 帝国编年史</div>

          {MOCK_TIMELINE.map((event, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, marginBottom: 2, padding: "8px 10px",
              background: i % 2 === 0 ? "#15101e" : "#1a1520",
              border: "1px solid #1E1F25",
            }}>
              <div style={{
                width: 36, textAlign: "center", flexShrink: 0,
                fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                color: "#555",
              }}>{event.time}</div>
              <div style={{
                width: 28, height: 28, borderRadius: 4,
                background: `${event.color}15`, border: `1px solid ${event.color}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, flexShrink: 0,
              }}>{event.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#DDD" }}>{event.title}</div>
                <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{event.detail}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
