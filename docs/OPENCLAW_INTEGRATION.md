# OpenClaw Integration · SPQA × OpenClaw 集成方案

> 把 SPQA 架构映射到 OpenClaw 的概念和 API 上
>
> **注意：** 本文档为早期集成方案。临时 Agent（元老、军团兵）的实现已从"创建 Workspace 目录"改为 `sessions_spawn` 隔离会话方案。详见 `OPENCLAW_BASELINE.md` 第 4-5 节。

---

## 1. 概念映射

| SPQA 概念 | OpenClaw 对应 | 说明 |
|-----------|-------------|------|
| Agent 角色 | Agent Workspace | 每个角色 = 一个独立的 Workspace |
| SOUL.md | SOUL.md | 完全一致，直接用 |
| role-meta.yaml | AGENTS.md + HEARTBEAT.md | 角色配置拆分到 OpenClaw 的标准文件 |
| 凯撒消息入口 | Channel (Telegram/Discord/Slack) | 凯撒通过消息平台和执政官对话 |
| 角色间通讯 | A2A Protocol / sessions_send | Agent 间用 A2A 协议或 sessions_send |
| 定时任务 | Cron Jobs | 水道官巡检、探路者日报等 |
| 元老模板 | SOUL.md 文件池 | senators/ 目录就是元老模板池 |
| 军团兵实例化 | `sessions_spawn` | 执政官通过 spawn 创建隔离会话（不创建 Workspace） |
| 军团兵销毁 | spawn cleanup | `cleanup: "archive"` 保留记录或 `"delete"` 直接清理 |
| 史官知识库 | Workspace 文件系统 + Memory | markdown 文件 + 向量搜索 |
| Skill/工具 | OpenClaw Skills (MCP) | 对接 ClawHub 生态 |

---

## 2. Workspace 结构映射

### 执政官 (Always-on)

```
~/.openclaw/agents/consul/
├── SOUL.md              ← agents/consul/SOUL.md
├── AGENTS.md            ← 由 role-meta.yaml 生成
├── HEARTBEAT.md         ← 心跳配置
├── USER.md              ← 凯撒的个人偏好
├── TOOLS.md             ← 可用工具声明
├── MEMORY.md            ← 长期记忆
├── memory/              ← 日志
├── skills/
│   ├── praetor/              ← 裁判官（议题分析+元老匹配）
│   │   └── SKILL.md
│   ├── ordo-deliberandi/     ← 议事编排（四阶段）
│   │   └── SKILL.md
│   ├── iter-legionum/        ← 军团兵 DAG 编排
│   │   └── SKILL.md
│   └── condottiere/          ← 佣兵调度（ACP 外部工具管理）
│       └── SKILL.md
└── workspace/
    ├── active/               ← 进行中的议事/任务状态
    └── mercenarii/           ← 佣兵任务记录
```

**关键决策：裁判官（Praetor）不是独立 Agent，而是执政官的 Skill。**

这跟 SPQA 架构设计一致——裁判官是执政官的 subagent。在 OpenClaw 里，最自然的实现是把裁判官做成执政官的一个 skill，执政官调用它来分析议题和选人。

### 史官 (Always-on)

```
~/.openclaw/agents/annalist/
├── SOUL.md              ← agents/annalist/SOUL.md
├── AGENTS.md
├── MEMORY.md
├── memory/
├── archive/             ← 归档目录
│   ├── acta-senatus/    ← 元老院决议归档
│   ├── acta-legionum/   ← 军团执行归档
│   └── index.md         ← 归档索引（frontmatter 标签检索）
└── workspace/
```

### 水道官 (Always-on)

```
~/.openclaw/agents/curator/
├── SOUL.md              ← agents/curator/SOUL.md
├── AGENTS.md
├── HEARTBEAT.md         ← 6 小时巡检周期
├── skills/
│   ├── health-check/
│   └── cost-tracker/
└── workspace/
    └── reports/         ← 巡检和成本报告
```

### 元老 (Ephemeral) — ~~Workspace~~ → sessions_spawn

~~元老不是常驻 Agent。议事时由执政官动态创建 Workspace 目录。~~

**修正（2026-03-13）：** 元老通过 `sessions_spawn` 创建隔离会话，不需要文件系统上的 Workspace 目录。

```
Consul → sessions_spawn({
  prompt: BASE_TEMPLATE + s-{id}.md + 议题上下文,  // ≤15k 字符
  cleanup: "archive"                                // 保留讨论记录
})
→ { runId, childSessionKey }
```

- 元老的身份和视角通过 spawn prompt 注入
- 隔离会话保证 Phase 1 元老间互不可见
- `cleanup: "archive"` 保留 transcript 供史官归档
- 议事状态存在 `consul/workspace/active/` 而非独立目录

### 军团兵 (Ephemeral) — ~~Workspace~~ → sessions_spawn

**同上修正：** 军团兵也通过 `sessions_spawn` 创建，不需要 Workspace。

```
Consul → sessions_spawn({
  prompt: Senatus Consultum 中的任务描述 + 交付标准,
  cleanup: "archive" | "delete"   // 关键任务 archive，琐碎任务 delete
})
```

- 按 DAG 批次 spawn，每批次并发 ≤5
- 上游军团兵的输出通过 `context_from` 注入下游 prompt

### 禁卫军特勤队 (Project-persistent)

```
~/.openclaw/agents/cohort-{id}/
├── cohort-meta.yaml
├── {member-id}/
│   ├── SOUL.md
│   ├── AGENTS.md
│   ├── MEMORY.md        ← 特勤队成员有持久记忆
│   └── workspace/
├── {member-id}/
│   └── ...
└── shared/              ← 队内共享文件
```

特勤队成员是持久化 Agent，有各自的 MEMORY.md，跨会话保留上下文。

---

## 3. 通讯架构

### 凯撒 ↔ 执政官

```
凯撒 (Telegram/Discord/Slack)
    │
    ▼
OpenClaw Gateway (WebSocket :18789)
    │
    ▼
Consul Agent Workspace
```

凯撒选择任一消息平台和执政官对话。OpenClaw 的多 Channel 架构天然支持这个——同一个 Agent 在不同平台保持统一上下文。

### 执政官 ↔ 其他角色

```
Consul ──A2A Protocol──→ Annalist
       ──A2A Protocol──→ Curator
       ──sessions_spawn──→ Senate (创建临时会话)
       ──sessions_spawn──→ Legion (创建临时会话)
```

- **Always-on 角色**：用 A2A Protocol（HTTP chat/briefing/ping）
- **Ephemeral 角色**：用 sessions_spawn 创建隔离会话

### 元老院内部

```
Phase 1 (并行，互不可见)：
  Consul ──sessions_spawn──→ Senator A (isolated)
  Consul ──sessions_spawn──→ Senator B (isolated)
  Consul ──sessions_spawn──→ Senator C (isolated)

Phase 2+ (需要看到彼此输出)：
  Consul 汇总 Phase 1 → 作为上下文注入 Phase 2 的 prompt
```

**关键：元老之间不直接通讯。** 所有阶段转换由执政官编排，元老只看到执政官发给他们的信息。这用 OpenClaw 的 isolated session 天然实现。

### 禁卫军内部

```
Cohort members ──A2A Protocol──→ 互相通讯（允许横向）
Commander ──A2A Protocol──→ Caesar（通过 Gateway channel）
```

特勤队成员之间用 A2A 的 chat intent 自由通讯。指挥官通过 Gateway 向凯撒汇报。

---

## 4. 动态 Agent 管理

### 元老院议事启动

执政官的 ordo-deliberandi skill 执行以下流程：

```
1. 读取裁判官推荐的元老清单
2. 为每位元老：
   a. 合并 BASE_TEMPLATE.md + s-{id}.md → 生成完整 prompt（≤15k 字符）
   b. sessions_spawn({ prompt, cleanup: "archive" })
      → 并发 ≤6，返回 { runId, childSessionKey }
3. 在 consul/workspace/active/ 创建 session-meta.yaml 记录本次议事
4. 按阶段顺序编排讨论（Phase 1 → 汇总 → Phase 2 → ...）
5. 议事结束后：
   a. 收集所有产出 + archived transcripts
   b. 交给史官归档
```

### 军团兵征召

```
1. 读取 Senatus Consultum 中的 Legionarii 清单
2. 解析依赖 DAG（含 depends_on + context_from）
3. 为每个军团兵：
   a. 从 Consultum 提取任务描述 + 交付标准 → 生成 prompt
   b. 注入上游 context_from 的产出
   c. sessions_spawn({ prompt, cleanup })
4. 按 DAG 批次启动（每批次并发 ≤5）
5. 监控执行，验收后交史官归档
```

---

## 5. Skill 生态对接

SPQA 各角色需要的工具能力，优先从 ClawHub（13,700+ skills）中获取：

| SPQA 工具需求 | ClawHub 对应 | 备注 |
|-------------|-------------|------|
| 文件读写 | 内置 file tools | OpenClaw 原生支持 |
| 日历 API | Google Calendar skill | ClawHub 有现成 |
| 网页搜索 | Web search skill | ClawHub 有现成 |
| RSS 阅读 | RSS reader skill | ClawHub 有现成 |
| 通知推送 | 通过 Channel 直接推送 | 原生支持 |
| 社交媒体 API | Twitter/X skill 等 | ClawHub 有部分 |
| 系统监控 | 需自建 skill | 监控 OpenClaw 自身 |
| API 成本追踪 | 需自建 skill | 统计各 LLM 调用 |
| Agent 实例化 | Mission Control API | 核心编排能力 |
| 电子表格 | Spreadsheet skill | ClawHub 有现成 |

**需要自建的 SPQA 专属 Skills：**
1. `spqa-senate` — 元老院议事编排（核心）
2. `spqa-legion` — 军团兵生命周期管理
3. `spqa-cohort` — 特勤队管理
4. `spqa-cost-tracker` — API 成本追踪
5. `spqa-health-monitor` — 系统健康监控

---

## 6. 存储方案

全部基于文件系统 + markdown，不引入数据库：

```
~/.openclaw/
├── agents/               ← Agent Workspaces
│   ├── consul/
│   ├── annalist/
│   ├── curator/
│   ├── explorator/       ← 可选，启用后才有
│   ├── quaestor/         ← 可选
│   └── cohort-*/         ← 特勤队
├── spqa/                 ← SPQA 共享配置
│   ├── senators/         ← 元老模板池
│   ├── cohort-templates/ ← 特勤队模板
│   └── config.yaml       ← 全局配置
└── archive/              ← 史官管理的归档（或在 annalist workspace 内）
```

**检索方案：**
- MVP：文件名约定 + YAML frontmatter 标签 + grep 全文搜索
- 进阶：OpenClaw 内置的向量索引，对 archive/ 目录做语义搜索

---

## 7. 实现优先级

### Phase 1 · 最小可运行（1-2 周）

1. **执政官 Workspace** — SOUL.md + 基础工具，能接收凯撒消息
2. **裁判官 Skill** — 实现元老匹配逻辑
3. **元老院 Skill** — 实现四阶段编排（先支持 3 人组阁）
4. **史官 Workspace** — 基础归档功能
5. **消息通道** — 接入一个平台（推荐 Telegram，OpenClaw 最成熟的集成）

### Phase 2 · 完整核心（2-4 周）

6. **水道官 Workspace** — 健康监控 + 成本追踪
7. **军团兵管理** — 动态创建/销毁/DAG 编排
8. **多 Channel** — 接入更多消息平台

### Phase 3 · 扩展功能

9. **禁卫军** — 特勤队创建和管理
10. **可选角色** — 探路者、财务官
11. **Dashboard** — Web UI 管理界面
12. **ClawHub 发布** — 把 SPQA skills 发布到 ClawHub
