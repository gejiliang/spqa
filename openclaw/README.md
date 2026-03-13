# S·P·Q·A — Senatus Populusque Agentium

**元老院与 Agent · AI-Native 组织架构**

SPQA 是一个基于 OpenClaw 的多 Agent 协作系统，用罗马共和国的分权治理模型组织 AI Agent：元老院多视角决策，军团兵动态执行，佣兵外包工程任务。

---

## 快速启动

### 方式一：Docker Compose（推荐）

```bash
# 克隆项目
git clone <repo-url> spqa && cd spqa/openclaw

# 配置 Discord Bot Token
# 编辑 openclaw.json → channels.discord.botToken

# 启动所有服务
docker compose up -d

# 访问 Dashboard
open http://localhost:5173
```

### 方式二：本地开发

```bash
# 1. 安装 OpenClaw（需要已有 OpenClaw 环境）
# 将 agents/ 和 spqa/ 复制到 ~/.openclaw/
cp -r agents/* ~/.openclaw/agents/
cp -r spqa/* ~/.openclaw/spqa/
cp openclaw.json ~/.openclaw/openclaw.json

# 2. 启动 Engine API
cd engine && npm install && npm start

# 3. 启动 Dashboard
cd ../dashboard && python3 -m http.server 5173
# 或用任何静态文件服务器

# 4. 访问
open http://localhost:5173
```

---

## 架构概览

```
┌──────────────────────────────────────────────────┐
│            SPQA · 用户看到的产品                    │
│  ┌────────────────────────────────────────────┐   │
│  │  Dashboard (React SPA · :5173)             │   │
│  └──────────────────┬─────────────────────────┘   │
│  ┌──────────────────▼─────────────────────────┐   │
│  │  Engine API Server (Node.js · :3000/:4000) │   │
│  └──────────────────┬─────────────────────────┘   │
│  ┌──────────────────▼─────────────────────────┐   │
│  │  OpenClaw Runtime (Gateway · :18789)       │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

## 核心角色

| 角色 | 拉丁名 | 职能 | 生命周期 |
|------|--------|------|---------|
| 🏛 凯撒 | Caesar | 你（最高决策者） | 永恒 |
| ⚜️ 执政官 | Consul | 首席助理 · 任务路由 | Always-on |
| 📚 史官 | Annalista | 归档 · 知识库 | Always-on |
| 🌊 水道官 | Curator | 运维 · 监控 | Always-on |
| ⚖️ 裁判官 | Praetor | 议题分析 · 选人 | Consul Skill |
| 🏛 元老 | Senatus | 多视角决策（3-5人） | Ephemeral |
| ⚔️ 军团兵 | Legionarii | 按决议执行 | Ephemeral |
| 🗡️ 佣兵 | Mercenarii | 外部AI工具（代码/调试） | Per-task |
| 🛡️ 禁卫军 | Praetoriani | 长期项目特勤队 | Project |

## 四级任务路由

```
Caesar → Consul 评估 →
  ├── L0 琐事    → Consul 直接处理
  ├── L1 外包    → 佣兵（ACP → Claude Code）
  ├── L2 议事    → 元老院 → 军团兵
  └── L3 专项    → 禁卫军
```

## 目录结构

```
openclaw/
├── openclaw.json            ← OpenClaw 全局配置
├── docker-compose.yml       ← 部署配置
├── agents/
│   ├── consul/              ← 执政官（6 配置文件 + 4 Skills）
│   ├── annalist/            ← 史官
│   └── curator/             ← 水道官
├── spqa/
│   ├── senators/            ← 12 元老模板
│   ├── themes/spqa-roman/   ← 罗马主题
│   └── config.yaml          ← SPQA 层配置
├── engine/                  ← Engine API Server
└── dashboard/               ← Dashboard UI
```

## 设计文档

详见 `../docs/` 目录：

| 文档 | 内容 |
|------|------|
| ARCHITECTURE.md | 总体架构 · 角色体系 · 议制 |
| OPENCLAW_BASELINE.md | OpenClaw 3.11 能力清单 · API · 限制 |
| MERCENARII.md | 佣兵体系 · ACP · 四级路由 |
| DASHBOARD.md | Dashboard 设计 |
| RESEARCH_NOTES.md | OpenClaw/CrewAI/Edict 研究综合 |
| PRODUCT_FORM.md | 产品形态决策 |

---

**SPQA v0.1.0 · Powered by OpenClaw Runtime**
