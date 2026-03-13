import { useState } from "react";
// ========== DATA ==========
const layers = {
  caesar: {
    id: "caesar",
    title: "Caesar · 凯撒",
    emoji: "🏛",
    latin: "Imperator Caesar",
    desc: "最高决策者 · 战略方向 · 关键审批 · 直接指挥禁卫军",
    color: "#C9A84C",
    responsibilities: [
      "通过执政官向元老院下达议题",
      "元老院僵局时的最终裁决权（Veto）",
      "直接指挥禁卫军（持久化项目组）",
      "审批重大对外动作",
      "组织战略方向制定",
    ],
  },
  consul: {
    id: "consul",
    title: "Consul · 执政官",
    emoji: "⚜️",
    latin: "Consul",
    type: "persistent",
    desc: "凯撒左右手 · 双重角色：生活助理 + 元老院组阁",
    color: "#8B5CF6",
    responsibilities: [
      "日常：日程管理、信息过滤、琐事处理",
      "项目启动时：将凯撒指令转化为可讨论的议题",
      "调用裁判官分析议题并筛选元老",
      "元老院产出方案后，实例化军团兵执行",
      "向凯撒汇报执行进度和结果",
    ],
    tools: ["日历 API", "消息路由", "Agent 实例化", "进度追踪"],
  },
  praetor: {
    id: "praetor",
    title: "Praetor · 裁判官",
    emoji: "⚖️",
    latin: "Praetor",
    type: "subagent",
    desc: "执政官的 Subagent · 分析议题领域 → 从元老池匹配最佳组阁",
    color: "#A78BFA",
    responsibilities: [
      "快速分析议题涉及的领域和维度",
      "评估议题复杂度（决定组阁规模 3-5 人）",
      "从元老池按标签匹配最适合的元老",
      "输出推荐组阁名单及理由",
      "必要时建议引入新的元老模板",
    ],
  },
  senate: {
    id: "senate",
    title: "Senatus · 元老院",
    latin: "Senatus",
    desc: "动态组阁 · 从元老池按项目需求挑选 3-5 位 Senator · 四阶段议制",
    color: "#E85D75",
    phases: [
      { name: "发散期", method: "六顶思考帽", latin: "Cogitatio", desc: "不同维度的元老各自输出专业意见", icon: "🎨", color: "#22C997" },
      { name: "冲突期", method: "红蓝对抗", latin: "Contentio", desc: "元老之间互相 Review，推翻逻辑硬伤", icon: "⚔️", color: "#EF4444" },
      { name: "收敛期", method: "德尔菲法", latin: "Consensus", desc: "协调员提取公约数，匿名投票修正", icon: "🎯", color: "#4A9EFF" },
      { name: "产出期", method: "蓝帽总结", latin: "Decretum", desc: "输出含执行方案的 Senatus Consultum（元老院决议）", icon: "📜", color: "#C9A84C" },
    ],
    rules: [
      "若无新增价值或实质性反对，禁止表达附和（Silentium Rule）",
      "每轮发言需标注视角维度（Perspectiva Tag）",
      "超过 3 轮未收敛，提交凯撒裁决（Appellatio ad Caesarem）",
      "产出必须包含：军团兵角色清单 + 分工 + 交付标准（Decretum Format）",
    ],
  },
  senatorPool: [
    { id: "s-macro", name: "宏观经济学家", latin: "Senator Oeconomicus", tags: ["宏观", "政策", "利率", "通胀"], emoji: "📊" },
    { id: "s-quant", name: "量化策略师", latin: "Senator Numerarius", tags: ["量化", "风控", "回测", "因子"], emoji: "📈" },
    { id: "s-tech", name: "技术架构师", latin: "Senator Architectus", tags: ["系统设计", "API", "性能", "安全"], emoji: "🏗️" },
    { id: "s-product", name: "产品经理", latin: "Senator Fabricator", tags: ["用户需求", "MVP", "路线图", "竞品"], emoji: "🎯" },
    { id: "s-creative", name: "创意总监", latin: "Senator Artifex", tags: ["品牌", "文案", "视觉", "叙事"], emoji: "🎨" },
    { id: "s-risk", name: "风险分析师", latin: "Senator Cautus", tags: ["风控", "合规", "红线", "尾部风险"], emoji: "🛡️" },
    { id: "s-data", name: "数据科学家", latin: "Senator Analyticus", tags: ["统计", "ML", "特征工程", "可视化"], emoji: "🔬" },
    { id: "s-ops", name: "运营专家", latin: "Senator Operarius", tags: ["流程", "效率", "自动化", "SOP"], emoji: "⚙️" },
    { id: "s-finance", name: "财务分析师", latin: "Senator Argentarius", tags: ["估值", "现金流", "ROI", "预算"], emoji: "💰" },
    { id: "s-legal", name: "法务顾问", latin: "Senator Iuridicus", tags: ["合规", "协议", "知识产权", "监管"], emoji: "⚖️" },
    { id: "s-market", name: "市场分析师", latin: "Senator Mercator", tags: ["竞品", "趋势", "定位", "增长"], emoji: "📡" },
    { id: "s-ux", name: "用户体验师", latin: "Senator Humanitas", tags: ["交互", "可用性", "信息架构", "A/B"], emoji: "🧑‍💻" },
  ],
  backOffice: [
    { id: "bo-annalist", title: "Annalist · 史官", emoji: "📚", latin: "Annalista", chinese: "组织记忆管理员", desc: "归档决策和执行结果 · 维护知识库 · 沉淀经验", color: "#2C3E50" },
    { id: "bo-quaestor", title: "Quaestor · 财务官", emoji: "💰", latin: "Quaestor", chinese: "财务和预算管家", desc: "持续账目追踪 · 收支报表 · 预算预警", color: "#54A0FF" },
    { id: "bo-curator", title: "Curator Aquarum · 水道官", emoji: "🌐", latin: "Curator Aquarum", chinese: "IT 基础设施运维", desc: "系统监控 · 网络维护 · 安全防护", color: "#10B981" },
    { id: "bo-explorator", title: "Explorator · 探路者", emoji: "🔍", latin: "Explorator", chinese: "情报侦察兵", desc: "行业动态 · 竞品追踪 · 新闻聚合 · RSS 监控", color: "#F59E0B" },
    { id: "bo-tribune", title: "Tribune · 护民官", emoji: "📱", latin: "Tribunus Plebis", chinese: "舆情和用户反馈监测", desc: "社交媒体监测 · 舆情分析 · 用户声音收集", color: "#EC4899" },
  ],
  praetorian: {
    title: "Praetorian Guard · 禁卫军",
    latin: "Praetoriani",
    desc: "凯撒直属持久化项目组 · 可组建多个特勤队 · 独立于元老院指挥链",
    color: "#EF4444",
    standardRoles: [
      { role: "Strategus · 谋略官", icon: "🧠", desc: "策略制定 · 方向把控" },
      { role: "Custos · 守卫官", icon: "🛡️", desc: "风控管理 · 边界守护" },
      { role: "Executor · 执行官", icon: "⚡", desc: "核心任务执行" },
      { role: "Tabularius · 记录官", icon: "📊", desc: "数据维护 · 状态追踪" },
    ],
    cohorts: [
      { id: "cs-alpha", name: "Cohors Specialis Alpha", code: "CS-α", emoji: "🔴", status: "示例：可按业务需求组建" },
      { id: "cs-beta", name: "Cohors Specialis Beta", code: "CS-β", emoji: "🟠", status: "示例：可按业务需求组建" },
    ],
    rules: [
      "每队全员持久化，项目存续期内 7×24 运行",
      "凯撒直接指挥，不经执政官和元老院",
      "可根据业务需要增减队内角色（标准四角色为骨架）",
      "成果由史官（Annalist）归档，定期向凯撒汇报",
    ],
  },
};
const agentLifecycles = [
  { type: "Always-on · 常驻卫戍", icon: "🟢", color: "#10B981", desc: "组织基础设施，24/7 运行", examples: "执政官、史官、财务官、水道官、探路者、护民官" },
  { type: "Project-persistent · 禁卫军", icon: "🟡", color: "#F59E0B", desc: "凯撒直属特勤队，项目存续期内全员常驻", examples: "Cohors Specialis（谋略官/守卫官/执行官/记录官）" },
  { type: "Ephemeral · 军团兵", icon: "🔵", color: "#8B5CF6", desc: "按需征召，战役结束即归建解散", examples: "元老院元老、临时执行 Agent" },
];
const flowSteps = [
  { label: "凯撒下达议题", sub: "Caesar decernit · 凯撒发布指令", icon: "🏛", color: "#C9A84C" },
  { label: "执政官接令 + 裁判官分析组阁", sub: "Consul & Praetor · 助理接令，子程序筛选专家", icon: "⚜️", color: "#8B5CF6" },
  { label: "元老院四阶段议制", sub: "Senatus deliberat · 专家组讨论达成共识", icon: "⚔️", color: "#E85D75" },
  { label: "产出元老院决议", sub: "Senatus Consultum · 可执行方案（含角色+分工+标准）", icon: "📜", color: "#C9A84C" },
  { label: "执政官征召军团兵", sub: "Consul legiones scribit · 按方案实例化执行 Agent", icon: "⚜️", color: "#8B5CF6" },
  { label: "军团兵执行 → 交付", sub: "Legionarii exsequuntur · 临时 Agent 执行任务", icon: "⚔️", color: "#4A9EFF" },
  { label: "史官归档", sub: "Annalista scribit · 成果和经验写入知识库", icon: "📚", color: "#2C3E50" },
];
// ========== MAIN COMPONENT ==========
export default function SPQA() {
  const [tab, setTab] = useState("overview");
  const [expandPhase, setExpandPhase] = useState(null);
  const [selectedBO, setSelectedBO] = useState(null);
  const tabs = [
    { id: "overview", label: "全景", emoji: "🏛" },
    { id: "senate", label: "元老院议制", emoji: "⚔️" },
    { id: "pool", label: "元老池", emoji: "👥" },
    { id: "praetorian", label: "禁卫军", emoji: "🛡️" },
    { id: "lifecycle", label: "生命周期", emoji: "🔄" },
    { id: "flow", label: "任务流转", emoji: "📡" },
    { id: "backoffice", label: "综合办公室", emoji: "🏢" },
  ];
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #08070A 0%, #0E0C12 50%, #0A090D 100%)",
      color: "#E8E6E1",
      fontFamily: "'Noto Sans SC', 'SF Pro Display', -apple-system, sans-serif",
      padding: "32px 20px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          fontSize: 13, letterSpacing: 4, color: "#C9A84C", marginBottom: 4, fontWeight: 700,
        }}>S · P · Q · A</div>
        <h1 style={{
          fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.3,
          background: "linear-gradient(135deg, #C9A84C, #E85D75, #8B5CF6)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Senatus PopulusQue Agentium</h1>
        <p style={{ color: "#666", fontSize: 12, marginTop: 6 }}>元老院与 Agent · AI-Native Organization Architecture</p>
        <div style={{
          display: "inline-block", marginTop: 8, padding: "4px 14px", borderRadius: 20,
          background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)",
          fontSize: 11, color: "#C9A84C", letterSpacing: 1,
        }}>动态组阁 · 四阶段议制 · 三级生命周期</div>
      </div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setExpandPhase(null); setSelectedBO(null); }} style={{
            padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer",
            border: tab === t.id ? "1px solid #C9A84C" : "1px solid #1A1B20",
            background: tab === t.id ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.02)",
            color: tab === t.id ? "#C9A84C" : "#555", transition: "all 0.2s",
          }}>{t.emoji} {t.label}</button>
        ))}
      </div>
      {/* ===== OVERVIEW ===== */}
      {tab === "overview" && (
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          {/* Caesar */}
          <RoleCard emoji="🏛" title="Caesar · 凯撒" latin="Imperator Caesar" chinese="最高决策者 · 你本人" color="#C9A84C" badge="你" glow>
            <div style={{ fontSize: 11, color: "#888", textAlign: "center" }}>战略决策 · 最终裁决 · 禁卫军直属指挥</div>
          </RoleCard>
          <FlowArrow />
          {/* Consul */}
          <RoleCard emoji="⚜️" title="Consul · 执政官" latin="Consul" chinese="你的首席助理 · 生活管家兼项目启动器" color="#8B5CF6" badge="Always-on">
            <div style={{ fontSize: 11, color: "#999", lineHeight: 1.6, textAlign: "center" }}>
              日常 → 生活助理 · 信息枢纽
              <br />项目 → 调用裁判官组阁 · 实例化军团兵
            </div>
            <div style={{
              marginTop: 8, padding: "6px 10px", borderRadius: 8,
              background: "rgba(167,139,250,0.06)", border: "1px dashed rgba(167,139,250,0.2)",
              fontSize: 10, color: "#A78BFA", textAlign: "center",
            }}>
              🤖 Subagent: <strong>Praetor · 裁判官</strong> — 分析议题领域 → 从专家池匹配最佳阵容
            </div>
          </RoleCard>
          <FlowArrow />
          {/* Senate */}
          <RoleCard emoji="⚔️" title="Senatus · 元老院" latin="Senatus" chinese="集体决策机构 · 多专家讨论达成共识" color="#E85D75" badge="Ephemeral">
            <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginTop: 4 }}>
              {layers.senate.phases.map((p, i) => (
                <span key={i} style={{
                  padding: "3px 8px", borderRadius: 8, fontSize: 10,
                  background: `${p.color}10`, border: `1px solid ${p.color}25`, color: p.color, fontWeight: 600,
                }}>{p.icon} {p.name} · {p.latin}</span>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#777", textAlign: "center", marginTop: 6 }}>
              产出 → Senatus Consultum · 元老院决议（含执行角色 + 分工 + 交付标准）
            </div>
          </RoleCard>
          <FlowArrow />
          {/* Legionaries */}
          <RoleCard emoji="⚔️" title="Legionarii · 军团兵" latin="Legionarii" chinese="临时执行者 · 按方案征召、任务完成即解散" color="#4A9EFF" badge="Ephemeral">
            <div style={{ fontSize: 11, color: "#888", textAlign: "center" }}>
              按元老院决议动态实例化 · 执行完成 → 成果交史官归档 → 销毁
            </div>
          </RoleCard>
          <FlowArrow />
          {/* Annalist */}
          <RoleCard emoji="📚" title="Annalist · 史官" latin="Annalista" chinese="组织记忆管理员 · 记录归档一切决策和成果" color="#2C3E50" badge="Always-on">
            <div style={{ fontSize: 11, color: "#888", textAlign: "center" }}>
              归档一切：决策记录 · 执行结果 · 经验教训 · SOP
            </div>
          </RoleCard>
          {/* Back Office Strip */}
          <div style={{
            marginTop: 20, padding: 14, borderRadius: 14,
            border: "1px solid #1E1F25", background: "rgba(255,255,255,0.015)",
          }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#555", fontWeight: 600, textAlign: "center", marginBottom: 8 }}>
              OFFICIUM · 综合办公室 · ALWAYS-ON
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {layers.backOffice.map((bo) => (
                <span key={bo.id} style={{
                  padding: "5px 10px", borderRadius: 10,
                  background: `${bo.color}08`, border: `1px solid ${bo.color}20`,
                  fontSize: 11, color: bo.color, fontWeight: 500,
                }}>{bo.emoji} {bo.title.split("·")[0].trim()}</span>
              ))}
            </div>
          </div>
          {/* Praetorian */}
          <div style={{
            marginTop: 14, padding: 14, borderRadius: 14,
            border: "1px dashed rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.02)",
          }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#EF4444", fontWeight: 600, textAlign: "center", marginBottom: 4 }}>
              PRAETORIAN GUARD · 禁卫军 · 凯撒直属
            </div>
            <div style={{ fontSize: 10, color: "#777", textAlign: "center", marginBottom: 10 }}>
              {layers.praetorian.desc}
            </div>
            {/* Standard Roles */}
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", fontWeight: 600, textAlign: "center", marginBottom: 6 }}>
              标准角色骨架
            </div>
            <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
              {layers.praetorian.standardRoles.map((r, i) => (
                <div key={i} style={{
                  padding: "5px 10px", borderRadius: 8,
                  background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 16 }}>{r.icon}</div>
                  <div style={{ fontSize: 10, color: "#F87171", fontWeight: 600 }}>{r.role}</div>
                  <div style={{ fontSize: 9, color: "#666" }}>{r.desc}</div>
                </div>
              ))}
            </div>
            {/* Cohort Slots */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              {layers.praetorian.cohorts.map((c) => (
                <div key={c.id} style={{
                  padding: "6px 14px", borderRadius: 10,
                  border: "1px dashed rgba(239,68,68,0.2)",
                  background: "rgba(239,68,68,0.02)",
                  textAlign: "center", flex: 1, maxWidth: 200,
                }}>
                  <span style={{ fontSize: 14 }}>{c.emoji}</span>
                  <div style={{ fontSize: 11, color: "#EF4444", fontWeight: 600 }}>{c.code}</div>
                  <div style={{ fontSize: 9, color: "#555" }}>{c.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ===== SENATE PROCESS ===== */}
      {tab === "senate" && (
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <p style={{ color: "#777", fontSize: 12, textAlign: "center", marginBottom: 16 }}>
            Ordo Deliberandi — 元老院议事程序
          </p>
          {layers.senate.phases.map((phase, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <button onClick={() => setExpandPhase(expandPhase === i ? null : i)} style={{
                width: "100%", padding: 14, borderRadius: expandPhase === i ? "14px 14px 0 0" : 14,
                cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                border: `1px solid ${phase.color}${expandPhase === i ? "44" : "20"}`,
                background: `linear-gradient(135deg, ${phase.color}${expandPhase === i ? "0C" : "04"}, #0D0E12)`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, background: `${phase.color}14`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
                  }}>{phase.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: phase.color }}>Phase {i + 1} · {phase.name}</span>
                      <span style={{ padding: "2px 6px", borderRadius: 6, fontSize: 9, background: `${phase.color}12`, color: phase.color }}>{phase.method}</span>
                      <span style={{ padding: "2px 6px", borderRadius: 6, fontSize: 9, background: "rgba(255,255,255,0.03)", color: "#666", fontStyle: "italic" }}>{phase.latin}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{phase.desc}</div>
                  </div>
                  <span style={{ color: "#333" }}>{expandPhase === i ? "▲" : "▼"}</span>
                </div>
              </button>
              {expandPhase === i && (
                <div style={{
                  padding: "12px 16px", borderRadius: "0 0 14px 14px",
                  border: `1px solid ${phase.color}20`, borderTop: "none",
                  background: `${phase.color}04`,
                }}>
                  {i === 0 && (
                    <div style={{ fontSize: 12, color: "#999", lineHeight: 1.8 }}>
                      每位 Senator 佩戴指定思考帽，从单一维度深挖：
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {["🤍 白帽·Facta(数据)", "⬛ 黑帽·Periculum(风险)", "🟡 黄帽·Valor(价值)", "🟢 绿帽·Novitas(创新)", "🔴 红帽·Sensus(直觉)"].map((h, j) => (
                          <span key={j} style={{ padding: "3px 8px", borderRadius: 8, fontSize: 10, background: "rgba(255,255,255,0.03)", border: "1px solid #1E1F25", color: "#AAA" }}>{h}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {i === 1 && (
                    <div style={{ fontSize: 12, color: "#999", lineHeight: 1.8 }}>
                      <span style={{ color: "#4A9EFF" }}>蓝军 Defensores</span>（提案方）vs <span style={{ color: "#EF4444" }}>红军 Oppugnatores</span>（挑战方）
                      <br />评判席 <span style={{ color: "#C9A84C" }}>Iudices</span> 根据博弈决定必须纳入的修正。
                      <br />目标：挤掉方案水分，产出具有落地韧性的 Decretum。
                    </div>
                  )}
                  {i === 2 && (
                    <div style={{ fontSize: 12, color: "#999", lineHeight: 1.8 }}>
                      协调员 <span style={{ color: "#4A9EFF" }}>Moderator</span> 汇总所有观点（隐去身份），提取公约数。
                      <br />1-2 轮匿名投票（Suffragium Secretum）修正收敛。
                      <br />超过 3 轮未收敛 → <span style={{ color: "#C9A84C" }}>Appellatio ad Caesarem</span>（提交凯撒裁决）。
                    </div>
                  )}
                  {i === 3 && (
                    <div style={{ fontSize: 12, color: "#999", lineHeight: 1.8 }}>
                      蓝帽总结人 <span style={{ color: "#C9A84C" }}>Praeses</span> 输出 <strong>Senatus Consultum</strong>（元老院决议），必须包含：
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {["Legionarii（军团兵角色清单）", "Officia（具体分工）", "Norma（交付标准）", "Tempus（时间估算）", "Provisio（风险预案）"].map((r, j) => (
                          <span key={j} style={{ padding: "3px 8px", borderRadius: 8, fontSize: 10, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", color: "#C9A84C" }}>{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {/* Rules */}
          <div style={{ marginTop: 12, padding: 14, borderRadius: 14, border: "1px solid rgba(201,168,76,0.15)", background: "rgba(201,168,76,0.02)" }}>
            <div style={{ fontWeight: 700, color: "#C9A84C", fontSize: 12, marginBottom: 6 }}>⚡ Lex Senatus · 议事纪律</div>
            {layers.senate.rules.map((r, i) => (
              <div key={i} style={{ fontSize: 11, color: "#999", padding: "3px 0", lineHeight: 1.6 }}>
                <span style={{ color: "#C9A84C", marginRight: 6 }}>›</span>{r}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ===== POOL ===== */}
      {tab === "pool" && (
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <p style={{ color: "#777", fontSize: 12, textAlign: "center", marginBottom: 14 }}>
            Collegium Senatorum — {layers.senatorPool.length} 位元老模板 · 每次议事由裁判官挑选 3-5 位
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {layers.senatorPool.map((s) => (
              <div key={s.id} style={{
                padding: 10, borderRadius: 12,
                border: "1px solid #1A1B20",
                background: "linear-gradient(135deg, #0F1015, #0C0D11)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>{s.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: "#DDD" }}>{s.name}</div>
                    <div style={{ fontSize: 9, color: "#555", fontStyle: "italic" }}>{s.latin}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {s.tags.map((t, i) => (
                    <span key={i} style={{
                      padding: "2px 5px", borderRadius: 5, fontSize: 9,
                      background: "rgba(232,93,117,0.06)", color: "#E85D75",
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: 10, borderRadius: 12, border: "1px dashed #222", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#555" }}>
              Senator = System Prompt + Perspectiva + Norma Iudicii
              <br />可随时扩展元老池 · Praetor 自动纳入匹配范围
            </div>
          </div>
        </div>
      )}
      {/* ===== PRAETORIAN ===== */}
      {tab === "praetorian" && (
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <p style={{ color: "#777", fontSize: 12, textAlign: "center", marginBottom: 16 }}>
            Praetoriani — 凯撒直属持久化项目组机制
          </p>
          {/* Concept */}
          <div style={{
            padding: 16, borderRadius: 14,
            border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.04)",
            marginBottom: 12,
          }}>
            <div style={{ fontWeight: 700, color: "#EF4444", fontSize: 14, marginBottom: 6, textAlign: "center" }}>
              🛡️ Cohors Specialis · 特勤队
            </div>
            <div style={{ fontSize: 12, color: "#999", lineHeight: 1.7, textAlign: "center" }}>
              禁卫军是一个分类，下辖多个特勤队（Cohors Specialis）。
              <br />每队是一个独立的持久化项目组，凯撒按需组建、命名、编号。
              <br />全员持久化 · 凯撒直接指挥 · 独立于元老院指挥链。
            </div>
          </div>
          {/* Standard Roles */}
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#666", fontWeight: 600, textAlign: "center", marginBottom: 8 }}>
            标准角色骨架（可按业务增减）
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
            {layers.praetorian.standardRoles.map((r, i) => (
              <div key={i} style={{
                padding: 12, borderRadius: 12,
                border: "1px solid rgba(239,68,68,0.15)",
                background: "linear-gradient(135deg, rgba(239,68,68,0.04), #0D0E12)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{r.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#F87171" }}>{r.role}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{r.desc}</div>
              </div>
            ))}
          </div>
          {/* Cohort Slots */}
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#666", fontWeight: 600, textAlign: "center", marginBottom: 8 }}>
            特勤队编制（示例）
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {layers.praetorian.cohorts.map((c) => (
              <div key={c.id} style={{
                flex: 1, padding: 14, borderRadius: 12,
                border: "1px dashed rgba(239,68,68,0.2)",
                background: "rgba(239,68,68,0.02)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 24 }}>{c.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#EF4444", marginTop: 2 }}>{c.code}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{c.name}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 4, fontStyle: "italic" }}>{c.status}</div>
              </div>
            ))}
            <div style={{
              flex: 1, padding: 14, borderRadius: 12,
              border: "1px dashed #222", textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ fontSize: 20, color: "#333" }}>＋</div>
              <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>按需组建</div>
            </div>
          </div>
          {/* Rules */}
          <div style={{
            padding: 14, borderRadius: 14,
            border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.02)",
          }}>
            <div style={{ fontWeight: 700, color: "#EF4444", fontSize: 12, marginBottom: 6 }}>⚡ Lex Praetoriana · 禁卫军条令</div>
            {layers.praetorian.rules.map((r, i) => (
              <div key={i} style={{ fontSize: 11, color: "#999", padding: "3px 0", lineHeight: 1.6 }}>
                <span style={{ color: "#EF4444", marginRight: 6 }}>›</span>{r}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ===== LIFECYCLE ===== */}
      {tab === "lifecycle" && (
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <p style={{ color: "#777", fontSize: 12, textAlign: "center", marginBottom: 16 }}>
            Tres Ordines Vitae — 三级 Agent 生命周期
          </p>
          {agentLifecycles.map((lc, i) => (
            <div key={i} style={{
              padding: 14, borderRadius: 14, marginBottom: 8,
              border: `1px solid ${lc.color}25`, background: `linear-gradient(135deg, ${lc.color}05, #0D0E12)`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{lc.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: lc.color, fontSize: 14 }}>{lc.type}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{lc.desc}</div>
                </div>
              </div>
              <div style={{ padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${lc.color}`, fontSize: 11, color: "#999" }}>
                {lc.examples}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* ===== FLOW ===== */}
      {tab === "flow" && (
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <p style={{ color: "#777", fontSize: 12, textAlign: "center", marginBottom: 16 }}>
            Iter Mandati — 议题从下达到归档的完整旅程
          </p>
          {flowSteps.map((step, i) => (
            <div key={i}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 12,
                border: `1px solid ${step.color}20`, background: `linear-gradient(135deg, ${step.color}05, #0D0E12)`,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, background: `${step.color}12`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
                }}>{step.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: step.color }}>{step.label}</div>
                  <div style={{ fontSize: 10, color: "#555", fontStyle: "italic" }}>{step.sub}</div>
                </div>
              </div>
              {i < flowSteps.length - 1 && (
                <div style={{ display: "flex", justifyContent: "center", padding: "1px 0" }}>
                  <div style={{ width: 1, height: 10, background: `${step.color}30` }} />
                </div>
              )}
            </div>
          ))}
          {/* Praetorian separate flow */}
          <div style={{
            marginTop: 20, padding: 14, borderRadius: 14,
            border: "1px dashed rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.02)",
          }}>
            <div style={{ fontWeight: 700, color: "#EF4444", fontSize: 12, marginBottom: 6, textAlign: "center" }}>
              ⚡ Via Praetoriana · 禁卫军独立流转
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap", fontSize: 11, color: "#F87171" }}>
              <span style={{ padding: "3px 8px", borderRadius: 8, background: "rgba(239,68,68,0.06)" }}>🏛 Caesar decernit</span>
              <span style={{ color: "#333" }}>→</span>
              <span style={{ padding: "3px 8px", borderRadius: 8, background: "rgba(239,68,68,0.06)" }}>📈 Cohors exsequitur</span>
              <span style={{ color: "#333" }}>→</span>
              <span style={{ padding: "3px 8px", borderRadius: 8, background: "rgba(239,68,68,0.06)" }}>📚 Annalista scribit</span>
            </div>
            <div style={{ fontSize: 10, color: "#666", textAlign: "center", marginTop: 6 }}>
              不经元老院 · 凯撒直接指挥 · 实时性优先
            </div>
          </div>
        </div>
      )}
      {/* ===== BACK OFFICE ===== */}
      {tab === "backoffice" && (
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <p style={{ color: "#777", fontSize: 12, textAlign: "center", marginBottom: 16 }}>
            Officium · 综合办公室 — 组织的基础代谢，全部 Always-on
          </p>
          {layers.backOffice.map((bo) => (
            <button key={bo.id}
              onClick={() => setSelectedBO(selectedBO === bo.id ? null : bo.id)}
              style={{
                width: "100%", padding: 14, borderRadius: 12, cursor: "pointer",
                textAlign: "left", marginBottom: 6, transition: "all 0.2s",
                border: selectedBO === bo.id ? `1px solid ${bo.color}44` : `1px solid ${bo.color}18`,
                background: selectedBO === bo.id
                  ? `linear-gradient(135deg, ${bo.color}0A, #0D0E12)`
                  : `linear-gradient(135deg, ${bo.color}03, #0D0E12)`,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{bo.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: bo.color }}>{bo.title}</div>
                  <div style={{ fontSize: 10, color: "#555", fontStyle: "italic" }}>{bo.latin}</div>
                  <div style={{ fontSize: 12, color: "#AAA", marginTop: 2 }}>{bo.chinese}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#777", marginTop: 6 }}>{bo.desc}</div>
            </button>
          ))}
        </div>
      )}
      {/* ===== OPENCLAW FOOTER ===== */}
      <div style={{
        maxWidth: 540, margin: "48px auto 0", padding: "28px 20px",
        borderRadius: 16, textAlign: "center",
        border: "1px solid rgba(201,168,76,0.15)",
        background: "linear-gradient(135deg, rgba(201,168,76,0.03), rgba(139,92,246,0.03), rgba(232,93,117,0.03))",
      }}>
        <div style={{
          fontSize: 11, letterSpacing: 3, color: "#C9A84C", fontWeight: 700, marginBottom: 12,
        }}>POWERED BY</div>
        <div style={{
          fontSize: 28, fontWeight: 800, marginBottom: 4,
          background: "linear-gradient(135deg, #C9A84C, #E85D75, #8B5CF6)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>OpenClaw</div>
        <div style={{
          fontSize: 12, color: "#888", lineHeight: 1.8, marginTop: 12, marginBottom: 16,
        }}>
          SPQA 是基于 <span style={{ color: "#C9A84C", fontWeight: 600 }}>OpenClaw</span> 构建的 AI-Native 组织架构范式。
          <br />OpenClaw 提供多 Agent 编排、动态组阁、生命周期管理等底层能力，
          <br />让 AI Agent 像罗马元老院一样协作决策、分工执行。
        </div>
        <div style={{
          fontSize: 12, color: "#999", lineHeight: 1.8, marginBottom: 20,
          fontStyle: "italic",
        }}>
          SPQA is an AI-Native organizational architecture built on <span style={{ color: "#C9A84C", fontWeight: 600, fontStyle: "normal" }}>OpenClaw</span>.
          <br />OpenClaw provides multi-agent orchestration, dynamic assembly,
          <br />and lifecycle management — enabling AI agents to collaborate
          <br />like the Roman Senate: deliberate, decide, and execute.
        </div>
        <div style={{
          display: "inline-block", padding: "10px 28px", borderRadius: 24,
          background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(139,92,246,0.1))",
          border: "1px solid rgba(201,168,76,0.25)",
        }}>
          <div style={{
            fontSize: 16, fontWeight: 700,
            background: "linear-gradient(135deg, #C9A84C, #8B5CF6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>敬请期待 · Coming Soon</div>
        </div>
        <div style={{ fontSize: 10, color: "#444", marginTop: 12, letterSpacing: 1 }}>
          OpenClaw — Open-source AI Agent Orchestration Framework
        </div>
      </div>
    </div>
  );
}
// ========== SHARED COMPONENTS ==========
function RoleCard({ emoji, title, latin, chinese, color, badge, glow, children }) {
  return (
    <div style={{
      padding: 16, borderRadius: 14,
      border: `1px solid ${color}${glow ? "44" : "25"}`,
      background: `linear-gradient(135deg, ${color}${glow ? "0C" : "06"}, #0D0E12)`,
      boxShadow: glow ? `0 0 40px ${color}08` : "none",
    }}>
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 30 }}>{emoji}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color }}>{title}</span>
          {badge && <span style={{ padding: "2px 7px", borderRadius: 8, fontSize: 9, background: `${color}12`, color, fontWeight: 600 }}>{badge}</span>}
        </div>
        <div style={{ fontSize: 10, color: "#555", fontStyle: "italic" }}>{latin}</div>
        {chinese && <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{chinese}</div>}
      </div>
      {children}
    </div>
  );
}
function FlowArrow() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0" }}>
      <div style={{ width: 1, height: 16, background: "linear-gradient(to bottom, #333, #1A1B20)" }} />
      <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "5px solid #333" }} />
    </div>
  );
}
