# SPQA 项目交接文档 — Claude Code Session Prompt

> 将此文档内容粘贴到 Claude Code 新 session 的第一条消息中，作为项目上下文。

---

## 项目概述

**SPQA (Senatus Populusque Agentium)** — AI-Native 组织架构，运行在 OpenClaw 3.11 上。

核心隐喻：罗马共和国政治架构。Caesar（用户）通过 Consul（执政官）指挥一个由元老院、军团兵、佣兵组成的 AI Agent 组织。

**产品定位**: SPQA 是独立产品，OpenClaw 是嵌入式运行时引擎。三层架构：Dashboard → Engine API Server → OpenClaw Runtime。

---

## 目录结构

```
SPQA/
├── ARCHITECTURE.md              # 核心设计哲学（必读）
├── docs/
│   ├── RESEARCH_NOTES.md        # OpenClaw 深度调研 + 设计决策（必读）
│   ├── OPENCLAW_BASELINE.md     # OpenClaw 3.11 API 精确签名
│   ├── OPENCLAW_INTEGRATION.md  # Agent 间协议 + workspace 结构
│   ├── MERCENARII.md            # 佣兵系统 (ACP)
│   ├── PRAETORIAN.md           # 禁卫军生命周期
│   ├── A2A_PROTOCOL.md         # Agent-to-Agent 通信协议
│   ├── DASHBOARD.md            # 前端架构
│   ├── THEME_SYSTEM.md         # 主题系统
│   ├── PRODUCT_FORM.md         # 商业定位
│   └── MULTI_INSTANCE.md       # 多实例拓扑
├── openclaw/                    # ★ OpenClaw 配置层（MVP 核心）
│   ├── openclaw.json            # 全局 agent 配置（dmScope, visibility, A2A）
│   ├── agents/
│   │   ├── consul/              # 执政官（SOUL/AGENTS/BOOT/TOOLS/MEMORY/USER.md）
│   │   │   └── skills/
│   │   │       ├── praetor/     # 裁判官：议题分析 + 元老筛选
│   │   │       ├── ordo-deliberandi/  # 四阶段审议（最核心 Skill）
│   │   │       ├── iter-legionum/     # 军团调度（DAG 执行）
│   │   │       └── condottiere/       # 佣兵队长（ACP 外派）
│   │   ├── annalist/            # 史官（归档）
│   │   └── curator/             # 水道官（运维 + 成本监控）
│   ├── spqa/
│   │   ├── config.yaml          # SPQA 全局参数
│   │   ├── senators/            # 12 个元老模板（s-*.md）
│   │   └── themes/spqa-roman/   # 罗马主题
│   ├── engine/
│   │   ├── server.js            # API 服务器（零依赖，纯 Node.js 内置模块）
│   │   └── config.js            # 路径配置（自动检测项目根）
│   ├── dashboard/
│   │   ├── index.html           # React SPA（CDN 加载，~52K）
│   │   ├── preview.html         # 纯静态预览（零依赖，可直接双击打开）
│   │   └── src/                 # 组件源码（api.js, pages/, components/）
│   └── docker-compose.yml       # 三服务编排
├── agents/                      # 设计层 agent 定义（role-meta.yaml + SOUL.md）
├── senators/                    # 设计层元老模板（含早期英文版，已有重复）
└── cohorts/                     # 禁卫军小队模板
```

---

## 关键技术约束

来自 OpenClaw 3.11 深度调研（详见 docs/RESEARCH_NOTES.md）：

| 约束 | 限制值 | 应对策略 |
|------|--------|---------|
| 并发 spawn | 8-10 触发 Gateway 看门狗重启 | SPQA 限制 ≤6 并发 |
| bootstrapMaxChars | 20,000 chars/文件 | 元老 prompt ≤15k chars |
| bootstrapTotalMaxChars | 150,000 chars | 全部元老组合 prompt 注意总量 |
| sessions_spawn cleanup | "archive" / "delete" | 元老用 archive 保留审议记录 |
| dmScope | "main" / "per-peer" / "per-channel-peer" | Consul=main, Annalist=per-peer |
| Tool visibility | "self" / "tree" / "agent" / "all" | Consul=tree, 其他=self |

**核心 API**: `sessions_send`(同步/异步), `sessions_spawn`(创建临时 agent), `sessions_list`, `sessions_history`

**Session 模型**: SessionKey (`agent:<agentId>:<baseKey>`) 用于路由, SessionId 用于存储

---

## 四级任务路由

- **L0 Trivium** → Consul 直接处理（日历、邮件、微小决策）
- **L1 Mercenarium** → Condottiere 调用外部 AI（Claude Code 等）via ACP
- **L2 Deliberatio** → Praetor 分析 → 元老院审议 → 军团兵执行
- **L3 Praetoriana** → 禁卫军持久化项目组

---

## 元老院审议流程 (Ordo Deliberandi)

四阶段：
1. **Cogitatio**（独立思考）— 各元老并行 spawn，互不可见
2. **Contentio**（交叉辩论）— Consul 汇总注入，红蓝对抗
3. **Consensus**（共识达成）— 德尔菲法收敛投票
4. **Decretum**（最终决议）— 产出 Senatus Consultum 结构化决议

最大 3 轮收敛，超过 → Appellatio ad Caesarem（上报凯撒）

---

## 12 位元老

oeconomicus(经济), numerarius(量化), architectus(架构), fabricator(产品), artifex(创意), cautus(风控), analyticus(数据), operarius(运营), argentarius(财务), iuridicus(法务), mercator(市场), humanitas(用户体验)

每位元老 prompt <2000 chars，组合 8.4k/15k（44% 利用率）

---

## Engine API Server

**零外部依赖**（npm 不可用时的应急方案），仅用 Node.js 内置模块：http, fs, path。

端口 3000，17 个端点：
- `GET /api/agents` — 列出所有 agent
- `GET /api/agents/:id` — agent 详情
- `POST /api/senate/deliberate` — 发起审议
- `GET /api/senate/active` — 活跃审议
- `GET /api/tasks` / `POST /api/tasks` — 任务管理
- `GET /api/mercenarii` / `GET /api/mercenarii/stats` — 佣兵统计
- `GET /api/config/openclaw` / `GET /api/config/spqa` — 配置
- `GET /api/theme` / `GET /api/theme/roles` — 主题
- `GET /api/health` — 健康检查

注意：当前 server.js 已移除 WebSocket（ws 模块不可用），Dashboard 用轮询。

---

## Dashboard

React 18 SPA，CDN 加载（React + Tailwind + Babel），单文件 index.html。
深色罗马主题：#1a1a2e(背景), #DAA520(金), #8B0000(深红)。

5 个页面：Curia(指挥中心), Senatus(元老院), Castra(军营), Tabularium(档案馆), Configuratio(配置)。

API 基础 URL 硬编码 `http://localhost:3000/api`，CORS 已在 server.js 配置。

---

## 已知问题 & TODO

### 高优先级
- [ ] Engine server.js 缺少 WebSocket 支持（ws 模块需要 npm install）
- [ ] Dashboard 组件用的是硬编码 mock 数据，需要接入真实 API fetch
- [ ] 根目录 `senators/` 下有早期重复文件（英文版 s-tech.md, s-quant.md 等），应清理
- [ ] `package.json` 里的 Vite 前端项目（src/, index.html）是早期遗留，与 openclaw/ 体系重复

### 中优先级
- [ ] 元老院审议流程需要真实 OpenClaw Gateway 连接才能 spawn
- [ ] Annalist 归档功能未实现（只有配置文件）
- [ ] Curator 健康巡检未实现
- [ ] config.yaml 的 YAML-lite parser 不够健壮（不支持数组、多行字符串）

### 低优先级
- [ ] Docker Compose 配置未测试
- [ ] nginx.conf 反向代理未测试
- [ ] 多实例 Nexus 架构只有文档没有实现

---

## 本地运行

```bash
# 终端 1: Engine API
cd openclaw/engine && node server.js

# 终端 2: Dashboard
cd openclaw/dashboard && python3 -m http.server 5173

# 浏览器打开 http://localhost:5173
```

需要 Node.js 22+。如果 npm 可用，可以 `npm install ws` 恢复 WebSocket 支持。

---

## 设计原则（不可违反）

1. **零修改原则**: 所有 SPQA 定制通过标准 OpenClaw 配置文件，不 fork OpenClaw
2. **元老间不直接通讯**: Phase 1 互不可见，Phase 2+ 由 Consul 汇总注入
3. **Consul 是显式编排器**: 按固定 Skill 流程执行，不是 hierarchical delegation
4. **多视角并行 > 单点审查**: 元老院模式天然对冲 LLM 单点过度自信
5. **临时 agent 用 sessions_spawn**: 不用 Workspace 目录（已废弃）
6. **中文为主**: language=zh-CN，用户 ADHD 风格，简洁直接

---

## 推荐下一步开发

1. **推到 GitHub**: `gh repo create SPQA --public --source=. --remote=origin --push`
2. **清理遗留**: 删除根目录重复的 senators/、src/、早期 index.html
3. **接入真实 API**: Dashboard 组件从 mock 数据改为 fetch Engine API
4. **安装 ws**: `npm install ws` 后恢复 server.js 的 WebSocket 支持
5. **连接 OpenClaw Gateway**: 测试真实的 sessions_spawn 流程
