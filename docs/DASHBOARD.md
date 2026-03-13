# Dashboard · 游戏化控制台

> 皮肤层的实体化 · Agent 交互 · 系统监控 · 配置管理

---

## 1. Dashboard 是什么

Dashboard 不是一个独立的管理后台，它**就是皮肤层**。

```
┌──────────────────────────────────────────────────────┐
│  Dashboard (皮肤层)                                    │
│  ┌────────────────────────────────────────────────┐  │
│  │  theme.yaml → 视觉 + 术语 + 交互隐喻           │  │
│  │  React 组件 → 渲染引擎数据为游戏化界面          │  │
│  └────────────────────────────────────────────────┘  │
│                        ▲                              │
│                        │ Engine API                   │
│  ┌─────────────────────┴──────────────────────────┐  │
│  │  Engine Layer (引擎层)                           │  │
│  │  Agent 状态 · Session 进度 · 消息流 · 配置       │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

用户买皮肤 = 买一套 Dashboard 主题。罗马皮肤看到的是元老院大殿，海盗皮肤看到的是船长甲板，董事会皮肤看到的是会议室。底层数据和操作完全一样。

---

## 2. 三大功能区

### 2.1 交互区（Interactio）

与 Agent 对话和下达指令的主界面。

**罗马皮肤下的视觉隐喻：**
- 主聊天界面 = 凯撒的御座厅，与执政官对话
- 元老院议事 = 大殿辩论实况，能看到各元老的发言和阶段推进
- 禁卫军指挥 = 军营沙盘，直接对特勤队下令

**核心交互：**

| 交互 | 引擎操作 | 皮肤表现（罗马） |
|------|---------|----------------|
| 和 Orchestrator 对话 | Gateway Channel 消息 | 在御座厅和执政官对话 |
| 查看议事实况 | 读取 session state + phase outputs | 元老院大殿，元老头像亮起表示正在发言 |
| 审批决议 | 凯撒确认 Senatus Consultum | 卷轴展开，盖印确认 |
| 指挥禁卫军 | A2A/Gateway 消息到 Castrum | 军营沙盘，拖动棋子下令 |
| 查看归档 | 查询 Annalist 的 archive | 史官的卷轴库，按标签检索 |

### 2.2 监控区（Vigilia）

系统状态的实时展示。

**实时数据源：**

| 数据 | 来源 | 刷新频率 |
|------|------|---------|
| Agent 在线状态 | Curator heartbeat | 每 60s |
| 活跃 Session | Consul workspace/active/ | 实时（WebSocket） |
| API 配额 | Curator cost report | 每 6h |
| Castrum 连接状态 | A2A heartbeat | 每 60s |
| 告警 | alert 类型消息 | 实时推送 |

**罗马皮肤下的视觉隐喻：**
- 组织全景 = 俯瞰罗马城地图，每个建筑 = 一个 Agent/Instance
- Agent 在线 = 建筑亮灯；离线 = 建筑灰暗
- 活跃议事 = 元老院大殿上方有烟（正在讨论）
- Castrum 状态 = 城墙外的军营，连线表示通讯畅通，断线表示失联
- 告警 = 红色烽火台点燃
- API 配额 = 水道官的水渠水位仪表

### 2.3 配置区（Configuratio）

系统设置和角色管理。

**可配置项：**

| 配置 | 引擎操作 | 皮肤表现（罗马） |
|------|---------|----------------|
| 启用/停用可选角色 | 修改 role-meta.yaml enabled | 任命/罢免官员仪式 |
| 创建禁卫军特勤队 | 创建 cohort-meta.yaml + Workspace | 建造新军营 |
| 编辑元老池 | 修改 senators/s-*.md | 编辑元老名册 |
| 创建自定义角色 | 创建 agents/{id}/ 目录 | 新设官职 |
| 切换皮肤 | 修改 config.yaml active_theme | 改朝换代（带过渡动画） |
| 管理 Castrum | A2A 配置 | 管理行省（远征军驻地） |

---

## 3. 皮肤如何改变 Dashboard

同一个 Dashboard 框架，不同皮肤呈现完全不同的体验。

### 3.1 皮肤影响的维度

```yaml
# theme.yaml 中 Dashboard 相关的扩展
dashboard:
  # === 布局 ===
  layout: "imperial"               # 布局模式
  # imperial: 中心辐射，主角在中间（罗马、三省六部）
  # corporate: 左侧导航栏 + 右侧内容（董事会、硅谷）
  # adventure: 地图探索式（海盗、冒险）

  # === 场景 ===
  scenes:
    home:
      name: "Forum Romanum"
      background: "./assets/scenes/forum.svg"
      description: "罗马广场 · 日常事务中心"
    deliberation:
      name: "Curia Julia"
      background: "./assets/scenes/senate-hall.svg"
      description: "元老院大殿 · 议事进行中"
    command:
      name: "Castra Praetoria"
      background: "./assets/scenes/military-camp.svg"
      description: "禁卫军营地 · 特勤队指挥"
    archive:
      name: "Tabularium"
      background: "./assets/scenes/archive.svg"
      description: "国家档案馆 · 史官的领地"
    monitor:
      name: "Aqua Claudia"
      background: "./assets/scenes/aqueduct.svg"
      description: "水道系统 · 基础设施监控"

  # === 动画与音效 ===
  effects:
    phase_transition: "scroll_unfurl"     # 阶段切换动画
    alert_incoming: "trumpet_fanfare"     # 告警音效
    task_complete: "laurel_crown"         # 任务完成特效
    agent_spawn: "legion_march"           # Agent 创建动画

  # === 角色头像 ===
  avatars:
    orchestrator: "./assets/avatars/consul.svg"
    archivist: "./assets/avatars/annalist.svg"
    monitor: "./assets/avatars/curator.svg"
    # ...
```

### 3.2 皮肤对比示例

| 界面元素 | 罗马 | 董事会 | 海盗 |
|---------|------|--------|------|
| 首页 | 罗马广场鸟瞰 | 现代办公室 | 海盗船甲板 |
| 议事进行中 | 元老院大殿，元老围坐辩论 | 会议室，白板上的便利贴 | 海盗议会，圆桌和朗姆酒 |
| Agent 状态 | 建筑亮灯/灰暗 | 组织架构图绿灯/红灯 | 船员岗位有人/空位 |
| 告警 | 烽火台点燃 | 手机推送 + 红色横幅 | 瞭望手大喊 + 骷髅旗升起 |
| 任务完成 | 凯旋门 + 月桂冠 | ✅ 完成 + 绩效看板更新 | 宝箱打开 + 金币 |
| 创建新团队 | 组建新军团仪式 | 创建项目组表单 | 招募新船员 |
| 切换皮肤 | — | — | — |
| 布局 | 中心辐射（御座在中心） | 左栏导航 | 地图探索 |

---

## 4. Engine API

Dashboard 通过标准化的 Engine API 获取数据和执行操作。API 与皮肤无关——Dashboard 拿到的是引擎层数据（agent_id、status、phase），然后用皮肤的映射表渲染成主题化的 UI。

### 4.1 API 端点

```
Engine API (REST + WebSocket)
│
├── GET  /api/agents                    ← 所有 Agent 列表和状态
├── GET  /api/agents/{id}               ← 单个 Agent 详情
├── POST /api/agents/{id}/message       ← 向 Agent 发消息
│
├── GET  /api/sessions                  ← 所有活跃 Session
├── GET  /api/sessions/{id}             ← Session 详情（含 state.yaml）
├── GET  /api/sessions/{id}/outputs     ← Session 各阶段产出
│
├── GET  /api/archive/search            ← 搜索归档
├── GET  /api/archive/{id}              ← 获取归档记录
│
├── GET  /api/instances                 ← 所有实例（Nexus + Castra）状态
├── GET  /api/instances/{id}            ← 单个实例详情
│
├── GET  /api/config                    ← 当前配置
├── PUT  /api/config/theme              ← 切换皮肤
├── PUT  /api/config/roles/{id}         ← 启用/停用角色
│
├── POST /api/cohorts                   ← 创建禁卫军特勤队
├── GET  /api/cohorts                   ← 列出所有特勤队
├── PUT  /api/cohorts/{id}              ← 更新特勤队配置
│
└── WS   /ws/events                     ← WebSocket 实时事件流
```

### 4.2 WebSocket 事件流

Dashboard 通过 WebSocket 接收实时事件，无需轮询：

```
事件类型：
├── agent.status_changed     ← Agent 上线/离线
├── session.phase_changed    ← 议事/任务阶段推进
├── session.output_ready     ← 某阶段产出就绪
├── message.incoming         ← 新消息（含 Agent 间消息）
├── alert.fired              ← 告警触发
├── instance.status_changed  ← Castrum 连接状态变化
├── cohort.status_changed    ← 特勤队状态变化
└── config.changed           ← 配置变更
```

**事件格式：**

```json
{
  "type": "session.phase_changed",
  "timestamp": "2026-03-13T14:22:00Z",
  "data": {
    "session_id": "senate-20260313-001",
    "previous_phase": "cogitatio_done",
    "current_phase": "contentio_running",
    "details": {
      "blue_team": ["s-macro", "s-tech"],
      "red_team": ["s-risk"]
    }
  }
}
```

Dashboard 拿到这个事件后，根据皮肤渲染：
- 罗马皮肤：元老院大殿场景切换，蓝军元老头像移到左边，红军移到右边，中间出现对抗动画
- 董事会皮肤：会议室白板从"头脑风暴"翻到"方案 PK"
- 海盗皮肤：议会桌从讨论模式变成决斗模式

### 4.3 渲染管线

```
Engine API 返回:
  { agent_id: "consul", status: "online", type: "orchestrator" }
      │
      ▼
Theme Resolver (皮肤解析器):
  theme.yaml.roles.orchestrator → { name: "Consul · 执政官", emoji: "⚜️", avatar: "consul.svg" }
      │
      ▼
Scene Resolver (场景解析器):
  当前上下文 → 选择场景 (home / deliberation / command / ...)
      │
      ▼
Component Renderer (组件渲染器):
  AgentCard + 场景背景 + 动画 → 最终 UI
```

**关键原则：** React 组件只认 Abstract Role（orchestrator、archivist），不认皮肤名（Consul、Secretary）。皮肤名在最后一步渲染时才替换。

---

## 5. 游戏化设计（Ludificatio）

### 5.1 游戏化不是装饰

游戏化的目的不是"好看"，而是**降低认知负荷**。多 Agent 系统的概念对普通用户很抽象——"Agent Workspace""sessions_spawn""A2A Protocol"没人想看。但"元老院正在辩论""红军发起攻击""水道官报告水位正常"立刻就懂。

### 5.2 信息层级

Dashboard 的信息按三层展示，用户可以逐层下钻：

```
Layer 1 · 全景（Conspectus）
  鸟瞰图，一眼看到全组织状态
  罗马皮肤：罗马城地图
  信息密度：低（只有颜色和图标）

    │ 点击某个建筑/区域
    ▼

Layer 2 · 场景（Scaena）
  某个功能区的详细视图
  罗马皮肤：进入元老院大殿
  信息密度：中（角色、阶段、关键数据）

    │ 点击某个角色/事件
    ▼

Layer 3 · 细节（Particulae）
  单个 Agent / Session / 消息的完整信息
  罗马皮肤：展开某位元老的发言卷轴
  信息密度：高（完整文本、日志、配置）
```

### 5.3 核心游戏化元素

| 元素 | 引擎数据 | 游戏化表现 | 目的 |
|------|---------|-----------|------|
| Agent 状态 | online/offline | 角色在岗/离岗动画 | 一眼看到系统健康度 |
| 议事进度 | phase 1/2/3/4 | 阶段进度条 + 场景切换 | 知道讨论到哪了 |
| 红蓝对抗 | Phase 2 outputs | 左右对峙的视觉布局 | 直观感受方案的攻防 |
| 投票 | Phase 3 votes | 投票动画 + 实时计数 | 参与感 |
| 任务执行 | DAG batch progress | 军团行军路线图 | 知道哪个任务在跑 |
| 告警 | alert message | 烽火/警报 + 震动 | 立刻注意到问题 |
| 成就归档 | archive record | 勋章/奖杯墙 | 组织记忆可视化 |
| API 配额 | cost data | 资源仪表盘 | 成本意识 |
| Castrum 状态 | instance heartbeat | 行省地图连线 | 多实例全局视图 |

### 5.4 不做什么

- **不做积分/等级系统** — 这不是社交游戏，用户不需要"升级"
- **不做成就解锁** — Agent 完成任务不需要弹成就
- **不做排行榜** — 元老之间不需要竞争
- **不做抽卡/随机** — 选人是严肃的匹配，不是抽奖

游戏化的边界：**用游戏的隐喻降低理解门槛，但不引入游戏的激励机制**。用户是在做真实的工作，不是在玩。

---

## 6. 技术架构

### 6.1 前端

```
React (已有 SPQA.jsx 作为原型)
├── ThemeProvider          ← 加载 theme.yaml，提供 context
├── SceneManager           ← 根据当前操作切换场景
├── pages/
│   ├── Conspectus         ← Layer 1: 全景鸟瞰
│   ├── Deliberation       ← Layer 2: 议事实况
│   ├── Command            ← Layer 2: 禁卫军指挥
│   ├── Archive            ← Layer 2: 归档检索
│   ├── Monitor            ← Layer 2: 系统监控
│   └── Config             ← Layer 2: 配置管理
├── components/
│   ├── AgentCard          ← 角色卡片（头像 + 状态 + 名字）
│   ├── SessionTimeline    ← 议事/任务的阶段时间线
│   ├── MessageBubble      ← 消息气泡（主题化样式）
│   ├── VotePanel          ← 投票面板
│   ├── DagView            ← DAG 可视化
│   ├── InstanceMap        ← 多实例拓扑图
│   └── AlertBanner        ← 告警横幅
└── engine/
    ├── api.ts             ← Engine API 客户端
    ├── ws.ts              ← WebSocket 事件订阅
    └── themeResolver.ts   ← 把 agent_id 映射为皮肤名
```

### 6.2 后端（Engine API Server）

Engine API Server 是一个轻量中间层，介于 Dashboard 和 OpenClaw 之间：

```
Dashboard (React)
    │
    ▼ REST + WebSocket
Engine API Server (Node/Python)
    │
    ├── OpenClaw Nexus (sessions_send / sessions_history / file read)
    ├── OpenClaw Castrum-α (A2A HTTP)
    └── OpenClaw Castrum-β (A2A HTTP)
```

**为什么需要这层？**
- OpenClaw 的 API 不是为 Dashboard 设计的，需要聚合和转换
- WebSocket 事件流需要有人监听 OpenClaw 的变化并推送
- 皮肤切换等配置管理逻辑放在这里
- 多实例状态聚合

**MVP 可以简化：** 直接在 Dashboard 前端调用 OpenClaw API（如果 OpenClaw 支持 CORS），跳过中间层。中间层在 V1 引入。

### 6.3 部署

```
最小部署（开发）：
  OpenClaw (localhost:18789) + Dashboard (localhost:3000)
  Dashboard 直连 OpenClaw API

标准部署：
  OpenClaw Nexus + Engine API Server + Dashboard (同一台机器)
  Castrum 在远端机器

生产部署：
  Dashboard 部署为静态站点（Vercel/Netlify/self-hosted）
  Engine API Server 部署在 Nexus 同机
  通过 HTTPS 连接
```

---

## 7. 用户体验流

### 7.1 日常使用

```
用户打开 Dashboard
  │
  ├── 看到全景图（Layer 1）
  │     • 所有 Agent 的状态一目了然
  │     • 活跃议事/任务的进度
  │     • 未读告警（如果有）
  │
  ├── 想和 Orchestrator 对话
  │     → 点击 Orchestrator 头像（或直接打字）
  │     → 进入对话界面
  │     → 对话可以触发议事、任务等
  │
  ├── 想看议事实况
  │     → 点击"元老院"建筑（或导航到 Deliberation）
  │     → 看到当前阶段、各元老发言、投票进度
  │     → 可以审批决议、下达 Veto
  │
  └── 收到告警
        → 全景图上烽火台亮起（或顶部横幅）
        → 点击查看详情
        → 采取行动（直接回复 Agent 或手动介入）
```

### 7.2 议事实况视图（核心体验）

这是 Dashboard 最有价值的视图——把 LLM 多 Agent 讨论变成可视化的辩论实况：

```
┌──────────────────────────────────────────────────────────────┐
│  Curia Julia · 元老院大殿                    Phase 2 / 4  ▓▓▒░│
│                                                              │
│  Quaestio: SPQA 产品定价策略                                  │
│                                                              │
│  ┌─────────────────────┐    VS    ┌────────────────────────┐ │
│  │  蓝军 Defensores     │          │  红军 Oppugnatores      │ │
│  │                     │          │                        │ │
│  │  🎓 Oeconomicus     │          │  🎓 Cautus             │ │
│  │  🎓 Architectus     │          │     "找出至少 3 个       │ │
│  │                     │          │      致命缺陷"          │ │
│  │  📄 蓝军方案         │    ⚔️    │  📄 攻击报告            │ │
│  │  [展开查看]          │          │  [展开查看]             │ │
│  └─────────────────────┘          └────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Timeline                                                 ││
│  │ ✅ Phase 1 Cogitatio ── ▶️ Phase 2 Contentio ── ○ Phase 3 ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  [📜 查看 Phase 1 汇总]  [⏸ 暂停议事]  [🏛 凯撒裁决]         │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 多实例全景视图

```
┌──────────────────────────────────────────────────────────────┐
│  Imperium Romanum · 帝国全景                                  │
│                                                              │
│       ┌─────────┐                                            │
│       │  Nexus   │ 🟢 Online                                 │
│       │ 主实例    │ Agents: 3/3 ✓                             │
│       │ CPU: 23% │ Sessions: 2 active                        │
│       └────┬─────┘                                           │
│            │                                                 │
│     ┌──────┴──────────┐                                      │
│     │                 │                                      │
│  ┌──▼──────┐    ┌─────▼─────┐                                │
│  │Castrum-α│    │Castrum-β  │                                │
│  │量化交易  │ 🟢 │舆情监控   │ 🟢                              │
│  │Co-loc   │    │Cloud     │                                 │
│  │PnL: +2.3%│   │Alerts: 0 │                                │
│  └─────────┘    └──────────┘                                 │
│                                                              │
│  [+ 部署新 Castrum]  [📊 全局资源报告]                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. 与现有设计的关系

### 8.1 消费 A2A_PROTOCOL.md

Dashboard 通过 Engine API 获取的消息，底层就是 A2A 协议的消息。Engine API Server 解析 `[SPQA-MSG]` 信封，提取 type/priority/from/to，然后通过 WebSocket 推送给 Dashboard。Dashboard 根据消息类型渲染不同的 UI 组件。

### 8.2 消费 MULTI_INSTANCE.md

Dashboard 的多实例全景视图直接对应 Nexus/Castrum 拓扑。Dashboard 通过 Engine API Server 聚合所有实例的状态。Castrum 降级时，Dashboard 上对应的连线变红/断裂。

### 8.3 扩展 THEME_SYSTEM.md

theme.yaml 新增 `dashboard` 部分（场景、布局、动画、音效）。原有的 roles/terminology/style 继续服务于 SOUL.md 模板化和 Gateway 消息展示。Dashboard 是皮肤最完整的载体——它把 theme.yaml 的每一个字段都用上了。

### 8.4 与 SPQA.jsx 的关系

现有的 `src/SPQA.jsx` 是架构可视化原型。Dashboard 的 MVP 可以基于它扩展——保留已有的 tab 布局和信息组织，加入实时数据源和交互能力。

---

## 9. 商业化与皮肤定价

用户买皮肤买的是什么：

| 层级 | 免费（默认罗马） | 付费皮肤 | 企业定制 |
|------|-----------------|---------|---------|
| 角色命名 | ✅ | ✅ 不同主题 | ✅ 品牌定制 |
| 术语体系 | ✅ | ✅ | ✅ |
| Dashboard 场景 | 基础场景 | 精美场景 + 动画 | 公司 CI 场景 |
| 角色头像 | SVG 简笔 | 精绘头像 | 公司吉祥物/真人 |
| 音效 | 无 | 主题音效 | 品牌音频 |
| 专家池预设 | 通用 12 人 | 行业专属专家池 | 公司内部专家建模 |
| 布局模式 | 1 种 | 主题特色布局 | 自定义布局 |

**核心卖点：** 付费皮肤的 Dashboard 体验远超免费版——精美的场景、流畅的动画、沉浸的音效、贴合行业的专家池。免费版功能完整但视觉朴素，付费版让你「享受」使用 AI Agent 的过程。

---

## 10. 配置系统（Configuratio）

OpenClaw 当前的配置体验是它最大的痛点之一——散落在十几个 markdown 和 YAML 文件里，没有统一入口，改错一个缩进整个 Agent 就挂了。Dashboard 要彻底解决这个问题。

### 10.1 双路径配置

```
┌────────────────────────────────────────────────────────┐
│                    配置双路径                             │
│                                                        │
│   路径 A · 可视化面板               路径 B · 配置专家     │
│   ┌──────────────────┐         ┌──────────────────┐   │
│   │  分类卡片式 UI     │         │  💬 常驻对话窗口   │   │
│   │  滑块/开关/下拉    │         │  "我想加个区块链   │   │
│   │  所见即所得        │         │   方面的元老"      │   │
│   │  适合已知选项      │         │  配置专家自动完成   │   │
│   └────────┬─────────┘         └────────┬─────────┘   │
│            │                            │              │
│            └────────────┬───────────────┘              │
│                         ▼                              │
│              Engine API → 修改配置文件                    │
│              openclaw.json / SOUL.md / AGENTS.md / ...  │
│              OpenClaw 热加载，无需重启                     │
└────────────────────────────────────────────────────────┘
```

**路径 A（可视化面板）**：适合浏览、微调、开关类操作。用户看到的是卡片、滑块、开关，不是 YAML。

**路径 B（配置专家 Agent）**：Dashboard 里常驻一个配置专家。用户不懂或者不想动手时，直接说诉求，配置专家翻译成具体操作执行。这是 SPQA 的 UX 杀手锏——**用自然语言配置系统**。

### 10.2 配置专家 Agent（Praefectus Fabrum · 工程长）

Dashboard 常驻的配置专家，专门负责系统配置和调优。

**角色定义：**

| 属性 | 说明 |
|------|------|
| Abstract Role | `configurator` |
| 罗马皮肤名 | Praefectus Fabrum · 工程长 |
| 运行位置 | Dashboard 内嵌（不是独立 OpenClaw Agent） |
| 触发方式 | 用户在配置页面发起对话 |
| 知识领域 | OpenClaw 全部配置项 + SPQA 架构 + 最佳实践 |

**工程长不是一个独立的 Always-on Agent**，而是 Dashboard 内嵌的 LLM 调用，用专门的 System Prompt 驱动。这样做的原因：
- 配置操作需要直接读写文件系统，走 Engine API 更安全
- 不需要 7×24 运行，只在用户打开配置页面时激活
- 不占用 OpenClaw 的 Agent 额度

**交互示例：**

```
用户：我想加一个懂区块链的元老

工程长：好的，我来帮你创建。几个问题：
  1. 这位元老的专长是什么方向？（DeFi/NFT/基础设施/合规/全栈）
  2. 他的评判标准偏向什么？（技术可行性/投资回报/安全风险）

用户：DeFi 方向，偏技术可行性

工程长：已创建 Senator Catena（链上分析师）：
  - 文件：senators/s-chain.md
  - 标签：blockchain, DeFi, smart-contract, protocol
  - 视角：从链上数据和协议机制评估方案的技术可行性
  - 评判标准：协议安全性 > 技术创新性 > Gas 效率 > 生态兼容性

  元老池已更新为 13 人。需要调整吗？
```

```
用户：heartbeat 太频繁了，改成 1 小时一次

工程长：已修改。变更内容：
  - agents.defaults.heartbeat.every: 30m → 60m
  - 影响：所有 Agent 的心跳间隔从 30 分钟变为 60 分钟
  - 注意：水道官的健康检查也会变慢，确认？

用户：确认

工程长：已生效，OpenClaw 已热加载配置。
```

```
用户：我想接入 Telegram

工程长：我来引导你完成 Telegram 接入。
  ① 先创建一个 Telegram Bot：
     → 打开 Telegram，搜索 @BotFather
     → 发送 /newbot，按提示设置名称
     → 你会得到一个 Bot Token

  把 Token 告诉我，我来完成剩下的配置。

用户：7123456789:AAH...（token）

工程长：已配置完成：
  - Gateway Channel 已添加 Telegram
  - Consul 已绑定该 Channel
  - 你现在可以在 Telegram 上和执政官对话了

  要测试一下吗？
```

### 10.3 OpenClaw 配置映射

Dashboard 把 OpenClaw 的原始配置文件映射为用户友好的分类面板。

**配置分类：**

| 配置区 | 皮肤名（罗马） | 管理内容 | 底层文件 |
|--------|-------------|---------|---------|
| 模型设置 | 神谕配置 | LLM 模型选择、温度、上下文长度 | openclaw.json → agents.defaults |
| 消息通道 | 驿站管理 | Telegram/Discord/Slack 接入 | openclaw.json → channels |
| 角色管理 | 官职任免 | 启用/停用角色、调整权限 | role-meta.yaml + AGENTS.md |
| 元老池 | 元老名册 | 添加/编辑/删除元老模板 | senators/s-*.md |
| 特勤队 | 军营编制 | 创建/编辑/解散特勤队 | cohorts/*/cohort-meta.yaml |
| 工具权限 | 兵器库 | 各角色可用的工具/Skill | TOOLS.md |
| 心跳与巡检 | 水道日程 | Heartbeat 频率、巡检周期 | HEARTBEAT.md + cron config |
| 记忆管理 | 史馆管理 | 上下文裁剪、压缩策略、记忆容量 | openclaw.json → contextPruning |
| 成本控制 | 国库预算 | API 配额告警阈值、模型降级策略 | 自定义 config |
| 实例管理 | 行省总督府 | Castrum 添加/移除、A2A 配置 | A2A peer config |
| 皮肤切换 | 改朝换代 | 预览和切换主题 | config.yaml → active_theme |

### 10.4 可视化面板设计

每个配置区在 Dashboard 上是一个主题化的「房间」或「区域」。进入后看到的是可视化控件，不是 YAML。

**模型设置面板：**

```
┌──────────────────────────────────────────────────────┐
│  ⚡ 神谕配置 · Model Settings                         │
│                                                      │
│  主力模型 ────────────────── [Claude Opus 4  ▼]       │
│  心跳模型（省钱）──────────── [Claude Haiku 4 ▼]       │
│                                                      │
│  温度 ──────────── 0.0 ░░░░▓░░░░░ 1.0   当前: 0.3    │
│  上下文窗口 ──────── [200k ▼]                         │
│                                                      │
│  上下文裁剪策略:                                       │
│    ○ 按时间淘汰 (cache-ttl)                           │
│    ● 滑动窗口 (sliding)   ← 推荐                      │
│    ○ 不裁剪 (none)         ⚠️ 会快速耗尽上下文         │
│                                                      │
│  压缩触发阈值 ────── [40k tokens ▼]                   │
│                                                      │
│  💬 不确定怎么选？问问工程长 →                          │
│  预估月费: ~$12.50/月（基于当前用量）                    │
└──────────────────────────────────────────────────────┘
```

**角色管理面板：**

```
┌──────────────────────────────────────────────────────┐
│  🏛 官职任免 · Role Management                        │
│                                                      │
│  核心卫戍（不可关闭）                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐                          │
│  │ ⚜️    │ │ 📚   │ │ 🌐   │                          │
│  │执政官  │ │ 史官  │ │水道官 │                          │
│  │ 🟢    │ │ 🟢   │ │ 🟢   │                          │
│  │ 在线   │ │ 在线  │ │ 在线  │                          │
│  └──────┘ └──────┘ └──────┘                          │
│                                                      │
│  可选角色                                              │
│  ┌──────┐ ┌──────┐ ┌──────────────────┐              │
│  │ 💰   │ │ 🔍   │ │                  │              │
│  │财务官  │ │探路者  │ │  + 新建角色       │              │
│  │ [OFF] │ │ [OFF] │ │                  │              │
│  │ 点击   │ │ 点击   │ │                  │              │
│  │ 启用 → │ │ 启用 → │ │                  │              │
│  └──────┘ └──────┘ └──────────────────┘              │
│                                                      │
│  点击角色卡片 → 查看详情 / 编辑 SOUL / 调整权限          │
└──────────────────────────────────────────────────────┘
```

**元老池面板：**

```
┌──────────────────────────────────────────────────────┐
│  🎓 元老名册 · Senator Pool                   12 / ∞  │
│                                                      │
│  [按标签筛选 ▼]  [搜索元老...]                         │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  🎓 Senator Oeconomicus · 宏观经济学家        │    │
│  │  标签: 宏观 政策 利率 通胀                     │    │
│  │  上次参与: senate-20260312-003                │    │
│  │  [编辑] [查看历次发言] [停用]                  │    │
│  ├──────────────────────────────────────────────┤    │
│  │  🎓 Senator Architectus · 技术架构师           │    │
│  │  标签: 系统设计 API 性能 安全                  │    │
│  │  上次参与: senate-20260313-001                │    │
│  │  [编辑] [查看历次发言] [停用]                  │    │
│  ├──────────────────────────────────────────────┤    │
│  │  ...                                         │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  [+ 添加新元老]  或 💬 告诉工程长你需要什么专家          │
└──────────────────────────────────────────────────────┘
```

### 10.5 配置变更安全

所有配置变更都需要保障安全性：

**预览 + 确认**：任何配置变更在生效前，Dashboard 展示一个 diff 预览（用游戏化的方式——罗马皮肤下是"敕令预览"），用户确认后才执行。

**可回滚**：每次配置变更自动创建 Git commit。如果改出问题，Dashboard 提供「回滚到上一版本」按钮（罗马皮肤：「撤回敕令」）。

**验证**：Engine API Server 在写入前验证配置合法性（YAML 语法、必填字段、引用完整性）。不合法的配置不会写入。

**工程长的 Guardrail**：工程长执行配置变更时，遵守以下规则：
- 不能删除 required: true 的角色
- 不能关闭 Consul
- 修改模型或频率会提示预估成本变化
- 涉及安全的变更（工具权限、emergency_direct）需要二次确认

### 10.6 OpenClaw 原始配置文件 → Dashboard 映射表

| OpenClaw 文件 | Dashboard 面板 | 可视化控件 |
|-------------|-------------|-----------|
| `openclaw.json` → model | 神谕配置 | 下拉选择器 |
| `openclaw.json` → contextPruning | 神谕配置 | 单选按钮组 + 滑块 |
| `openclaw.json` → heartbeat | 水道日程 | 时间间隔选择器 |
| `openclaw.json` → channels | 驿站管理 | 通道卡片 + 连接向导 |
| `SOUL.md` | 角色详情页 | 富文本编辑器（带模板变量高亮） |
| `AGENTS.md` | 角色详情页 | 分区表单（行为、限制、风格） |
| `TOOLS.md` | 兵器库 | 勾选列表 + 权限矩阵 |
| `HEARTBEAT.md` | 水道日程 | 结构化编辑器（触发条件 + 动作） |
| `MEMORY.md` | 角色详情页 | 记忆条目列表（可编辑/删除） |
| `USER.md` | 凯撒档案 | 个人信息表单 |
| `role-meta.yaml` | 官职任免 | 角色卡片 + 开关 + 属性编辑 |
| `senators/s-*.md` | 元老名册 | 元老卡片 + 视角编辑器 |
| `cohorts/*/cohort-meta.yaml` | 军营编制 | 队伍编辑器 + 成员管理 |
| A2A peer config | 行省总督府 | 实例拓扑图 + 连接表单 |
| `themes/*/theme.yaml` | 改朝换代 | 皮肤预览画廊 |

### 10.7 首次安装向导（Initium）

新用户第一次打开 Dashboard 时，由工程长引导完成初始配置：

```
工程长：欢迎来到 SPQA！我是工程长，负责帮你搭建整套系统。

  几个快速问题，让我帮你配好：

  ① 你主要用什么 LLM？
     ○ Claude (推荐)
     ○ GPT-4
     ○ 其他（稍后配置）

  ② 你想通过什么平台和系统对话？
     □ Telegram (推荐，最成熟)
     □ Discord
     □ Slack
     □ 稍后配置

  ③ 你的使用场景是？（帮我推荐合适的元老池）
     ○ 产品开发（默认 12 人元老池）
     ○ 投资分析（金融专家加强）
     ○ 内容创作（创意专家加强）
     ○ 通用（默认配置）

  好的！3 分钟配置完成。你的 SPQA 系统已就绪：
  ✅ 执政官 — 在线
  ✅ 史官 — 在线
  ✅ 水道官 — 在线
  ✅ 12 位元老待命
  ✅ Telegram 已连接

  现在可以在 Telegram 上跟执政官说话了。
  有任何配置问题随时来找我。
```

---

## 11. 实现优先级

### MVP — 功能验证

- 基于 SPQA.jsx 扩展
- 接入 OpenClaw API（直连，无中间层）
- 罗马皮肤硬编码
- 核心视图：全景 + 对话 + 议事实况
- 基础配置面板（模型选择 + 角色开关）
- 工程长 MVP（Dashboard 内嵌 LLM，处理简单配置问答）
- 首次安装向导（Initium）
- 无实时推送（轮询）

### V1 — 完整体验

- Engine API Server 中间层
- WebSocket 实时事件
- theme.yaml 驱动渲染（皮肤可切换）
- 完整六个 Layer 2 视图
- 多实例全景
- 完整配置系统（全部 11 个配置区 + 工程长完整能力）
- 配置变更 Git 回滚
- 配置验证与安全 Guardrail

### V2 — 商业化

- 皮肤商城
- 第二套官方皮肤（建议"董事会"，受众最广）
- 皮肤创作工具（theme.yaml 编辑器 + 预览）
- 皮肤安装/卸载
- 社区皮肤上传

---

## 12. 设计约束

**对话优先，面板辅助。** 大部分操作——包括配置——优先通过和 Agent 对话完成（工程长处理配置，执政官处理业务），可视化面板用于浏览和微调。复杂配置让工程长引导完成，不要让用户填表单。

**皮肤不影响功能。** 免费皮肤和付费皮肤在功能上完全一致。付费皮肤只是视觉/听觉/交互体验更好。这是公平性底线。

**场景资源懒加载。** 皮肤的场景图片/动画/音效可能很大。只在用户进入对应场景时加载，不预加载全部资源。
