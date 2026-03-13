# OpenClaw 基线 · Baseline v2026.3.11

> 跟随上游，零修改，纯上层适配

---

## 1. 核心原则

**SPQA 不修改 OpenClaw 的任何一行代码，跟随上游版本更新。**

OpenClaw 更新非常快，SPQA 保持与上游同步。当前基于 v2026.3.11 开发，持续跟进新版本。只有在以下两种情况下才考虑 fork 自维护：(1) SPQA 功能和体验足够稳定，不再依赖上游新功能；(2) 出现路线差异，上游方向与 SPQA 需求冲突。

| 规则 | 说明 |
|------|------|
| 跟随上游 | 当前基于 v2026.3.11，持续跟进 OpenClaw 新版本 |
| 零修改 | 不 fork、不 patch、不 monkey-patch OpenClaw |
| 纯配置 | 所有定制通过 openclaw.json + SOUL.md + AGENTS.md 等标准文件完成 |
| 纯 Skill | 所有编排逻辑通过自建 Skill 实现，不修改 OpenClaw 核心 |
| 升级友好 | 新版本发布时验证兼容性，通过即升级 |
| 远期独立 | 功能稳定或路线分歧时，可 fork 自维护 |

**如果某个功能当前版本做不到，我们绕过它或等上游支持，而不是改它。**

---

## 2. OpenClaw 3.11 能力清单

### 2.1 可用原语

| 原语 | 说明 | SPQA 用法 |
|------|------|----------|
| `sessions_send` | 向另一个 Agent Session 发送消息，同步等待回复 | 持久化角色间 A2A 通讯（Consul ↔ Annalist / Curator） |
| `sessions_spawn` | 创建隔离子会话，非阻塞返回 `{ status, runId, childSessionKey }` | 元老实例化、军团兵实例化 |
| `sessions_spawn({ runtime: "acp" })` | 调用外部 AI 工具（ACP 协议），独立进程隔离 | **佣兵系统**——调用 Claude Code / Codex 等外部工具 |
| ACP Dispatch + ACPX | 外部进程管理：传输、排队、取消、重连、会话持久化 | 佣兵的生命周期管理 |
| ACP Agent Registry | 19+ 已注册外部 AI 工具（Claude Code、Codex、Gemini CLI 等） | 佣兵池 |
| Gateway Channel | Telegram / Discord / Slack / WhatsApp 消息通道 | 凯撒入口 |
| A2A Protocol v0.3.0 | JSON-RPC 2.0 over HTTP(S)，Agent Card 发现 | 跨实例通讯（Nexus ↔ Castrum） |
| SOUL.md | Agent 身份、语调、边界 | 每个角色的身份定义 |
| AGENTS.md | 操作指令、记忆规则 | 每个角色的行为规范 |
| USER.md | 用户信息 | 凯撒档案 |
| BOOT.md | Gateway 重启时的启动清单 | 角色初始化检查 |
| HEARTBEAT.md | 定时任务配置 | 水道官巡检、探路者日报 |
| TOOLS.md | 可用工具声明 | 各角色工具授权 |
| MEMORY.md | 长期记忆 | 持久化角色的跨会话记忆 |
| Skills (MCP) | 工具扩展 | SPQA 自建 Skill + ClawHub 社区 Skill |
| openclaw.json | JSON5 格式全局配置 | 模型选择、Channel、心跳、上下文裁剪 |
| Hot Reload | Gateway 监听 openclaw.json 变更，自动加载 | 工程长修改配置后无需重启 |
| Workspace 文件系统 | Agent 可读写自己的 workspace 目录 | 状态文件、归档、元老模板 |

### 2.2 关键限制

| 限制 | 影响 | SPQA 应对方案 |
|------|------|-------------|
| `sessions_spawn` 子 Agent 不能再 spawn | 元老不能自己创建子任务 | 符合设计——元老只讨论不执行，执行由 Consul 编排军团兵 |
| `sessions_send` 需要 agentToAgent allow list | Agent 间通讯必须预先声明 | 在 openclaw.json 中预配置所有角色间的 allow list |
| ACP session 运行在主机（非沙箱） | 沙箱内的 session 不能 spawn ACP | Consul 必须非沙箱模式，或通过 Engine API 代理 ACP 调用 |
| openclaw.json 严格校验 | 未知 key、格式错误会导致 Gateway 拒绝启动 | 工程长的配置写入必须经过 Engine API 验证层 |
| ClawHub 12% 恶意 Skill | 安全风险 | SPQA 只使用白名单 Skill，不自动安装社区 Skill |
| 无内置 Dashboard API | OpenClaw 没有为 Dashboard 设计 REST/WebSocket API | Engine API Server 中间层聚合数据 |
| 无内置多实例管理 | OpenClaw 不管理 Nexus/Castrum 拓扑 | SPQA Engine API 层实现 |
| 无内置配置 UI | 配置全靠手编 markdown/JSON5 | Dashboard 配置系统（工程长 + 可视化面板） |

### 2.3 Session 模型

OpenClaw 的 session 有两个核心概念：

| 概念 | 格式 | 用途 |
|------|------|------|
| **SessionKey** | `agent:<agentId>:<baseKey>` | 稳定路由标识符，用于 sessions_send 寻址 |
| **SessionId** | transcript 文件名 | 内部存储标识，不用于路由 |

**dmScope 模式**（会话隔离粒度）：

| 模式 | 说明 | SPQA 建议 |
|------|------|----------|
| `main` | 所有对话共用一个 session | Consul（统一上下文、多渠道统一记忆） |
| `per-peer` | 每个对话伙伴独立 session | Annalist（按来源角色隔离归档） |
| `per-channel-peer` | 按 channel + peer 隔离 | 备选——多 channel 部署时考虑 |

### 2.4 API 精确签名

**sessions_send：**

```
sessions_send({
  sessionKey: "agent:annalist:consul",  // 目标 agent + 来源标识
  message: "归档这份决议...",
  timeoutSeconds?: 30                    // 可选，设置后同步阻塞等待
})
```

- 无 `timeoutSeconds` → 发送即返回（fire-and-forget）
- 有 `timeoutSeconds` → 阻塞等待回复，超时报错
- **SPQA 用法：** Consul → Annalist 归档用无超时（不阻塞），Consul → Curator 健康检查用 `timeoutSeconds: 30`

**sessions_spawn：**

```
sessions_spawn({
  prompt: "...",                         // 子 session 的完整 prompt
  runtime?: "subagent" | "acp",         // 默认 subagent
  agent?: "claude-code",                // 仅 runtime: "acp" 时有效
  cleanup?: "delete" | "archive",       // 子 session 结束后处理
  thread?: true,                        // 是否绑定到当前对话线程
  mode?: "run" | "session"              // run=一次性执行，session=持久会话
})
→ 返回 { status, runId, childSessionKey }
```

- `cleanup: "archive"` → 保留 transcript（适合元老院——讨论记录供史官归档）
- `cleanup: "delete"` → 直接删除（适合琐碎军团兵任务）
- **SPQA 用法：** 元老 spawn 用 `cleanup: "archive"`，军团兵按重要性选择

**sessions_list / sessions_history：**

```
sessions_list()  → 当前 agent 的所有 session 列表
sessions_history({ sessionKey, limit? })  → 指定 session 的消息历史
```

Dashboard 的"议事实况"面板通过 Engine API 调用 `sessions_history` 获取讨论记录。

### 2.5 并发限制

Gateway 是单 Node.js 进程、单线程事件循环。**8-10 个并发 sessions_send 可能触发 watchdog 重启。**

| 场景 | 并发量 | 风险 |
|------|--------|------|
| 5 元老 Phase 1 并行 spawn | 5 | 安全 |
| 5 元老 + 3 军团兵同时 | 8 | 边界危险 |
| 5 元老 + 3 军团兵 + 2 佣兵 ACP | 10 | 可能触发 watchdog |

**SPQA 应对策略：**

1. 编排层限流——ordo-deliberandi / iter-legionum skill 内置并发上限（≤6 并发 spawn）
2. 批次调度——军团兵 DAG 每批次并发不超过 5
3. 优先级：元老院议事 > 军团兵执行 > 佣兵外包
4. 远期——多 Gateway 实例（Nexus 架构已支持）

### 2.6 记忆系统

SQLite 向量索引，支持 semantic + BM25 混合搜索：

| 工具 | 功能 |
|------|------|
| `memory_search` | 语义 + BM25 关键词搜索，返回相关记忆片段 |
| `memory_get` | 按 ID 获取完整记忆条目 |
| MEMORY.md | Agent 长期记忆声明文件 |

**SPQA 影响：** Annalist 可以利用原生向量索引做归档检索，不需要额外 RAG 系统。归档文件放在 Annalist workspace 内，OpenClaw 自动建立索引。MVP 够用。

### 2.7 工具可见性

```
agents.defaults.tools.sessions.visibility: "self" | "tree" | "agent" | "all"
```

| 值 | 说明 | SPQA 用法 |
|----|------|----------|
| `self` | 只能调用自己的工具 | 默认（Annalist、Curator 等） |
| `tree` | 可看到子 agent 工具 | Consul（需调用 spawn 出的元老/军团兵） |
| `agent` | 同 agent 所有 session 工具 | 不推荐 |
| `all` | 所有 agent 工具 | 不推荐（安全风险） |

### 2.8 Bootstrap 限制

| 限制 | 值 |
|------|---|
| 单文件最大字符数 | 20,000 (bootstrapMaxChars) |
| 所有文件总字符数 | 150,000 (bootstrapTotalMaxChars) |

**SPQA 影响：** 元老 prompt（BASE_TEMPLATE + 个人模板 + 议题上下文）必须控制在 15,000 字符以内，留余量给系统开销。

### 2.9 Skills 格式

OpenClaw Skills 使用 YAML frontmatter：

```yaml
---
name: "condottiere"
version: "1.0.0"
tags: ["mercenary", "acp", "outsource"]
minOC: "2026.3.0"
provider: "spqa"
model: "anthropic/claude-sonnet-4-6"  # 可覆盖默认模型
---
```

所有 SPQA Skill 统一标注 `minOC: "2026.3.0"`, `provider: "spqa"`。`model` 字段可让特定 Skill 用不同模型（如 Praetor 用更便宜模型做快速匹配）。

### 2.10 Session 重置

| 机制 | 说明 | SPQA 建议 |
|------|------|----------|
| `idleMinutes` | 空闲 N 分钟后重置 | Consul/Annalist 不设（持久记忆），Curator 可设 60 |
| Daily reset | 每天固定时间重置 | 不用——SPQA 角色需要跨日上下文 |
| Compaction | context 接近上限时自动压缩 | 依赖 contextPruning 配置 |

### 2.11 安全基线（3.11 修复项）

v2026.3.11 修复了 CVE-2026-25253（trusted-proxy 模式下的跨站 WebSocket 劫持，CVSS 8.8）。SPQA 部署时需要确保：

- Gateway 不开启 trusted-proxy 模式（除非在反代后面）
- 所有 Agent Workspace 启用访问控制
- ClawHub Skill 安装走白名单审核
- A2A 通讯启用 shared key 认证

---

## 3. 配置文件结构

### 3.1 openclaw.json（JSON5 格式）

SPQA 使用的核心配置项：

```json5
{
  // === 模型 ===
  agents: {
    defaults: {
      model: "anthropic/claude-sonnet-4-6",  // 默认模型
      heartbeat: {
        every: "30m"                          // 心跳间隔
      },
      contextPruning: {
        strategy: "sliding",                  // 上下文裁剪
        triggerTokens: 40000
      },
      tools: {
        sessions: {
          visibility: "self"                  // 默认只能调用自己的工具
        }
      }
    },
    consul: {
      dmScope: "main",                        // 所有渠道统一上下文
      tools: {
        sessions: {
          visibility: "tree"                  // Consul 需要操作子 session
        }
      }
    },
    annalist: {
      dmScope: "per-peer"                     // 按来源角色隔离
    }
  },

  // === Agent 间通讯授权 ===
  agentToAgent: {
    allow: [
      { from: "consul",    to: "annalist" },
      { from: "consul",    to: "curator" },
      { from: "consul",    to: "explorator" },
      { from: "consul",    to: "quaestor" },
      { from: "annalist",  to: "consul" },
      { from: "curator",   to: "consul" },
      // 特勤队成员间通讯
      { from: "cohort-*",  to: "cohort-*" },
      // 特勤队指挥官可以向凯撒报告
      { from: "cohort-*",  to: "consul" }
    ]
  },

  // === 消息通道 ===
  channels: {
    telegram: {
      enabled: true,
      botToken: "***",
      boundAgent: "consul"    // 凯撒通过 Telegram 和执政官对话
    }
  },

  // === ACP 佣兵 ===
  acp: {
    dispatch: {
      enabled: true,
      backend: "acpx",
      defaultAgent: "claude-code"
    },
    agents: [
      { name: "claude-code" }    // MVP 只启用 Claude Code
    ],
    concurrentSessions: 5
  },

  // === 工具 ===
  tools: {
    webSearch: { provider: "auto" }
  }
}
```

### 3.2 Workspace 文件布局

```
~/.openclaw/
├── openclaw.json              ← 全局配置（JSON5）
├── agents/
│   ├── consul/                ← 执政官（Always-on）
│   │   ├── SOUL.md
│   │   ├── AGENTS.md
│   │   ├── USER.md
│   │   ├── BOOT.md
│   │   ├── HEARTBEAT.md
│   │   ├── TOOLS.md
│   │   ├── MEMORY.md
│   │   ├── skills/
│   │   │   ├── praetor/       ← 裁判官（Consul 的 Skill）
│   │   │   ├── ordo-deliberandi/  ← 议事编排
│   │   │   ├── iter-legionum/     ← 军团兵编排
│   │   │   └── condottiere/       ← 佣兵调度（外部 AI 工具管理）
│   │   └── workspace/
│   │       ├── active/        ← 进行中的议事/任务
│   │       └── templates/     ← 元老/军团兵模板
│   │
│   ├── annalist/              ← 史官（Always-on）
│   │   ├── SOUL.md
│   │   ├── AGENTS.md
│   │   ├── TOOLS.md
│   │   ├── MEMORY.md
│   │   └── workspace/
│   │       └── archive/       ← 归档目录
│   │
│   ├── curator/               ← 水道官（Always-on）
│   │   ├── SOUL.md
│   │   ├── AGENTS.md
│   │   ├── HEARTBEAT.md
│   │   └── workspace/
│   │
│   └── cohort-{id}/           ← 特勤队（Project-persistent）
│       ├── cohort-meta.yaml
│       ├── {member}/
│       └── shared/
│
├── spqa/                      ← SPQA 共享配置（Engine API 读写）
│   ├── senators/              ← 元老模板池
│   │   ├── BASE_TEMPLATE.md
│   │   └── s-*.md
│   ├── cohort-templates/      ← 特勤队模板
│   ├── themes/                ← 皮肤
│   │   └── spqa-roman/
│   │       └── theme.yaml
│   └── config.yaml            ← SPQA 层配置
│
└── engine/                    ← Engine API Server（SPQA 自有）
    ├── server.js
    └── config.json
```

### 3.3 SPQA 层配置 vs OpenClaw 配置

| 配置内容 | 存放位置 | 谁读 |
|---------|---------|------|
| 模型选择、心跳、裁剪 | openclaw.json | OpenClaw Gateway |
| Agent 间通讯授权 | openclaw.json → agentToAgent | OpenClaw Gateway |
| 消息通道 | openclaw.json → channels | OpenClaw Gateway |
| 角色身份 | agents/*/SOUL.md | OpenClaw Agent Runtime |
| 角色行为 | agents/*/AGENTS.md | OpenClaw Agent Runtime |
| 角色工具 | agents/*/TOOLS.md | OpenClaw Agent Runtime |
| 元老模板 | spqa/senators/*.md | SPQA Skill (ordo-deliberandi) |
| 特勤队模板 | spqa/cohort-templates/ | SPQA Skill (cohort-manager) |
| 议事/任务状态 | agents/consul/workspace/active/ | SPQA Skill |
| 皮肤 | spqa/themes/*/theme.yaml | Dashboard |
| SPQA 全局配置 | spqa/config.yaml | Engine API Server |
| 多实例拓扑 | spqa/config.yaml → instances | Engine API Server |

**关键区分：** openclaw.json 是 OpenClaw 的配置，SPQA 通过标准方式写入；spqa/ 目录是 SPQA 自己的配置，OpenClaw 不关心它。

---

## 4. SPQA 如何在 3.11 上实现核心功能

### 4.1 元老院议事

**使用的原语：** `sessions_spawn`

```
Consul 的 ordo-deliberandi skill:
  1. 读取 spqa/senators/s-*.md 选人
  2. 合并 BASE_TEMPLATE + 选中元老模板 → 生成临时 SOUL prompt（≤15k 字符）
  3. sessions_spawn({ prompt, cleanup: "archive" }) × N（并发 ≤6）
     → 返回 { runId, childSessionKey } × N
  4. 等待所有 spawn 完成（通过 childSessionKey 获取结果）
  5. 汇总 Phase 1 结果，注入 Phase 2 prompt
  6. 重复 spawn 直到四阶段完成
  7. 产出交 Annalist 归档（spawn 的 archive transcript 一并移交）
```

**不需要为每个元老创建独立 Agent Workspace。** `sessions_spawn` 创建的是隔离 Session，不是持久化 Agent。元老的身份通过 spawn 的 prompt 注入，不需要在文件系统上创建 Workspace。

**这是对之前 OPENCLAW_INTEGRATION.md 的重要修正。** 之前设计的 `~/.openclaw/agents/senate-{session-id}/` 目录结构是不必要的——sessions_spawn 已经提供了隔离环境，不需要我们手动管理临时 Workspace。

### 4.2 军团兵执行

**使用的原语：** `sessions_spawn`

同元老院，军团兵也通过 sessions_spawn 创建，不需要持久化 Workspace。Consul 的 iter-legionum skill 按 DAG 批次 spawn。

### 4.3 持久化角色间通讯

**使用的原语：** `sessions_send`

```
Consul → sessions_send(sessionKey="annalist", message="归档这份决议...")
Consul → sessions_send(sessionKey="curator", message="检查系统健康...")
Curator → sessions_send(sessionKey="consul", message="告警：API 配额接近上限...")
```

需要在 openclaw.json 的 agentToAgent.allow 中预配置所有合法通讯路径。

### 4.4 跨实例通讯（Nexus ↔ Castrum）

**使用的原语：** A2A Protocol v0.3.0

OpenClaw 3.11 原生支持 A2A，不需要额外插件。每个 OpenClaw 实例可以作为 A2A endpoint，通过 Agent Card 互相发现。

```
Nexus Consul → A2A HTTP → Castrum-α Commander
```

SPQA 的 Engine API Server 配置 A2A peer 信息：

```yaml
# spqa/config.yaml
instances:
  nexus:
    url: "http://localhost:18789"
    role: primary
  castrum-alpha:
    url: "http://quant-server:18789"
    role: satellite
    a2a_endpoint: "http://quant-server:18790"
    affinity: "quant-trading"
```

### 4.5 配置热加载

OpenClaw Gateway 监听 openclaw.json 变更，自动加载。这意味着：

- 工程长修改配置 → Engine API 写入 openclaw.json → Gateway 自动热加载
- 不需要重启 OpenClaw
- 但 openclaw.json 必须严格合法（JSON5 + schema 校验），否则 Gateway 拒绝启动

**Engine API 的验证职责：** 在写入 openclaw.json 之前，必须用 OpenClaw 的 schema 校验。如果校验失败，不写入，返回错误给工程长/Dashboard。

### 4.6 Skill 实现

SPQA 的核心编排逻辑全部作为 Consul 的 Skill 实现：

```
agents/consul/skills/
├── praetor/
│   └── SKILL.md          ← 议题分析 + 元老匹配
├── ordo-deliberandi/
│   └── SKILL.md          ← 四阶段议事编排
├── iter-legionum/
│   └── SKILL.md          ← 军团兵 DAG 编排
└── cohort-manager/
    └── SKILL.md          ← 特勤队管理
```

Skill 是 OpenClaw 标准扩展机制，完全不需要修改 OpenClaw。

---

## 5. 之前设计的修正

基于 3.11 的实际能力，对之前 OPENCLAW_INTEGRATION.md 的修正：

| 之前设计 | 修正 | 原因 |
|---------|------|------|
| 为每个元老创建 Agent Workspace 目录 | 改用 sessions_spawn，无需创建目录 | sessions_spawn 提供隔离 Session，不需要文件系统上的 Workspace |
| 为每个军团兵创建 Agent Workspace 目录 | 同上 | 同上 |
| senate-{session-id}/ 目录结构 | 删除，议事状态存在 consul/workspace/active/ | 临时 Workspace 管理是不必要的复杂度 |
| legion-{mission-id}/ 目录结构 | 同上 | 同上 |
| 裁判官作为独立 subagent | 保持为 Consul Skill | 与 3.11 的 Skill 机制更匹配 |
| 动态创建/删除 Agent Workspace via API | 不需要 | sessions_spawn 已覆盖 |

**核心简化：临时 Agent（元老、军团兵）不再需要文件系统层面的 Workspace 管理。** sessions_spawn 的隔离 Session 已经提供了所有需要的能力——独立上下文、prompt 注入、结果返回。这大幅简化了实现。

---

## 6. 版本升级策略

### 6.1 常态：跟随上游

OpenClaw 每次发布新版本时：

```
1. 阅读 changelog，识别 breaking changes 和新能力
2. 在测试环境升级 OpenClaw
3. 验证 SPQA 的 5 个自建 Skill 是否正常
4. 验证 openclaw.json 的 schema 是否有变化
5. 验证 sessions_send / sessions_spawn 的行为是否一致
6. 通过 → 升级，享受新功能和 bugfix
7. 不通过 → 记录不兼容项，提 issue 给 OpenClaw 社区
```

新版本带来的有用能力（更好的 A2A、新 Skill API、性能优化等）应积极采纳。

### 6.2 远期：独立维护的触发条件

当满足以下任一条件时，考虑 fork OpenClaw 自维护：

| 触发条件 | 说明 |
|---------|------|
| 功能稳定 | SPQA 的核心功能已完整且稳定，不再需要上游新功能 |
| 路线分歧 | OpenClaw 的发展方向与 SPQA 需求冲突（如大幅改变 API、引入不兼容设计） |
| 性能定制 | SPQA 需要对 OpenClaw 底层做性能优化（如自定义 Session 调度） |
| 安全需求 | 企业客户要求代码审计和自主可控 |

Fork 时机不急——只要零修改原则能满足需求，就继续跟随上游。**享受社区红利，但保留独立的能力。**

---

## 7. 与现有文档的关系

| 文档 | 影响 |
|------|------|
| OPENCLAW_INTEGRATION.md | 需要更新——删除临时 Workspace 目录设计，改为 sessions_spawn 方案 |
| A2A_PROTOCOL.md | 无变化——A2A v0.3.0 在 3.11 中原生支持 |
| MULTI_INSTANCE.md | 无变化——A2A 跨实例通讯可用 |
| DASHBOARD.md | 无变化——Engine API 层隔离了 OpenClaw 的 API 细节 |
| PRODUCT_FORM.md | 补充版本锁定信息 |
