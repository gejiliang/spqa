# 佣兵体系 · Mercenarii

> 外部 AI 工具的按需雇佣——处理中间复杂度任务

---

## 1. 问题：任务路由的中间层空缺

当前 SPQA 的任务路由只有两档：

| 路线 | 复杂度 | 例子 |
|------|--------|------|
| Consul 直接处理 | 低 | 查日历、回消息、汇总信息 |
| 元老院 → 军团兵 | 高 | 产品策略、架构设计、竞品分析 |

缺失的中间层：**需要真正动手写代码/做工程，但不需要多视角讨论**。

| 中间任务示例 |
|------------|
| 写个脚本解析 CSV 并生成报表 |
| 调试 API endpoint 的 500 错误 |
| 搭建 CI/CD pipeline |
| 重构一段代码 |
| 写个爬虫抓取数据 |
| 配置 Docker 环境 |
| 做一份带数据可视化的分析报告 |

这类任务的共同特征：**目标清晰、偏执行、需要工程能力、一个人干得了**。

---

## 2. 方案：Mercenarii（佣兵）

### 2.1 罗马隐喻

罗马共和国大量使用非公民雇佣兵（Mercenarii）。他们有自己的武器、战术和训练体系，罗马只给目标和报酬。雇佣兵不属于正规军编制，不参与政治决策，但战斗力不输正规军团。

这完美映射了 Claude Code、Codex 等外部 AI 工具的角色：

| 罗马军事 | SPQA | 说明 |
|---------|------|------|
| Mercenarii（佣兵） | 外部 AI 工具 | 按需雇佣，不属于 SPQA 编制 |
| Condottiere（佣兵队长） | 执政官的外包管理 Skill | 负责任务打包、佣兵调度、结果验收 |
| 不同佣兵团 | Claude Code / Codex / Devin / ... | 各有所长，按任务类型选择 |
| 军饷（Stipendium） | API 调用费用 | 用多少付多少 |

### 2.2 角色定义

| 属性 | 说明 |
|------|------|
| Abstract Role | `mercenary` |
| 罗马皮肤名 | Mercenarii · 佣兵 |
| 运行位置 | 外部系统（非 OpenClaw 内部） |
| 调用方式 | Consul 通过 Skill（condottiere）调用外部 API / CLI |
| 生命周期 | Per-task（任务完成即结算） |
| 特点 | SPQA 不控制其内部实现，只管输入输出 |

### 2.3 与军团兵的区别

| 维度 | Legionarii（军团兵） | Mercenarii（佣兵） |
|------|-------------------|------------------|
| 来源 | 内部——sessions_spawn 创建 | 外部——API/CLI 调用 |
| 驱动 | 元老院决议（Senatus Consultum） | 执政官直接派单 |
| 决策前提 | 需要元老院多视角讨论 | 不需要——任务目标已清晰 |
| 任务类型 | 多步骤、可能有分支 | 单一、明确、可交付 |
| 编排 | DAG 批次调度 | 单任务或简单序列 |
| 运行环境 | OpenClaw 隔离 Session | 外部工具自己的沙箱 |
| 成本模型 | 按 spawn session 计 | 按外部 API 调用计 |
| 状态管理 | state.yaml 追踪 | 简单的任务记录 |

**简单判断：如果一个任务可以用一句话描述清楚要做什么和交付什么，那就是佣兵活。如果需要先讨论"应该做什么"，那走元老院。**

---

## 3. 任务路由（更新后）

### 3.1 四级路由

```
Caesar 下达任务 → Consul 评估复杂度
  │
  ├── Level 0 · 琐事（Trivium）
  │   Consul 直接处理
  │   例：查日历、回消息、翻译、汇总
  │
  ├── Level 1 · 外包（Mercenarium）          ← 新增
  │   Consul → Condottiere Skill → 外部 AI 工具
  │   例：写脚本、调 bug、搭环境、做报表
  │
  ├── Level 2 · 议事（Deliberatio）
  │   Consul → Praetor 组阁 → 元老院四阶段 → 军团兵执行
  │   例：产品策略、架构设计、复杂分析
  │
  └── Level 3 · 专项（Praetoriana）
      Caesar 直接指挥 → 禁卫军特勤队
      例：量化交易、持续运维、长期项目
```

### 3.2 路由判断逻辑

执政官评估三个维度来决定路由：

| 维度 | Level 0 琐事 | Level 1 外包 | Level 2 议事 |
|------|------------|------------|------------|
| 需要讨论吗？ | 否 | 否 | 是——需要多视角 |
| 需要动手工程吗？ | 否 | **是** | 可能（由军团兵做） |
| 目标明确吗？ | 是 | **是** | 不完全——需要先讨论 |

**核心区分：佣兵任务 = "不需要讨论但需要动手"。**

### 3.3 混合场景

有时候一个大任务会同时用到多个级别：

```
Caesar: "分析我们的竞品然后写个自动化的竞品监控系统"

Consul 分解：
  ① "分析竞品" → Level 2（元老院议事）
     → 元老院讨论竞品格局、监控维度、关注指标
     → 输出 Senatus Consultum（包含监控方案）

  ② "写竞品监控系统" → Level 1（佣兵外包）
     → 基于决议中的方案，调 Claude Code 写爬虫 + 数据处理 + 报告生成
     → 佣兵交付代码

  ③ 需要长期运行？ → Level 3（交给禁卫军）
     → 部署为特勤队持续运维
```

---

## 4. 佣兵调度机制

### 4.1 Condottiere Skill（佣兵队长）

Consul 的一个专门 Skill，负责管理所有佣兵相关的事务：

```
agents/consul/skills/
├── praetor/              ← 组阁
├── ordo-deliberandi/     ← 议事
├── iter-legionum/        ← 军团兵
└── condottiere/          ← 佣兵管理   ← 新增
    └── SKILL.md
```

**Condottiere Skill 的职责：**

1. **任务打包** — 把执政官的意图转化为外部工具可执行的明确指令
2. **佣兵选择** — 根据任务类型选择最合适的外部工具
3. **调用执行** — 调用外部 API / CLI
4. **结果验收** — 检查交付物是否符合要求
5. **费用记录** — 记录 API 调用成本（交给财务官/水道官追踪）

### 4.2 ACP Runtime——OpenClaw 原生佣兵机制

OpenClaw 3.11 已经内置了 **ACP（Agent Client Protocol）** —— 这是一套标准协议，让 OpenClaw 可以把外部 AI 工具作为子进程调用。ACP 就是佣兵系统的原生底座，我们不需要自建调用机制。

**ACP 提供的能力（开箱即用）：**

| 能力 | 说明 |
|------|------|
| 外部进程隔离 | 佣兵在独立子进程运行，卡死不影响主循环 |
| `sessions_spawn({ runtime: "acp" })` | 原生 spawn 接口，非阻塞返回 |
| 19+ 注册 Agent | Claude Code、Codex、Gemini CLI、Copilot 等全部可用 |
| 会话持久化 | 多轮对话跨调用保持上下文 |
| ACPX 后端 | 处理传输、排队、取消、重连 |
| 结果回传 | 自动 announce 结果到请求方 |

**ACP 注册表中的可用佣兵（部分）：**

| 佣兵 | 擅长领域 |
|------|---------|
| Claude Code (Anthropic) | 全栈编程、调试、重构、DevOps |
| Codex (CodeXHorizon) | 代码生成 |
| Gemini CLI (Google) | 编程、分析 |
| Copilot (Microsoft) | 代码补全、生成 |
| OpenCode (Meta) | 编程 |
| Kiro, Goose, Junie, Kimi, Qwen Code... | 各有专长 |

### 4.3 配置

佣兵配置直接写在 openclaw.json 的 ACP 段，不需要额外配置文件：

```json5
// openclaw.json → acp
{
  acp: {
    dispatch: {
      enabled: true,
      backend: "acpx",
      defaultAgent: "claude-code"    // 默认佣兵
    },
    agents: [
      { name: "claude-code" },       // MVP 阶段只启用这一个
      // { name: "codex" },           // 后续按需启用
      // { name: "gemini-cli" },
    ],
    concurrentSessions: 5,           // 最多同时 5 个佣兵任务
  }
}
```

**SPQA 层的佣兵路由配置**（Condottiere Skill 读取）：

```yaml
# spqa/config.yaml → mercenarii
mercenarii:
  default_agent: claude-code
  cost_limit_per_task_usd: 1.00     # 单任务费用上限
  timeout_seconds: 300               # 默认 5 分钟超时
  require_caesar_approval:           # 需要凯撒审批的操作
    - database_write
    - external_api_call
    - deploy
    - cost_over_limit
```

### 4.4 调用流程

```
用户: "帮我写个 Python 脚本处理这份 CSV"

Consul 判断: Level 1（佣兵外包）
  │
  ▼
Condottiere Skill 激活:
  │
  ├── 1. 任务打包
  │   "用 Python 写一个脚本：
  │    - 输入：workspace/data.csv
  │    - 处理：按 region 聚合销售额，计算环比增长
  │    - 输出：workspace/report.csv + 可视化图表 PNG"
  │
  ├── 2. 选择佣兵: claude-code（ACP defaultAgent）
  │
  ├── 3. 调用 ACP
  │   sessions_spawn({
  │     runtime: "acp",
  │     agent: "claude-code",
  │     prompt: "...(打包好的任务描述)...",
  │     cleanup: "archive",        // 保留执行记录供审计
  │     mode: "run"                // 一次性执行
  │   })
  │   → 返回 { status, runId, childSessionKey }
  │   → 非阻塞，佣兵在独立进程工作
  │
  ├── 4. 等待结果
  │   ACP 自动管理：传输、排队、超时、重连
  │   结果 announce 回 Consul 的 session
  │
  ├── 5. 验收
  │   Condottiere 检查：
  │   - 任务是否成功完成？
  │   - 输出文件是否存在？
  │   - 结果是否合理？
  │
  └── 6. 交付给 Consul → 转交 Caesar
      "脚本已完成，报表在这里 [链接]"
```

**对比之前的方案：**

| 维度 | 之前（自建 MCP Tool） | 现在（ACP Runtime） |
|------|-------------------|-------------------|
| 调用方式 | 手动包装 CLI/HTTP | `sessions_spawn({ runtime: "acp" })` |
| 进程管理 | 自己处理 | ACPX 后端自动管理 |
| 超时/重连 | 自己实现 | ACP 内置 |
| 多佣兵支持 | 自己写路由 | ACP 注册表 + dispatch |
| 会话持久化 | 不支持 | ACP 原生支持 |
| 零修改合规 | ✅ | ✅（更原生） |

### 4.4 任务记录

佣兵任务不走 state.yaml 的重量级状态管理（那是议事和军团用的）。用简单的任务日志：

```yaml
# consul/workspace/mercenarii/task-20260313-001.yaml
task_id: task-20260313-001
type: mercenarium
status: completed          # pending / running / completed / failed
provider: claude-code
created: 2026-03-13T14:30:00
completed: 2026-03-13T14:32:15

request:
  summary: "Python CSV 处理脚本"
  detail: "按 region 聚合销售额..."
  input_files:
    - workspace/data.csv

result:
  output_files:
    - mercenarii/task-20260313-001/process_csv.py
    - mercenarii/task-20260313-001/report.csv
    - mercenarii/task-20260313-001/chart.png
  exit_code: 0
  cost_usd: 0.03

archived: false   # 史官归档后变 true
```

---

## 5. 实现方式

### 5.1 在 OpenClaw 3.11 上的实现（零修改原则）

佣兵调度基于 ACP Runtime + Condottiere Skill，完全不修改 OpenClaw：

| 组件 | 实现方式 | 说明 |
|------|---------|------|
| ACP Runtime | OpenClaw 原生 `sessions_spawn({ runtime: "acp" })` | 开箱即用 |
| ACPX 后端 | OpenClaw 自带的外部进程管理 | 传输、排队、取消、重连 |
| Condottiere Skill | SKILL.md 在 consul/skills/condottiere/ | 任务打包 + 佣兵选择 + 验收 |
| 佣兵配置 | openclaw.json → acp | OpenClaw 标准配置 |
| 路由配置 | spqa/config.yaml → mercenarii | SPQA 层的策略 |
| 任务记录 | YAML 文件 | consul/workspace/mercenarii/*.yaml |

### 5.2 Condottiere Skill 的职责（精简后）

有了 ACP，Condottiere Skill 不再负责底层调用和进程管理，而是专注于**编排层**：

| 职责 | 说明 |
|------|------|
| 任务打包 | 把 Consul 的意图转化为结构化的 prompt |
| 佣兵选择 | 根据任务类型从 ACP 注册表选择合适的 agent |
| 调用 ACP | 执行 `sessions_spawn({ runtime: "acp", agent: "..." })` |
| 结果验收 | 检查 ACP session 返回的结果是否符合要求 |
| 失败重试 | 佣兵失败时决定重试、换佣兵、还是升级为人工 |
| 费用记录 | 记录任务成本（转交水道官/财务官） |

**不再需要的**（ACP 已处理）：进程管理、超时处理、重连、传输层。

### 5.3 安全边界

ACP 提供了进程级隔离，SPQA 在此基础上增加业务层安全：

| 层 | 安全措施 | 提供者 |
|----|---------|--------|
| 进程隔离 | 佣兵在独立子进程运行，卡死不影响主循环 | ACP Runtime |
| 权限控制 | 非交互模式：默认允许读、禁止写/执行 | ACP 权限模型 |
| 成本上限 | 单任务费用上限，超出暂停并请求凯撒确认 | Condottiere Skill |
| 超时机制 | 运行时 TTL，ACP 层强制终止 | ACP + openclaw.json |
| 敏感操作审批 | 写数据库、调外部 API、部署代码需凯撒确认 | Condottiere Skill |
| 结果审查 | 验收失败的任务不交付，标记为需人工介入 | Condottiere Skill |

**重要限制：** ACP session 运行在主机运行时（非沙箱内）。如果 Consul 本身运行在沙箱中，不能 spawn ACP session。这意味着 Consul 必须运行在非沙箱模式，或者通过 Engine API 代理 ACP 调用。

---

## 6. Dashboard 展示

### 6.1 佣兵市场面板

```
┌──────────────────────────────────────────────────────────┐
│  ⚔️ Castra Mercenariorum · 佣兵营                         │
│                                                          │
│  活跃佣兵                                                 │
│  ┌────────────────────────┐                              │
│  │  🗡️ Claude Code         │  🟢 可用                     │
│  │  擅长：编程 调试 重构     │  本月任务：12                 │
│  │  本月费用：$0.85         │  成功率：100%                │
│  └────────────────────────┘                              │
│  ┌────────────────────────┐                              │
│  │  🗡️ Codex              │  ⚪ 未启用                    │
│  │  擅长：代码生成          │  [启用]                      │
│  └────────────────────────┘                              │
│                                                          │
│  最近任务                                                 │
│  ✅ task-001  CSV 处理脚本     Claude Code  $0.03  2min   │
│  ✅ task-002  API 调试         Claude Code  $0.05  4min   │
│  🔄 task-003  CI/CD 配置      Claude Code  进行中...      │
│                                                          │
│  [📊 费用报告]  [⚙️ 佣兵配置]                              │
└──────────────────────────────────────────────────────────┘
```

---

## 7. 与现有设计的关系

| 文档 | 影响 |
|------|------|
| ARCHITECTURE.md | 新增 Level 1 路由，更新任务流转图 |
| OPENCLAW_BASELINE.md | 新增 ACP 为关键原语，condottiere skill |
| DASHBOARD.md | 新增佣兵营面板 |
| THEME_SYSTEM.md | 新增 `mercenary` abstract role |
| OFFICIUM.md | 更新信息路由（佣兵产出的归档路径） |
| A2A_PROTOCOL.md | 无影响——佣兵走 ACP，不走 A2A |

---

## 8. 实现优先级

### MVP

- openclaw.json 配置 ACP dispatch + claude-code agent
- Condottiere Skill 基础版——任务打包 + 调用 `sessions_spawn({ runtime: "acp" })` + 简单验收
- 单佣兵（Claude Code only）
- 简单任务记录（YAML 文件）
- Consul 的路由逻辑增加 Level 1 判断

### V1

- 多佣兵支持（ACP 注册表中启用更多 agent）
- Condottiere 智能路由（按任务类型自动选佣兵）
- Dashboard 佣兵营面板
- 费用追踪集成（水道官/财务官）
- 任务结果自动归档（史官）
- ACP Thread Binding（佣兵绑定特定对话线程）

### V2

- 自动选择最优佣兵（按成本/速度/能力/历史成功率）
- 佣兵协作（多个佣兵并行处理一个任务的不同部分）
- 佣兵 + 军团兵混合编排（元老院决议的部分步骤交给佣兵）
