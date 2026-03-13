# 研究笔记 · Research Notes

> OpenClaw 3.11 深度研究 + CrewAI / Edict 参考分析 → SPQA 设计改进

---

## 1. OpenClaw 3.11 深度发现

### 1.1 Session 模型（关键修正）

OpenClaw 的 session 有两个概念必须区分：

| 概念 | 格式 | 用途 |
|------|------|------|
| **SessionKey** | `agent:<agentId>:<baseKey>` | 稳定路由标识符，用于 sessions_send 寻址 |
| **SessionId** | 实际的 transcript 文件名 | 内部存储标识，不用于路由 |

**dmScope 模式**（决定同一 agent 的会话隔离粒度）：

| 模式 | 说明 | SPQA 场景 |
|------|------|----------|
| `main` | 所有对话共用一个 session | 适合 Consul（统一上下文） |
| `per-peer` | 每个对话伙伴独立 session | 适合 Annalist（按来源隔离） |
| `per-channel-peer` | 按 channel + peer 隔离 | 适合多 channel 的 Consul |

**SPQA 影响：** Consul 与不同 channel（Telegram/Discord）的凯撒对话是否共享上下文，取决于 dmScope 配置。建议 Consul 用 `main`（所有渠道统一记忆），Annalist 用 `per-peer`（按来源角色隔离归档）。

### 1.2 API 签名精确化

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
- **SPQA 建议：** Consul → Annalist 归档用无超时（不阻塞），Consul → Curator 健康检查用 `timeoutSeconds: 30`（需要即时回复）

**sessions_spawn：**
```
sessions_spawn({
  prompt: "...",                         // 注入子 session 的完整 prompt
  runtime?: "subagent" | "acp",         // 默认 subagent
  agent?: "claude-code",                // 仅 runtime: "acp" 时有效
  cleanup?: "delete" | "archive",       // 子 session 结束后处理
  thread?: true,                        // 是否绑定到当前对话线程
  mode?: "run" | "session"              // run=一次性执行，session=持久会话
})
→ 返回 { status, runId, childSessionKey }
```

- `cleanup: "archive"` → 子 session transcript 保存到 archive/（适合元老院议事——保留讨论记录供史官归档）
- `cleanup: "delete"` → 直接删除（适合简单的军团兵任务）
- **SPQA 建议：** 元老 spawn 用 `cleanup: "archive"`，军团兵看情况——关键任务 archive，琐碎任务 delete

**sessions_list / sessions_history：**
```
sessions_list()  → 返回当前 agent 的所有 session 列表
sessions_history({ sessionKey, limit? })  → 返回指定 session 的消息历史
```

- Engine API 可以用 `sessions_history` 获取任何 agent 的对话记录（用于 Dashboard 展示）
- **SPQA 建议：** Dashboard 的"议事实况"面板通过 Engine API 调用 `sessions_history` 获取元老院讨论记录

### 1.3 并发限制（重要）

OpenClaw Gateway 是**单 Node.js 进程、单线程事件循环**。实测 8-10 个并发 `sessions_send` 会触发 watchdog 重启。

**对 SPQA 的影响：**

| 场景 | 并发量 | 风险 |
|------|--------|------|
| 5 元老 Phase 1 并行 spawn | 5 | 安全区 |
| 5 元老 + 3 军团兵同时 | 8 | 边界危险 |
| 5 元老 + 3 军团兵 + 2 佣兵 ACP | 10 | 可能触发 watchdog |

**SPQA 应对：**
1. **编排层限流** — ordo-deliberandi / iter-legionum skill 内置并发上限（建议 ≤6 并发 spawn）
2. **批次调度** — 军团兵 DAG 的每个批次内并发不超过 5
3. **优先级队列** — 元老院议事 > 军团兵执行 > 佣兵外包，高优先级占满时低优先级排队
4. **远期** — 如果 OpenClaw 不解决单线程瓶颈，考虑多 Gateway 实例（Nexus 架构已支持）

### 1.4 记忆系统

OpenClaw 使用 SQLite 向量索引，支持 semantic + BM25 混合搜索：

| 工具 | 功能 |
|------|------|
| `memory_search` | 语义搜索 + BM25 关键词，返回相关记忆片段 |
| `memory_get` | 按 ID 获取完整记忆条目 |
| MEMORY.md | Agent 的长期记忆声明文件 |

**对 SPQA 史官的影响：**
- Annalist 的归档可以利用 OpenClaw 原生向量索引，不需要额外搭建 RAG 系统
- 归档文件放在 Annalist workspace 内，OpenClaw 自动建立向量索引
- 检索时用 `memory_search` 做语义搜索，比纯 grep 强得多
- MVP 够用，但大规模归档可能需要评估 SQLite 性能上限

### 1.5 工具可见性

```
agents.defaults.tools.sessions.visibility: "self" | "tree" | "agent" | "all"
```

| 值 | 说明 | SPQA 用法 |
|----|------|----------|
| `self` | 只能调用自己的工具 | 默认——大多数角色 |
| `tree` | 可以看到子 agent 的工具 | Consul（需要调用 spawn 出的元老/军团兵） |
| `agent` | 可以看到同 agent 所有 session 的工具 | 不推荐 |
| `all` | 可以看到所有 agent 的工具 | 不推荐（安全风险） |

**SPQA 建议：** Consul 用 `tree`，其他角色用 `self`。

### 1.6 Bootstrap 限制

OpenClaw 在 session 启动时加载的文件有上限：

| 限制 | 值 |
|------|---|
| 单文件最大字符数 | 20,000 (bootstrapMaxChars) |
| 所有文件总字符数 | 150,000 (bootstrapTotalMaxChars) |

**SPQA 影响：** 元老模板（BASE_TEMPLATE + 个人模板）必须控制在合理范围。如果 SOUL.md + AGENTS.md + 注入的议题上下文超过限制，会被截断。建议单个元老的完整 prompt 控制在 15,000 字符以内。

### 1.7 Skills 格式

OpenClaw Skills 使用 YAML frontmatter：

```yaml
---
name: "condottiere"
version: "1.0.0"
tags: ["mercenary", "acp", "outsource"]
minOC: "2026.3.0"          # 最低 OpenClaw 版本
provider: "spqa"
model: "anthropic/claude-sonnet-4-6"  # 可覆盖默认模型
---
# Condottiere · 佣兵队长
...SKILL.md 正文...
```

- `model` 字段可以让特定 Skill 使用不同模型（如 Praetor 用更便宜的模型做快速匹配）
- `minOC` 确保 Skill 与 OpenClaw 版本兼容
- **SPQA 建议：** 所有 SPQA Skill 统一标注 `minOC: "2026.3.0"`，`provider: "spqa"`

### 1.8 Session 重置模式

| 机制 | 说明 |
|------|------|
| `idleMinutes` | 空闲 N 分钟后重置 session |
| Daily reset time | 每天固定时间重置 |
| Session compaction | context 接近上限时自动压缩 |

**SPQA 建议：**
- Consul 不设 idleMinutes（作为 always-on 管家不应丢失上下文）
- Annalist 不设 idleMinutes（归档记忆必须持久）
- Curator 可设 idleMinutes: 60（巡检完毕后释放上下文）

---

## 2. CrewAI 设计模式分析

### 2.1 值得采纳的模式

**① 结构化输出验证**

CrewAI 用 Pydantic schema 定义 Agent 输出格式，输出不合格自动重试。

```python
# CrewAI 示例
class SenatusConsultum(BaseModel):
    legionarii: list[LegionarySpec]
    officia: dict[str, str]
    norma: list[str]
    tempus: str
    provisio: list[str]
```

**SPQA 采纳方案：** 在 ordo-deliberandi Skill 的 Phase 4（产出期）中定义 Senatus Consultum 的必填字段。如果蓝帽总结缺少必填项，Skill 自动要求补充。不需要 Pydantic——用 markdown checklist + Skill 逻辑验证即可。

**② 事件驱动 Flows**

CrewAI 的 Flows 模式比 Hierarchical 模式更可靠——用事件触发替代中心调度：

```python
@listen(phase_1_complete)
def start_phase_2(self):
    ...
```

**SPQA 采纳方案：** 元老院四阶段本质上就是事件驱动——Phase 1 完成触发 Phase 2，以此类推。但 SPQA 不引入事件框架，而是在 ordo-deliberandi Skill 内用显式状态机管理阶段转换。原因：OpenClaw Skill 是 prompt-driven，不支持代码级 event listener。

**③ 复合记忆评分**

CrewAI 的记忆检索用三维评分：

| 维度 | 权重 | 说明 |
|------|------|------|
| Semantic similarity | 高 | 语义相关性 |
| Recency | 中 | 时间衰减——越新越重要 |
| Importance | 低→可变 | 人工标记的重要度 |

**SPQA 采纳方案：** 史官归档时在 YAML frontmatter 中标注 `importance: high/medium/low`。检索时结合 OpenClaw 原生的 `memory_search`（语义）+ frontmatter 标签过滤。MVP 阶段用标签过滤就够了，进阶再考虑自定义评分。

**④ 显式上下文依赖**

CrewAI Tasks 之间可以声明 `context` 依赖——Task B 需要 Task A 的输出作为输入。

**SPQA 采纳方案：** 军团兵 DAG 已经有依赖关系，但需要在 Senatus Consultum 中显式标注：

```yaml
legionarii:
  - id: L1
    task: "搭建数据库 schema"
    output: "schema.sql"
  - id: L2
    task: "写 API endpoint"
    depends_on: [L1]
    context_from: ["L1.output"]  # 显式声明需要 L1 的输出
```

### 2.2 需要避免的反模式

**① 层级委托（Hierarchical Delegation）**

CrewAI 的 hierarchical 模式让 manager agent 自动分配任务给 worker agents。实际使用中经常失败——manager agent 倾向于自己完成任务而不是委托，或者委托后丢失上下文。

**SPQA 规避：** SPQA 的 Consul 作为编排器，不是通过"委托"而是通过 Skill 的显式流程来管理元老和军团兵。Consul 不是在"指挥"元老讨论，而是按 ordo-deliberandi Skill 的固定协议执行阶段转换。这避免了 LLM 自主"管理"的不可靠性。

**② Agent 间直接通讯**

CrewAI 社区反馈 Agent 间直接对话容易产生信息环路和幻觉放大。

**SPQA 规避：** 元老之间不直接通讯（Phase 1 互不可见，Phase 2+ 由 Consul 汇总注入）。这个设计是正确的——保持。军团兵同理。唯一的例外是特勤队内部横向通讯（A2A），但特勤队成员是持久化角色，有足够上下文避免幻觉。

---

## 3. Edict 项目分析

### 3.1 架构概览

Edict 基于 OpenClaw 实现三省六部制：

```
中书省 (Policy) → 门下省 (Review, veto 权) → 尚书省 (Execution)
                                                 ├── 兵部
                                                 ├── 工部
                                                 ├── 户部
                                                 └── ...
```

12 个 Agent，串行质量门控 + 并行部委执行。

### 3.2 值得借鉴

**① 强制质量门控**

Edict 的门下省有 veto 权——审查不通过直接打回中书省重做。这是架构级的质量保证。

**SPQA 对应：** 元老院 Phase 2（冲突期）就是质量门控——红军必须找出至少 3 个问题。但 SPQA 的门控更强：不是单个审查 Agent，而是多视角交叉审查。

**② 单文件 Dashboard**

Edict 用约 2500 行单 HTML 实现完整 Dashboard。零依赖，部署简单。

**SPQA 参考：** MVP 的 Dashboard 可以考虑类似路径——单个 React 应用（或甚至单 HTML），先做功能再做工程化。但 SPQA 的 Dashboard 需求远比 Edict 复杂（皮肤系统、配置管理、多实例），最终肯定需要 React 组件化。

**③ OpenClaw 验证**

Edict 证明了基于 OpenClaw 构建多 Agent 组织是可行的。他们遇到的问题（agent 间通讯延迟、上下文丢失）都是 OpenClaw 层面的，不是架构层面的。

### 3.3 SPQA 的优势

| 维度 | Edict（三省六部） | SPQA（元老院） |
|------|-----------------|--------------|
| 决策模式 | 单人审查（门下省） | 多视角并行（元老院） |
| 偏差对冲 | 单点偏差风险 | ensemble 效应对冲偏差 |
| 灵活性 | 固定部委 | 动态组阁 + 元老池 |
| 执行模式 | 固定 6 部 | 动态军团兵 + 佣兵外包 |
| 任务路由 | 无分级 | 四级路由 |
| 皮肤/个性化 | 固定中国风 | 主题系统 + 商业化 |

SPQA 的核心优势是**多视角决策**——门下省的审查 Agent 和中书省的起草 Agent 如果用同一模型，可能犯同样的偏差。SPQA 元老院通过给不同元老注入不同视角（思考帽），强制产生多样化观点。

---

## 4. 综合设计改进建议

### 4.1 立即可做的改进

| 改进 | 影响文档 | 优先级 |
|------|---------|--------|
| 在 openclaw.json 配置中增加 dmScope 设置 | OPENCLAW_BASELINE.md | 高 |
| sessions_spawn 使用 `cleanup: "archive"` 保留元老讨论记录 | OPENCLAW_BASELINE.md | 高 |
| 元老 prompt 控制在 15k 字符以内 | ARCHITECTURE.md 8.3 节 | 高 |
| ordo-deliberandi Skill 内置并发限制（≤6 spawn） | ARCHITECTURE.md / OPENCLAW_BASELINE.md | 高 |
| Senatus Consultum 增加结构化验证（必填字段检查） | ARCHITECTURE.md 4.2 节 | 中 |
| 军团兵 DAG 增加显式 context 依赖声明 | ARCHITECTURE.md 7 节 | 中 |
| 史官归档增加 importance 标签 | OFFICIUM.md | 中 |
| Skills 统一 YAML frontmatter 格式 | OPENCLAW_BASELINE.md | 低 |

### 4.2 架构确认（无需修改）

以下设计经过 CrewAI/Edict 对比分析，确认是正确的：

- **元老间不直接通讯** — CrewAI 验证了直接通讯易产生幻觉环路
- **Consul 作为显式编排器（非 hierarchical delegation）** — CrewAI 验证了自主委托不可靠
- **多视角并行优于单人审查** — Edict 的门下省模式存在单点偏差
- **临时 Agent 用 sessions_spawn 不用 Workspace** — OpenClaw 原生支持
- **佣兵走 ACP 不走自建** — ACP 提供完整的进程管理和会话持久化

### 4.3 远期关注

| 项目 | 说明 | 触发条件 |
|------|------|---------|
| 多 Gateway 负载均衡 | 单线程瓶颈 8-10 并发 | 议事 + 军团兵 + 佣兵同时进行 |
| 向量索引性能 | SQLite 不适合大规模归档 | 归档文件 >10,000 条 |
| ACP 沙箱限制 | Consul 必须非沙箱模式才能 spawn ACP | 安全审计要求 |
| OpenClaw 上游变化 | sessions_spawn API 可能变 | 每次上游发版检查 |

---

## 5. 待更新文档清单

基于以上研究，需要更新的文档：

| 文档 | 更新内容 |
|------|---------|
| OPENCLAW_BASELINE.md | session 模型详细化（sessionKey/sessionId/dmScope）、API 精确签名、并发限制及应对、记忆系统、工具可见性、bootstrap 限制、Skills frontmatter、session 重置 |
| ARCHITECTURE.md | 元老 prompt 字符限制、Senatus Consultum 结构化验证、军团兵 context 依赖、changelog |
| MERCENARII.md | ACP API 精确签名（已有但可微调） |
| OPENCLAW_INTEGRATION.md | 删除临时 Workspace 目录设计（已在 BASELINE 中标注需修正） |

---

## 附录 A · OpenClaw 3.x 版本变化速览

| 版本 | 关键变化 |
|------|---------|
| 3.9 | ACP Runtime 引入 |
| 3.10 | A2A v0.3.0、ACPX 后端 |
| 3.11 | CVE-2026-25253 修复、sessions_spawn cleanup 参数、性能优化 |

SPQA 建议持续跟踪 3.x 系列，尤其关注：
- sessions_spawn 的 API 变化
- ACP 的新注册 Agent
- 并发性能改进
- 新的 Skill API 能力
