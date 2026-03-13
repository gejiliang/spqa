# A2A Protocol · Agent 间通讯协议

> SPQA 内部 Agent 通讯的消息格式、路由规则与交互模式

---

## 1. 设计原则

- **LLM-First**：消息体用自然语言，Agent（LLM）直接阅读理解，不需要解析 JSON/YAML
- **标记头路由**：消息头部加少量结构化标记，供编排层（代码）做路由和追踪
- **统一信封**：所有消息类型共享同一个头部格式，降低理解门槛
- **最小必要信息**：不往消息里塞不需要的字段，Agent 只看到跟自己相关的内容

---

## 2. OpenClaw 原语映射

SPQA 的通讯基于 OpenClaw 的两个底层机制：

| OpenClaw 原语 | SPQA 用途 | 特点 |
|-------------|----------|------|
| `sessions_send` | Always-on 角色间通讯 | 同步 ping-pong，双方都是持久化 Agent |
| `sessions_spawn` | 创建临时 Agent（元老/军团兵） | 异步，结果通过 announce 返回 |
| `Gateway Channel` | 凯撒 ↔ Agent | 人类消息入口，多平台支持 |

### 配置要求

```yaml
# consul 的 AGENTS.md 中
tools:
  sessions:
    visibility: all          # 执政官可以查看所有 session
  agentToAgent:
    enabled: true
    allow: ["annalist", "curator", "explorator", "quaestor"]
  subagents:
    allowAgents: ["*"]       # 执政官可以 spawn 任何临时 Agent

# 水道官的 AGENTS.md 中
tools:
  agentToAgent:
    enabled: true
    allow: ["consul"]        # 只允许和执政官通讯
  # emergency_direct 场景走 Gateway Channel，不走 agentToAgent
```

---

## 3. 消息信封格式

所有 Agent 间消息采用统一的「标记头 + 自然语言正文」格式。

### 格式规范

```
[SPQA-MSG]
from: {发送方 agent_id}
to: {接收方 agent_id}
type: {消息类型}
priority: {优先级}
ref: {关联会话 ID，可选}
---
{自然语言正文}
```

### 字段说明

| 字段 | 必填 | 可选值 | 说明 |
|------|------|-------|------|
| from | ✅ | agent_id | 发送方标识 |
| to | ✅ | agent_id | 接收方标识 |
| type | ✅ | directive / report / alert / query / archive / heartbeat | 消息类型 |
| priority | ✅ | normal / urgent / emergency | 优先级 |
| ref | 可选 | session ID | 关联到某次议事或任务 |

### 示例

```
[SPQA-MSG]
from: consul
to: annalist
type: archive
priority: normal
ref: senate-2026-012
---
元老院第 12 次议事已结束。请归档以下决议：

议题：SPQA 产品定价策略
结论：采用 Freemium 模式，核心引擎免费，皮肤付费
参与元老：Senator Oeconomicus, Senator Mercator, Senator Fabricator
投票结果：3:0 全票通过

完整的 Senatus Consultum 见附件 /workspace/senate-2026-012/consultum.md

请按 Acta Senatus 格式归档，标签：strategy, pricing, theme-system
```

---

## 4. 消息类型详细定义

### 4.1 directive — 指令下发

**方向：** 上级 → 下级（执政官 → 办公室角色）

**正文规范：**
- 明确说清楚要做什么
- 如果有附件/文件路径，在正文里引用
- 如果有 deadline，在正文里说明

**示例：**
```
[SPQA-MSG]
from: consul
to: curator
type: directive
priority: normal
---
请对所有 Always-on Agent 执行一次健康检查，重点关注：
1. 各 Agent 最近一次响应时间
2. 当前 session 数量
3. API 调用配额剩余情况

检查完成后以 report 消息回复我。
```

### 4.2 report — 结果汇报

**方向：** 下级 → 上级（办公室角色 → 执政官）

**正文规范：**
- 开头一句话概括结论
- 如果有异常，明确标注
- 详细数据可以用简单的表格或列表

**示例：**
```
[SPQA-MSG]
from: curator
to: consul
type: report
priority: normal
---
健康检查完成，所有 Agent 运行正常。

各 Agent 状态：
- Annalist（史官）：正常，最近响应 < 2s，归档队列为空
- Curator（水道官）：正常（本机）
- Explorator（探路者）：未启用

API 配额：
- Claude API：本月已用 62%，剩余 38%，按当前速率月底前充足
- 搜索 API：本月已用 15%

无异常事项。下次巡检时间：6 小时后。
```

### 4.3 alert — 紧急告警

**方向：** 任何角色 → 执政官 或 凯撒（emergency_direct）

**正文规范：**
- 第一行必须是严重程度和问题一句话概括
- 说明影响范围
- 给出建议措施
- 是否已自动缓解

**示例（发给执政官）：**
```
[SPQA-MSG]
from: curator
to: consul
type: alert
priority: urgent
---
⚠️ WARNING: Claude API 配额已用 90%，预计 2 天内耗尽。

影响：超出配额后所有 Agent 将无法响应，包括元老院议事和军团兵执行。

已采取措施：
- 暂停非紧急的定时任务
- 降低探路者的搜索频率

建议凯撒：
1. 升级 API 配额
2. 或者暂停当前非紧急项目

请转告凯撒。
```

**示例（emergency_direct 直达凯撒）：**
```
[SPQA-MSG]
from: curator
to: caesar
type: alert
priority: emergency
---
🔴 CRITICAL: 系统全面宕机。

所有 Agent 无响应，API 返回 503 错误。执政官也无法正常工作。

这是水道官的自动紧急通知。请手动检查 OpenClaw 服务状态。
```

### 4.4 query — 查询请求

**方向：** 任意（通常是执政官查询史官）

**正文规范：**
- 说清楚要查什么
- 给出查询条件
- 说明期望的返回格式

**示例：**
```
[SPQA-MSG]
from: consul
to: annalist
type: query
priority: normal
ref: senate-2026-015
---
凯撒想了解之前关于 API 架构的讨论结论。请搜索归档：

查询条件：
- 关键词：API 架构、微服务、系统设计
- 时间范围：最近 3 个月
- 类型：Acta Senatus（元老院决议）

请返回匹配的决议摘要，每条包含：议题标题、日期、核心结论。
```

### 4.5 archive — 归档请求

**方向：** 执政官 → 史官（专用）

**正文规范：**
- 说明归档类型（Acta Senatus / Acta Legionum）
- 提供完整内容或文件路径
- 指定归档标签

**示例：** 见第 3 节的信封格式示例。

### 4.6 heartbeat — 健康探针

**方向：** 水道官 → 各 Always-on Agent

**正文规范：**
- 极简，只需要对方回复确认
- 被探测方回复 report 类型消息

**示例：**
```
[SPQA-MSG]
from: curator
to: annalist
type: heartbeat
priority: normal
---
SPQA 健康探针。请回复你的当前状态：
- 运行状态（正常/异常）
- 归档队列长度
- 最近一次归档时间
```

---

## 5. 路由规则

### 5.1 常规路由矩阵

```
凯撒 ←→ 执政官 ←→ 史官
                  ←→ 水道官
                  ←→ 探路者（如启用）
                  ←→ 财务官（如启用）
                  ←→ 自定义角色

凯撒 ←→ 禁卫军指挥官
```

**原则：** 除禁卫军外，所有角色通过执政官中转。

### 5.2 emergency_direct 路径

配置了 `emergency_direct: true` 的角色，在 priority 为 emergency 时，可以绕过执政官直接通知凯撒。

**实现方式：** 该角色同时配置 agentToAgent（对接执政官）和 Gateway Channel 写入权限（对接凯撒的消息平台）。代码层根据 priority 字段选择路由。

```
正常消息：  curator --sessions_send--> consul
紧急消息：  curator --Gateway Channel--> Caesar (Telegram/Discord)
```

### 5.3 路由决策流程

```
消息产生
  │
  ├── priority == emergency && from.emergency_direct == true
  │     → Gateway Channel → 凯撒
  │
  ├── priority == emergency && from.emergency_direct == false
  │     → sessions_send → 执政官 → 执政官判断是否转发凯撒
  │
  └── priority == normal/urgent
        → sessions_send → 执政官
```

---

## 6. 临时 Agent 通讯（sessions_spawn）

元老和军团兵是临时 Agent，用 sessions_spawn 创建。它们的通讯模式和 Always-on 角色不同。

### 6.1 元老院议事

```
执政官 --sessions_spawn--> Senator A (isolated session)
       --sessions_spawn--> Senator B (isolated session)
       --sessions_spawn--> Senator C (isolated session)

每个 Senator 在隔离 session 中独立工作。
执行完成后，结果通过 announce 返回执政官。
```

**关键：元老之间不使用 sessions_send，也不能互相看到。** 执政官是唯一的信息中转者，控制每个阶段谁能看到什么。

**阶段间上下文注入：** Phase 2 的元老需要看到 Phase 1 的汇总。实现方式：执政官把 Phase 1 汇总写入 Phase 2 的 spawn prompt 中。

```
# Phase 1 spawn
sessions_spawn(
  agentId: "senator-macro",
  prompt: "{Phase 1 指令 + Quaestio}"
)

# Phase 2 spawn（包含 Phase 1 汇总）
sessions_spawn(
  agentId: "senator-macro",
  prompt: "{Phase 2 指令 + Phase 1 汇总 + 蓝军/红军分配}"
)
```

### 6.2 军团兵任务

```
执政官 --sessions_spawn--> Legionary A
       --sessions_spawn--> Legionary B (depends on A)
       --sessions_spawn--> Legionary C (depends on A)

按 DAG 依赖顺序 spawn。
A 完成后，A 的产出注入 B 和 C 的 spawn prompt。
```

### 6.3 spawn prompt 格式

临时 Agent 的 spawn prompt 本身就包含所有上下文，不需要再走 A2A 消息。格式：

```
[SPQA-SPAWN]
role: senator-macro
phase: cogitatio
session: senate-2026-015
---
{完整的 SOUL.md 内容（BASE_TEMPLATE + 差异化视角）}

---

{当前阶段的指令（来自 ORDO_DELIBERANDI.md 的模板）}

---

{上一阶段的汇总（如果是 Phase 2+）}
```

---

## 7. 禁卫军内部通讯

禁卫军成员之间允许横向通讯，不需要经过执政官。

### 配置

```yaml
# cohort 内每个成员的 AGENTS.md
tools:
  agentToAgent:
    enabled: true
    allow: ["{同 cohort 其他成员 ID}"]  # 只允许队内通讯
```

### 消息格式

禁卫军内部消息也用 SPQA 标准信封，但 type 增加一个 `internal`：

```
[SPQA-MSG]
from: cohort-alpha-strategus
to: cohort-alpha-executor
type: internal
priority: normal
ref: cohort-alpha
---
根据最新的竞品数据，调整一下抓取策略：
- 新增监控竞品 D 的官网
- 降低竞品 A 的检查频率（最近变动很少）

调整完成后通知记录官更新追踪表。
```

### 对外通讯

禁卫军指挥官（通常是 Strategus）向凯撒汇报，走 Gateway Channel：

```
[SPQA-MSG]
from: cohort-alpha-strategus
to: caesar
type: report
priority: normal
ref: cohort-alpha
---
Alpha 特勤队周报：

本周完成：
- 竞品分析数据更新
- 价格监控异常 2 次，已自动处理

下周计划：
- 新增竞品 D 纳入监控
- 生成 Q1 竞品趋势报告

风险状态：🟢 正常
```

---

## 8. 错误处理

### 8.1 消息超时

sessions_send 支持 `timeoutSeconds` 参数。SPQA 默认超时规则：

| 消息类型 | 默认超时 | 超时处理 |
|---------|---------|---------|
| directive | 300s (5min) | 重试 1 次，再超时通知执政官 |
| report | 300s | 等待，不强制超时（报告可能较长） |
| alert | 30s | 立即转备用路径（emergency → Gateway） |
| query | 120s (2min) | 返回"查询超时"给请求方 |
| heartbeat | 30s | 标记 Agent 为"无响应"，连续 3 次无响应触发告警 |

### 8.2 Agent 无响应

```
水道官 heartbeat → Agent 无响应
  │
  ├── 第 1 次无响应：记录日志，下次巡检重试
  ├── 第 2 次连续无响应：向执政官发 alert (urgent)
  └── 第 3 次连续无响应：向凯撒发 alert (emergency)
                           建议手动检查/重启 Agent
```

### 8.3 sessions_spawn 失败

```
执政官 spawn 元老/军团兵失败
  │
  ├── 重试 1 次（间隔 10s）
  ├── 重试失败 → 检查原因
  │     ├── API 配额不足 → 通知水道官 + 告警凯撒
  │     ├── Agent 配置错误 → 记录错误，跳过该 Agent
  │     └── 系统错误 → 通知水道官排查
  └── 如果是元老 spawn 失败 → 降级组阁（减少元老数量，不低于 3 人）
```

---

## 9. Session 生命周期

临时 Agent（元老、军团兵）的完整创建-执行-销毁流程。

### 9.1 Session ID 命名规范

```
元老院议事：  senate-{YYYYMMDD}-{seq}     例: senate-20260313-001
军团兵任务：  legion-{YYYYMMDD}-{seq}     例: legion-20260313-003
禁卫军会话：  cohort-{id}                 例: cohort-alpha（持久化，不带日期）
```

### 9.2 元老院 Session 生命周期

```
┌──────────────────────────────────────────────────────────┐
│                    Consul 编排流程                         │
│                                                          │
│  ① Initium（初始化）                                      │
│     │  创建 session 目录                                  │
│     │  写入 state.yaml（phase: init）                     │
│     │  记录参与元老名单                                    │
│     ▼                                                    │
│  ② Cogitatio（Phase 1 · 发散）                            │
│     │  并行 spawn 所有元老（isolated）                     │
│     │  等待全部 announce 返回                              │
│     │  收集输出 → phase-1-outputs/                        │
│     │  Consul 汇总 → phase-1-summary.md                  │
│     │  更新 state.yaml（phase: cogitatio_done）           │
│     ▼                                                    │
│  ③ Contentio（Phase 2 · 冲突）                            │
│     │  Consul 分配蓝红军                                   │
│     │  spawn 蓝军（注入 Phase 1 汇总）                     │
│     │  蓝军完成 → spawn 红军（注入蓝军方案）                │
│     │  红军完成 → spawn 蓝军反驳（注入红军攻击）            │
│     │  收集输出 → phase-2-outputs/                        │
│     │  Consul 汇总 → phase-2-summary.md                  │
│     │  更新 state.yaml（phase: contentio_done）           │
│     ▼                                                    │
│  ④ Consensus（Phase 3 · 收敛）                            │
│     │  并行 spawn 所有元老投票（注入修正方案）              │
│     │  收集投票 → phase-3-votes/                          │
│     │  Consul 计票 → phase-3-result.md                   │
│     │  未收敛？→ 重复（最多 2 轮） / Appellatio            │
│     │  更新 state.yaml（phase: consensus_done）           │
│     ▼                                                    │
│  ⑤ Decretum（Phase 4 · 产出）                             │
│     │  spawn Praeses 总结人                               │
│     │  注入全部 Phase 1-3 的汇总                           │
│     │  产出 Senatus Consultum                             │
│     │  更新 state.yaml（phase: decretum_done）            │
│     ▼                                                    │
│  ⑥ Clausura（收尾）                                       │
│     │  Consultum → 交凯撒审阅                             │
│     │  全部 session 产出 → archive 消息 → 史官             │
│     │  删除 session 临时目录                               │
│     │  更新 state.yaml（phase: closed）                   │
│     └──────────────────────────────────────────────────── │
└──────────────────────────────────────────────────────────┘
```

### 9.3 元老 Spawn 详细流程

每个 Phase 中 Consul spawn 元老的具体步骤：

```
① 准备 prompt
   ├── 读取 senators/BASE_TEMPLATE.md
   ├── 读取 senators/s-{id}.md（差异化视角）
   ├── 合并为完整 SOUL 内容
   ├── 附加当前 Phase 的编排指令（来自 ORDO_DELIBERANDI.md）
   └── 附加上下文（Quaestio + 前序阶段汇总）

② 调用 sessions_spawn
   ├── agentId: 用通用 senator agent ID（不为每位元老预注册）
   ├── prompt: 上一步组装的完整文本
   └── 工具限制: 禁用 sessions_spawn（元老不能再 spawn 子agent）

③ 等待 announce
   ├── 设置超时（默认 600s，复杂议题可调）
   ├── announce 返回 → 提取元老输出
   └── 超时 → 记录为该元老本 Phase 无输出，不阻塞其他元老

④ 后处理
   ├── 将输出写入 phase-{n}-outputs/{senator-id}.md
   └── 当同 Phase 所有元老完成 → 触发 Consul 汇总
```

**关键实现细节：**

- 元老不是预注册的 Agent Workspace。用一个通用的 `senator` agent ID，每次 spawn 时通过 prompt 赋予不同身份和视角。这避免了为 12 个元老模板各创建一个 Workspace。
- Phase 1 的所有元老 spawn 是**并行**的。Phase 2 的蓝军→红军→反驳是**串行**的（有依赖）。Phase 3 又是**并行**的。
- 同一个元老在不同 Phase 会被多次 spawn。每次都是全新 session，没有跨 Phase 记忆。上下文完全由 Consul 的 prompt 注入控制。

### 9.4 军团兵 Session 生命周期

```
① Conscriptio（征召）
   │  解析 Senatus Consultum → 提取 Legionarii 清单
   │  构建 DAG 依赖图
   │  创建 session 目录 + state.yaml
   ▼
② Dispositio（部署）
   │  计算并行批次（Batch 1: 无依赖, Batch 2: 依赖 Batch 1, ...）
   │  记录 deployment plan
   ▼
③ Executio（执行）— 按批次循环
   │  当前批次所有军团兵：
   │    ├── 准备 prompt（Mandatum + Norma + Instrumenta + 前置产出）
   │    ├── sessions_spawn（并行）
   │    ├── 等待 announce
   │    ├── 写入 legion-outputs/{legionary-id}/
   │    └── 更新 state.yaml（标记完成）
   │  所有当前批次完成 → 下一批次
   ▼
④ Acceptio（验收）
   │  逐个军团兵检查 Norma
   │  通过 → 标记 accepted
   │  不通过 → 补充指令 re-spawn（最多 2 次）
   ▼
⑤ Dissolutio（解散）
   │  全部产出 → archive 消息 → 史官
   │  完成通知 → 凯撒
   │  删除 session 目录
   │  state.yaml → closed
```

**军团兵与元老的 spawn 差异：**

| 维度 | 元老 spawn | 军团兵 spawn |
|------|-----------|-------------|
| prompt 来源 | BASE_TEMPLATE + s-{id}.md + 编排指令 | Senatus Consultum 的 Officia + Norma |
| 工具权限 | 极少（只需要思考和输出文本） | 按任务配置（文件读写、API、搜索等） |
| 执行时长 | 短（几分钟） | 长（可能数小时） |
| 并行模式 | Phase 内并行 | Batch 内并行，Batch 间串行 |
| 重试策略 | 不重试（缺一个元老可接受） | 重试 2 次（任务不可缺失） |

### 9.5 Session 目录结构

```
consul/workspace/active/
├── senate-20260313-001/           ← 一次元老院议事
│   ├── state.yaml                 ← 状态文件（核心）
│   ├── quaestio.md                ← 原始议题
│   ├── senators.yaml              ← 参与元老名单和分工
│   ├── phase-1-outputs/
│   │   ├── s-macro.md
│   │   ├── s-tech.md
│   │   └── s-risk.md
│   ├── phase-1-summary.md         ← Consul 汇总
│   ├── phase-2-outputs/
│   │   ├── blue-team.md
│   │   ├── red-team.md
│   │   └── blue-rebuttal.md
│   ├── phase-2-summary.md
│   ├── phase-3-votes/
│   │   ├── s-macro.md
│   │   ├── s-tech.md
│   │   └── s-risk.md
│   ├── phase-3-result.md
│   └── consultum.md               ← 最终决议
│
├── legion-20260313-003/           ← 一次军团兵任务
│   ├── state.yaml
│   ├── consultum-ref.md           ← 关联的元老院决议
│   ├── dag.yaml                   ← 依赖图
│   ├── legion-outputs/
│   │   ├── l1-research/
│   │   ├── l2-data/
│   │   └── l3-analysis/
│   └── acceptance.yaml            ← 验收记录
│
└── ...（其他活跃 session）

consul/workspace/completed/        ← 已完成但未归档的 session（暂存）
consul/workspace/failed/           ← 失败的 session（保留现场供排查）
```

---

## 10. 状态管理（Session State）

### 10.1 设计决策

**状态存在哪？** Consul 的 workspace 里，作为 `state.yaml` 文件。不引入外部数据库。

**为什么不存在 Consul 的 memory 里？** Memory 是 LLM 上下文的一部分，长度受限且模糊。state.yaml 是精确的结构化数据，Consul 每次需要时从文件读取，不依赖自己"记得"。

**为什么不用数据库？** MVP 阶段文件系统 + YAML 足够。Git 天然提供版本历史。以后需要并发或查询性能时再升级。

### 10.2 state.yaml 格式

**元老院议事的 state.yaml：**

```yaml
# state.yaml — 元老院议事状态
session_id: senate-20260313-001
type: senate
created_at: "2026-03-13T14:00:00Z"
phase: contentio_done              # 当前已完成的阶段

quaestio:
  title: "SPQA 产品定价策略"
  urgency: high
  caesar_directive: "帮我分析定价策略..."

senators:
  - id: s-macro
    name: Senator Oeconomicus
    hat: white                     # Phase 1 思考帽
    team: blue                     # Phase 2 阵营
  - id: s-tech
    name: Senator Architectus
    hat: black
    team: blue
  - id: s-risk
    name: Senator Cautus
    hat: black
    team: red

phases:
  cogitatio:
    status: done                   # pending / running / done / failed
    started_at: "2026-03-13T14:01:00Z"
    finished_at: "2026-03-13T14:08:00Z"
    outputs:
      s-macro: phase-1-outputs/s-macro.md
      s-tech: phase-1-outputs/s-tech.md
      s-risk: phase-1-outputs/s-risk.md
    summary: phase-1-summary.md

  contentio:
    status: done
    started_at: "2026-03-13T14:09:00Z"
    finished_at: "2026-03-13T14:22:00Z"
    blue_team: [s-macro, s-tech]
    red_team: [s-risk]
    outputs:
      blue_proposal: phase-2-outputs/blue-team.md
      red_attack: phase-2-outputs/red-team.md
      blue_rebuttal: phase-2-outputs/blue-rebuttal.md
    summary: phase-2-summary.md

  consensus:
    status: pending
    round: 0                       # 投票轮次

  decretum:
    status: pending
    praeses: null                  # 蓝帽总结人

result:
  consultum: null                  # 最终决议文件路径
  archived: false
```

**军团兵任务的 state.yaml：**

```yaml
# state.yaml — 军团兵任务状态
session_id: legion-20260313-003
type: legion
created_at: "2026-03-13T15:00:00Z"
phase: executio                    # 当前阶段

consultum_ref: senate-20260313-001

dag:
  batches:
    - batch: 1
      legionaries:
        - id: l1-research
          role: 市场研究员
          status: done
          output: legion-outputs/l1-research/
        - id: l2-data
          role: 数据采集员
          status: done
          output: legion-outputs/l2-data/
    - batch: 2
      legionaries:
        - id: l3-analysis
          role: 分析师
          status: running
          depends_on: [l1-research, l2-data]
          spawn_attempts: 1

acceptance:
  l1-research: accepted
  l2-data: accepted
  l3-analysis: pending

result:
  all_accepted: false
  archived: false
```

### 10.3 状态转换规则

```
                  元老院状态机

init → cogitatio_running → cogitatio_done
       → contentio_running → contentio_done
       → consensus_running → consensus_done
         (或 → consensus_round_2 → appellatio)
       → decretum_running → decretum_done
       → closed

                  军团兵状态机

init → conscriptio_done
     → dispositio_done
     → executio_batch_1 → executio_batch_2 → ... → executio_done
     → acceptio_running → acceptio_done (或 → acceptio_retry)
     → closed
```

**状态更新原则：**
- 每次 Phase 完成后立即写入 state.yaml
- 写入是原子操作（先写临时文件再 rename，防止写到一半崩溃导致文件损坏）
- state.yaml 是 append-style：已完成的阶段数据不修改，只新增下一阶段的数据

### 10.4 崩溃恢复

Consul 重启（或被中断后恢复）时的流程：

```
① 扫描 consul/workspace/active/ 目录
② 对每个 session 目录，读取 state.yaml
③ 根据 phase 字段判断中断点：
   │
   ├── phase == *_running
   │     → 上一次在执行中被中断
   │     → 检查是否有 spawn 的结果已返回（sessions_history）
   │     → 有 → 收集结果，推进到下一阶段
   │     → 没有 → 重新 spawn 该阶段（幂等）
   │
   ├── phase == *_done
   │     → 上一阶段完整完成，但下一阶段未启动
   │     → 直接启动下一阶段
   │
   └── phase == closed
         → 已完成但未清理（可能归档消息没发出去）
         → 重发 archive 消息 → 清理目录
```

**幂等性保证：** 元老院的 spawn 是无状态的——同一个 prompt 重新 spawn 一遍，结果可能不同（LLM 非确定性），但这是可接受的。核心是不会丢失已收集到的结果（因为已写入文件）。

### 10.5 并发控制

SPQA 的并发场景有限（凯撒通常一次只处理一两件事），但需要处理：

**场景 1：多个元老院议事同时进行**
- 每个议事是独立的 session 目录，互不干扰
- Consul 用 session_id 区分上下文，不会混淆

**场景 2：元老院议事 + 军团兵任务同时进行**
- 两者在 active/ 下各有独立目录
- Consul 按 state.yaml 的 type 字段区分处理逻辑

**场景 3：Consul 自身处理能力瓶颈**
- Consul 是单 Agent，如果同时有太多事务，响应会变慢
- 设计原则：Consul 只做编排（spawn + 汇总），不做具体工作
- 如果并发压力大，水道官应通过 heartbeat 发现并告警

---

## 11. 与皮肤系统的关系

消息信封中的角色名用 `agent_id`（如 consul、annalist），不用皮肤名（如"执政官""史官"）。皮肤名只在面向凯撒的展示层（Gateway Channel 消息、Dashboard UI）使用。

**引擎层（agent_id）：** consul、annalist、curator
**展示层（皮肤名）：** 执政官、史官、水道官（罗马皮肤）/ CEO、秘书长、CTO（董事会皮肤）

消息在经过 Gateway 发送给凯撒之前，由展示层根据当前皮肤做名称替换。

---

## 12. 实现优先级

### MVP（Phase 1）
- 实现 `directive` 和 `report` 两种消息类型
- 执政官 ↔ 史官的 archive 消息
- sessions_spawn 用于元老院 Phase 1（并行独立）

### V1（Phase 2）
- 完整六种消息类型
- emergency_direct 路由
- heartbeat 健康检查
- sessions_spawn 多阶段上下文注入

### V2（Phase 3）
- 禁卫军内部横向通讯
- 消息追踪和审计日志
- 自动重试和降级策略
