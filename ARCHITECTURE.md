# S·P·Q·A — Senatus Populusque Agentium

**元老院与 Agent · AI-Native Organization Architecture**

> 动态组阁 · 四阶段议制 · 三级生命周期

---

## 1. 设计哲学

本架构融合了罗马共和制的分权治理智慧与现代 AI Agent 协作的技术特性，核心主张：

- **决策层用元老院（多视角并行），执行层用军团兵（动态实例化）**
- 人类（凯撒）是最高决策者，但日常决策交由 Agent 集体智慧完成
- Agent 分为三种生命周期：常驻（Always-on）、项目持久化（Project-persistent）、临时（Ephemeral）
- 元老院的多视角讨论优于单个审核 Agent 的串行审查（对冲 LLM 单点偏差）
- 充分利用 AI 的并行能力，避免不必要的串行瓶颈

### 为什么不用三省六部式串行流水线

三省六部（如 Edict 项目）假设流程正确即结果正确，但 LLM 的核心失败模式是单点过度自信——门下省 Agent 和中书省 Agent 若用同一模型，可能犯相同推理偏差。元老院通过多个独立视角并行，天然对冲了这个问题，类似 ensemble learning。

### 为什么元老不持久化

持久化 Agent 维护成本高且大部分时间空转。元老作为「配置模板」存在（System Prompt + 专业背景 + 评判标准），需要时实例化，用完销毁，状态由史官归档。这与 serverless function 理念一致。

---

## 2. 组织全景

```
                        ┌─────────────────────────┐
                        │    🏛 Caesar · 凯撒       │
                        │    最高决策者 · 你本人     │
                        └────────┬──────────┬──────┘
                                 │          │
                    元老院路线 ──┘          └── 禁卫军直线
                                 │                    │
                        ┌────────▼────────┐   ┌──────▼──────────┐
                        │ ⚜️ Consul 执政官  │   │ 🛡️ Cohors Specialis │
                        │ 首席助理 + 组阁   │   │ 特勤队 (按需组建)   │
                        └────────┬────────┘   │ 凯撒直接指挥      │
                                 │            └─────────────────┘
                        ┌────────▼────────┐
                        │ ⚖️ Praetor 裁判官 │ (Subagent)
                        │ 议题分析+元老筛选  │
                        └────────┬────────┘
                                 │ 组阁
                        ┌────────▼────────┐
                        │ ⚔️ Senatus 元老院 │
                        │ 3-5 Senators     │
                        │ 四阶段议制        │
                        └────────┬────────┘
                                 │ Senatus Consultum (决议)
                        ┌────────▼────────┐
                        │ ⚔️ Legionarii    │
                        │ 军团兵 · 临时执行  │
                        └────────┬────────┘
                                 │ 成果
                        ┌────────▼────────┐
                        │ 📚 Annalist 史官  │
                        │ 归档一切          │
                        └─────────────────┘

        ┌──────────────────────────────────────────┐
        │        OFFICIUM · 综合办公室 (Always-on)    │
        │  📚 史官  💰 财务官  🌐 水道官  🔍 探路者  📱 护民官 │
        └──────────────────────────────────────────┘
```

---

## 3. 角色定义

### 3.1 Caesar · 凯撒（你）

| 属性 | 说明 |
|------|------|
| 拉丁名 | Imperator Caesar |
| 类型 | 人类 |
| 职能 | 最高决策者 · 战略方向 · 关键审批 |

**职责：**
- 通过执政官向元老院下达议题
- 元老院僵局时的最终裁决权（Veto）
- 直接指挥禁卫军（持久化项目组）
- 审批重大对外动作（发布、合作、支出）
- 组织战略方向和 OKR 制定

### 3.2 Consul · 执政官

| 属性 | 说明 |
|------|------|
| 拉丁名 | Consul |
| 中文职能 | 首席助理 · 生活管家兼项目启动器 |
| 生命周期 | Always-on |

**双重角色：**
- **日常模式：** 日程管理、信息过滤、琐事处理
- **项目模式：** 将凯撒指令转化为可讨论的议题，调用裁判官组阁，元老院决议后实例化军团兵

**工具接入：** 日历 API、消息路由、Agent 实例化、进度追踪

### 3.3 Praetor · 裁判官

| 属性 | 说明 |
|------|------|
| 拉丁名 | Praetor |
| 中文职能 | 议题分析师 · 元老筛选器 |
| 类型 | 执政官的 Subagent |

**职责：**
- 快速分析议题涉及的领域和维度
- 评估议题复杂度（决定组阁规模 3-5 人）
- 从元老池按标签匹配最适合的元老
- 输出推荐组阁名单及理由

### 3.4 Senatus · 元老院

| 属性 | 说明 |
|------|------|
| 拉丁名 | Senatus |
| 中文职能 | 集体决策机构 · 多专家讨论达成共识 |
| 生命周期 | Ephemeral（按项目组阁） |

详见第 4 节「元老院议制」。

### 3.5 Legionarii · 军团兵

| 属性 | 说明 |
|------|------|
| 拉丁名 | Legionarii |
| 中文职能 | 临时执行者 |
| 生命周期 | Ephemeral（任务完成即销毁） |

按元老院决议（Senatus Consultum）中指定的角色和分工动态实例化，执行完成后成果交史官归档，Agent 销毁。

### 3.6 综合办公室（Officium）

Always-on 角色分为强制核心和可选模板。所有角色遵循统一 schema（详见 docs/OFFICIUM.md）。

**强制启用（Praesidium · 核心卫戍）：**

| 罗马名 | 中文名 | 职能 | 不可关闭的理由 |
|--------|--------|------|---------------|
| Annalista · 史官 | 组织记忆管理员 | 归档决策和成果 · 维护知识库 | 没有记忆系统每次从零开始 |
| Curator Aquarum · 水道官 | IT 运维 + API 成本监控 | 系统健康 · API 用量/费用追踪 | 关了等于盲飞 |

**可选预设（Optiones）：**

| 罗马名 | 中文名 | 职能 |
|--------|--------|------|
| Quaestor · 财务官 | 凯撒的财务管家 | 现实世界的记账、预算、财务报表 |
| Explorator · 探路者 | 情报与舆情侦察兵 | 行业动态 + 用户反馈监测（原探路者+护民官合并） |

**用户自定义：** 基于 `agents/_template/` 创建，统一 schema，执政官自动注册。

### 3.7 Praetorian Guard · 禁卫军

凯撒直属持久化项目组，独立于元老院指挥链。

**机制：** 禁卫军是一个分类，下辖多个 Cohors Specialis（特勤队）。凯撒按需组建、命名、编号。每队全员持久化，凯撒直接指挥。

**标准角色骨架（可按业务增减）：**

| 角色 | 拉丁名 | 职能 |
|------|--------|------|
| 🧠 谋略官 | Strategus | 策略制定 · 方向把控 |
| 🛡️ 守卫官 | Custos | 风控管理 · 边界守护 |
| ⚡ 执行官 | Executor | 核心任务执行 |
| 📊 记录官 | Tabularius | 数据维护 · 状态追踪 |

**条令（Lex Praetoriana）：**
1. 每队全员持久化，项目存续期内 7×24 运行
2. 凯撒直接指挥，不经执政官和元老院
3. 可根据业务需要增减队内角色（标准四角色为骨架）
4. 成果由史官（Annalist）归档，定期向凯撒汇报

---

## 4. 元老院议制（Ordo Deliberandi）

### 4.1 四阶段闭环

| 阶段 | 拉丁名 | 方法论 | 说明 |
|------|--------|--------|------|
| 发散期 | Cogitatio | 六顶思考帽 | 不同维度的元老各自输出专业意见 |
| 冲突期 | Contentio | 红蓝对抗 | 元老之间互相 Review，推翻逻辑硬伤 |
| 收敛期 | Consensus | 德尔菲法 | 协调员提取公约数，匿名投票修正 |
| 产出期 | Decretum | 蓝帽总结 | 输出 Senatus Consultum（元老院决议） |

### 4.2 各阶段详细机制

**Phase 1 · Cogitatio（发散期）— 六顶思考帽**

每位 Senator 佩戴指定思考帽，从单一维度深挖：
- 🤍 白帽 Facta — 只提供客观数据事实
- ⬛ 黑帽 Periculum — 专找漏洞、风险、成本问题
- 🟡 黄帽 Valor — 寻找长期价值和可行性
- 🟢 绿帽 Novitas — 创新突破和非常规方案
- 🔴 红帽 Sensus — 直觉和感性判断

**Phase 2 · Contentio（冲突期）— 红蓝对抗**

- 蓝军 Defensores（提案方）提出方案
- 红军 Oppugnatores（挑战方）全力推翻
- 评判席 Iudices 根据博弈决定哪些修正必须纳入
- 目标：挤掉方案水分，产出具有落地韧性的结果

**Phase 3 · Consensus（收敛期）— 德尔菲法**

- 协调员 Moderator 汇总所有观点（隐去身份），提取公约数
- 进行 1-2 轮匿名投票（Suffragium Secretum）修正收敛
- 超过 3 轮未收敛 → Appellatio ad Caesarem（提交凯撒裁决）

**Phase 4 · Decretum（产出期）— 蓝帽总结**

蓝帽总结人 Praeses 输出 Senatus Consultum，必须包含：
- Legionarii — 军团兵角色清单（需要哪些执行 Agent）
- Officia — 具体分工（含 `depends_on` 依赖声明和 `context_from` 上下文传递）
- Norma — 交付标准
- Tempus — 时间估算
- Provisio — 风险预案

**结构化验证：** ordo-deliberandi Skill 自动检查 Senatus Consultum 的必填字段完整性。缺少任一必填项时，Skill 要求蓝帽总结人补充，而非直接进入军团兵征召。军团兵 DAG 的依赖关系从 `depends_on` 字段生成，`context_from` 确保下游军团兵能获取上游产出。

### 4.3 议事纪律（Lex Senatus）

1. **Silentium Rule** — 若无新增价值或实质性反对，禁止表达附和
2. **Perspectiva Tag** — 每轮发言需标注视角维度（数据/风险/创新/可行性）
3. **Appellatio ad Caesarem** — 超过 3 轮未收敛，提交凯撒裁决
4. **Decretum Format** — 产出必须包含：军团兵角色清单 + 分工 + 交付标准

---

## 5. 元老池（Collegium Senatorum）

12 位预设元老模板，每次议事由裁判官（Praetor）挑选 3-5 位。可随时扩展。

| 拉丁名 | 中文名 | 专业标签 |
|--------|--------|----------|
| Senator Oeconomicus | 宏观经济学家 | 宏观、政策、利率、通胀 |
| Senator Numerarius | 量化策略师 | 量化、风控、回测、因子 |
| Senator Architectus | 技术架构师 | 系统设计、API、性能、安全 |
| Senator Fabricator | 产品经理 | 用户需求、MVP、路线图、竞品 |
| Senator Artifex | 创意总监 | 品牌、文案、视觉、叙事 |
| Senator Cautus | 风险分析师 | 风控、合规、红线、尾部风险 |
| Senator Analyticus | 数据科学家 | 统计、ML、特征工程、可视化 |
| Senator Operarius | 运营专家 | 流程、效率、自动化、SOP |
| Senator Argentarius | 财务分析师 | 估值、现金流、ROI、预算 |
| Senator Iuridicus | 法务顾问 | 合规、协议、知识产权、监管 |
| Senator Mercator | 市场分析师 | 竞品、趋势、定位、增长 |
| Senator Humanitas | 用户体验师 | 交互、可用性、信息架构、A/B |

**元老模板结构：** System Prompt + Perspectiva（专业视角）+ Norma Iudicii（评判标准）

---

## 6. Agent 生命周期（Tres Ordines Vitae）

| 类型 | 拉丁名 | 说明 | 示例 |
|------|--------|------|------|
| 🟢 Always-on | Praesidium | 组织基础设施，24/7 运行 | 执政官、史官、财务官、水道官、探路者、护民官 |
| 🟡 Project-persistent | Praetoriani | 凯撒直属特勤队，项目存续期内全员常驻 | Cohors Specialis（谋略官/守卫官/执行官/记录官） |
| 🔵 Ephemeral | Temporarii | 按需征召，战役结束即归建解散 | 元老院元老、临时执行军团兵 |

**判断标准：** 如果角色需要跨项目的持续记忆 → 持久化。否则动态实例化，由史官归档成果。

---

## 7. 任务流转（Iter Mandati）

### 7.1 标准路线（经元老院）

```
Step 1  凯撒下达议题          Caesar decernit
Step 2  执政官接令+裁判官组阁   Consul & Praetor
Step 3  元老院四阶段议制       Senatus deliberat
Step 4  产出元老院决议         Senatus Consultum
Step 5  执政官征召军团兵       Consul legiones scribit
Step 6  军团兵执行 → 交付      Legionarii exsequuntur
Step 7  史官归档              Annalista scribit
```

### 7.2 佣兵外包（Via Mercenaria）

```
Caesar decernit → Consul iudicat → Condottiere mandat → Mercenarius exsequitur → Annalista scribit
```

不需要多视角讨论、但需要工程能力的中间复杂度任务。执政官通过 Condottiere Skill 调用外部 AI 工具（Claude Code / Codex 等）完成。

### 7.3 禁卫军直线（Via Praetoriana）

```
Caesar decernit → Cohors exsequitur → Annalista scribit
```

不经执政官和元老院，凯撒直接指挥，实时性优先。

### 7.4 四级路由选择标准

```
Caesar 下达任务 → Consul 评估：
  ├── Level 0 琐事    → Consul 直接处理（查日历、回消息）
  ├── Level 1 外包    → 佣兵执行（写代码、调 bug、做报表）
  ├── Level 2 议事    → 元老院讨论 → 军团兵执行（策略、设计、分析）
  └── Level 3 专项    → 禁卫军持续运维（量化交易、监控）
```

| 维度 | L0 琐事 | L1 佣兵外包 | L2 元老院 | L3 禁卫军 |
|------|--------|-----------|---------|---------|
| 需要讨论 | 否 | 否 | **是** | 凯撒直接指挥 |
| 需要工程 | 否 | **是** | 可能 | 是 |
| 目标明确 | 是 | **是** | 不完全 | 是 |
| 持续性 | 一次性 | 一次性 | 一次性 | **持续** |
| 执行者 | Consul | 外部 AI 工具 | 军团兵 (spawn) | 特勤队成员 |
| 典型案例 | 查日历、翻译 | 写脚本、搭环境 | 产品策略、架构 | 量化交易、运维 |

详见 `docs/MERCENARII.md`。

---

## 8. 技术实现备忘

### 8.1 基于 OpenClaw 的实现方向

- 每个 Always-on 角色 = 一个 OpenClaw Agent Workspace
- 元老模板 = SOUL.md 文件，存放在元老池目录
- 动态组阁 = 执政官通过 OpenClaw API 临时创建 Agent
- 军团兵 = 临时 Workspace，任务完成后清理
- 史官 = 持久化知识库（可用 Obsidian/Notion/向量数据库）

### 8.2 消息路由

- 凯撒 ↔ 执政官：Feishu / Telegram / Signal
- 执政官 → 元老院：Agent 间内部消息
- 军团兵 → 史官：自动归档 Webhook
- 凯撒 ↔ 禁卫军：直接消息通道

### 8.3 Prompt 工程架构

已实现的 prompt 体系：

**三层 Prompt 结构：**
- 身份层（Identity）：所有元老共享，定义"你是 SPQA 元老"
- 视角层（Perspectiva）：每位元老独有，差异化核心
- 约束层（Lex Senatus）：所有元老共享，包含 Silentium Rule 等纪律

**Prompt 尺寸约束：** 单个元老的完整 prompt（身份层 + 视角层 + 约束层 + 议题上下文）不超过 15,000 字符，以适配 OpenClaw 的 bootstrap 限制（单文件 20k，总量 150k）。

**编排模式：** 执政官作为外部编排器控制阶段流转（非元老院内部自治），保证可控性。

**关键 Prompt 设计决策：**
- 红军 prompt 采用激进语气（"你必须找出至少 3 个严重问题"），克服 LLM 的老好人倾向
- Phase 1 元老之间互相不可见，强制独立思考
- Phase 3 投票要求标注理由，不接受模糊表述
- 蓝军反驳轮限制为 1 轮，防止无限争论

**文件位置：**
- `agents/consul/SOUL.md` — 执政官核心 prompt
- `agents/consul/PRAETOR.md` — 裁判官选人逻辑
- `agents/consul/ORDO_DELIBERANDI.md` — 四阶段编排协议（含所有阶段的 prompt 模板）
- `agents/annalist/SOUL.md` — 史官归档 prompt
- `senators/BASE_TEMPLATE.md` — 元老共享基础模板
- `senators/s-*.md` — 12 位元老的差异化视角

### 8.4 待决设计问题

- [x] 元老院讨论的具体 prompt 工程方案
- [x] 裁判官的匹配算法细节
- [x] 军团兵实例化和销毁的自动化流程
- [x] 史官的知识库存储方案（基础版）
- [x] 综合办公室各角色的具体 skill 配置
- [x] 禁卫军特勤队的模板化创建流程
- [x] OpenClaw 具体集成方案（Agent 创建 API、消息路由）

**所有初始设计问题已解决。** 详细设计文档见 `docs/` 目录。

---

## 9. 变更记录

| 日期 | 变更 |
|------|------|
| 2026-03-13 | 初版架构设计完成：SPQA 全景、元老院议制、角色体系、生命周期 |
| 2026-03-13 | 综合办公室重构：强制/可选分离、统一 schema、自定义角色支持、护民官合并入探路者 |
| 2026-03-13 | 军团兵生命周期五阶段设计完成：征召→部署→执行→验收→解散 |
| 2026-03-13 | 禁卫军模板化：cohort schema、双路径创建（对话式+Dashboard）、指挥模式、标准角色骨架 |
| 2026-03-13 | Prompt 工程 MVP：执政官/裁判官/12 元老/四阶段编排/史官 prompt 全部完成 |
| 2026-03-13 | 皮肤系统设计：核心引擎与主题解耦、theme.yaml schema、商业化模式 |
| 2026-03-13 | OpenClaw 集成方案：概念映射、Workspace 结构、通讯架构、动态 Agent 管理、实现优先级 |
| 2026-03-13 | A2A 协议设计：消息信封格式、6 种消息类型、路由规则、Session 生命周期、状态管理 |
| 2026-03-13 | 多实例架构：Nexus/Castrum 拓扑、故障隔离、自治模式、降级直通、跨实例 A2A 通讯 |
| 2026-03-13 | Dashboard 设计：皮肤层实体化、三大功能区、Engine API、游戏化、多实例全景、商业定价 |
| 2026-03-13 | Dashboard 配置系统：双路径配置（可视化面板+工程长）、OpenClaw 配置映射、首次安装向导 |
| 2026-03-13 | 产品形态决策：SPQA 作为独立产品、OpenClaw 作为内嵌运行时引擎、安装分发策略 |
| 2026-03-13 | OpenClaw 基线：基于 v2026.3.11、零修改原则、sessions_spawn 简化临时 Agent、跟随上游策略 |
| 2026-03-13 | 佣兵体系：四级任务路由、Mercenarii 外包层、ACP Runtime 原生调用、Condottiere 编排 Skill |
| 2026-03-13 | 研究综合：OpenClaw 3.11 深度研究（session 模型、并发限制、记忆系统）、CrewAI 模式采纳（结构化验证、context 依赖）、Edict 对比确认多视角优势 |
