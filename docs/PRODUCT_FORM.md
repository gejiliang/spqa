# 产品形态 · Product Form

> SPQA 与 OpenClaw 的关系：整合而非插件

---

## 1. 决策结论

**SPQA 是独立产品，OpenClaw 作为内嵌运行时引擎。**

用户下载的是 SPQA，打开的是 SPQA Dashboard，交互的是 SPQA 的角色体系。OpenClaw 是底层引擎，用户不需要知道它的存在——就像 Electron 之于 VS Code，V8 之于 Node.js。

---

## 2. 决策理由

### 2.1 为什么不做插件

| 问题 | 说明 |
|------|------|
| UX 断裂 | 用户先装 OpenClaw（UX 差） → 再装 SPQA 插件 → 两套界面混杂 |
| 能力受限 | 插件 API 不一定暴露文件系统读写能力，工程长（配置专家）无法直接操作 SOUL.md 等文件 |
| 商业被动 | 定价、皮肤商城、企业定制全部受平台政策约束 |
| 心智负担 | 用户需要理解 OpenClaw + SPQA 两个概念 |

### 2.2 为什么整合可行

| 条件 | 说明 |
|------|------|
| OpenClaw 开源 | 可以自由嵌入，无授权问题 |
| Dashboard 覆盖全部交互 | 对话、议事、配置、监控——用户不再需要 OpenClaw 的原生界面 |
| 工程长替代 CLI 配置 | 自然语言配置 + 可视化面板 = 完全替代 OpenClaw 的 markdown/YAML 配置方式 |
| 首次安装向导 | Initium 引导新用户完成全部初始配置，零门槛 |

---

## 3. 产品架构

```
┌──────────────────────────────────────────────────────────────┐
│                    SPQA · 用户看到的产品                       │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  Dashboard（皮肤层 · theme.yaml 驱动）                  │   │
│  │  • 全景图 • 对话 • 议事实况 • 配置 • 监控              │   │
│  └────────────────────────┬──────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐   │
│  │  Engine API Server（中间层）                             │   │
│  │  • REST + WebSocket                                    │   │
│  │  • 聚合多实例状态                                       │   │
│  │  • 配置读写 + 验证                                      │   │
│  │  • 皮肤管理                                             │   │
│  └────────────────────────┬──────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐   │
│  │  OpenClaw Runtime（内嵌引擎 · 用户不可见）               │   │
│  │  • Agent 生命周期管理                                    │   │
│  │  • Session 管理（send / spawn / history）               │   │
│  │  • Gateway Channel（Telegram/Discord/Slack）            │   │
│  │  • 工具调用（MCP Tools）                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SPQA 组织架构（配置层）                                 │   │
│  │  • SOUL.md / AGENTS.md / TOOLS.md (per agent)         │   │
│  │  • senators/*.md (元老池)                               │   │
│  │  • cohorts/*/ (特勤队)                                  │   │
│  │  • theme.yaml (皮肤)                                    │   │
│  │  • state.yaml (运行时状态)                               │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 3.1 三层职责

| 层 | 职责 | 技术选型 |
|----|------|---------|
| Dashboard | 用户界面 · 皮肤渲染 · 交互 | React + theme.yaml |
| Engine API | 数据聚合 · 配置管理 · 事件推送 | Node.js / Python |
| OpenClaw Runtime | Agent 运行 · Session 管理 · 工具调用 | OpenClaw (嵌入) |

### 3.2 用户感知 vs 技术实现

| 用户看到的 | 实际发生的 |
|-----------|-----------|
| 打开 SPQA | 启动 OpenClaw + Engine API + Dashboard |
| 和执政官对话 | Dashboard → Engine API → OpenClaw sessions_send → Consul Agent |
| 元老院开会 | Consul → sessions_spawn → 创建隔离 Session |
| 配置系统 | Dashboard → Engine API → 直接读写 OpenClaw 配置文件 |
| 安装新皮肤 | 下载 theme.yaml + assets → themes/ 目录 → 热切换 |
| 部署 Castrum | Engine API → 配置 A2A peer → 远端启动新 OpenClaw 实例 |

---

## 4. 安装与分发

### 4.1 安装体验目标

```
下载 SPQA → 双击安装 → 打开 Dashboard → 工程长引导配置 → 开始使用
```

全程不出现"OpenClaw"这个词。

### 4.2 打包方式

| 方式 | 适用阶段 | 说明 |
|------|---------|------|
| Docker Compose | MVP / 开发者 | `docker compose up` 一键启动全部组件 |
| Desktop App (Electron/Tauri) | V1 | 打包成桌面应用，内嵌 OpenClaw 二进制 |
| CLI 安装器 | V1 | `npx create-spqa` 或 `pip install spqa` |
| 云托管版 | V2 | SPQA Cloud —— 注册即用，无需本地安装 |

### 4.3 升级策略

SPQA 版本包含 OpenClaw 版本依赖。升级 SPQA 时自动处理 OpenClaw 升级：

```
SPQA v1.2.0
├── OpenClaw v0.9.x (pinned)
├── Engine API v1.2.0
├── Dashboard v1.2.0
└── Default Theme (spqa-roman) v1.0.0
```

用户执行 `spqa upgrade`，全部组件一起升级。OpenClaw 的 breaking changes 由 SPQA 的 Engine API 层吸收，用户无感。

---

## 5. OpenClaw 的角色定位

### 5.1 SPQA 使用 OpenClaw 的什么

| OpenClaw 能力 | SPQA 如何使用 |
|-------------|-------------|
| Agent Workspace | 每个 SPQA 角色对应一个 Workspace |
| sessions_send | 持久化 Agent 间 A2A 通讯 |
| sessions_spawn | 临时 Agent（元老、军团兵）的创建与隔离 |
| sessions_history | Engine API 获取对话历史 |
| Gateway Channel | Telegram/Discord/Slack 消息通道 |
| MCP Tools | Agent 的工具调用能力 |
| Heartbeat | Agent 周期性任务 |
| Context Pruning | 长期记忆管理 |

### 5.2 SPQA 在 OpenClaw 之上增加的

| 增加的能力 | 说明 |
|-----------|------|
| 组织架构 | 角色体系、权限模型、信息路由 |
| 编排协议 | 四阶段议制、军团兵 DAG |
| 主题系统 | 皮肤 + Dashboard + 游戏化 |
| 配置系统 | 工程长 + 可视化面板 + 安装向导 |
| 多实例管理 | Nexus/Castrum 拓扑 + 故障隔离 |
| 状态管理 | state.yaml + crash recovery |
| 商业化 | 皮肤商城 + 企业定制 |

### 5.3 与 OpenClaw 社区的关系

SPQA 不 fork OpenClaw，而是作为上游消费者：

- 跟踪 OpenClaw 主线版本
- 向 OpenClaw 贡献通用能力的改进（如 sessions_spawn 的增强需求）
- SPQA 的需求可以反哺 OpenClaw 的 API 设计
- 如果 OpenClaw 推出官方插件系统，可以考虑发布一个精简版 SPQA 插件（引流到完整产品）

---

## 6. 与其他设计文档的关系

| 文档 | 关系 |
|------|------|
| ARCHITECTURE.md | 产品形态决策影响全局架构表述 |
| OPENCLAW_INTEGRATION.md | 从"集成方案"升级为"引擎嵌入方案" |
| DASHBOARD.md | Dashboard 不再是"OpenClaw 的面板"，而是"SPQA 的主界面" |
| THEME_SYSTEM.md | 皮肤是 SPQA 产品的差异化卖点，不是 OpenClaw 的装饰 |
| MULTI_INSTANCE.md | 多实例部署由 SPQA 统一管理，OpenClaw 实例是被管理对象 |

---

## 7. 实现优先级

### MVP — Docker Compose

- `docker-compose.yml` 包含 OpenClaw + Dashboard（静态前端）
- Dashboard 直连 OpenClaw API（无 Engine API 中间层）
- 安装命令：`git clone && docker compose up`
- 工程长内嵌在 Dashboard 前端（直接调用 LLM API）

### V1 — CLI 安装器 + Desktop App

- `npx create-spqa` 或 Tauri 桌面应用
- 内嵌 OpenClaw 二进制
- Engine API Server 中间层
- 自动升级机制

### V2 — Cloud + Marketplace

- SPQA Cloud（注册即用）
- 皮肤商城
- 一键部署 Castrum 到云端

---

## 8. 品牌策略

- **产品名**：SPQA（不带 OpenClaw）
- **Tagline**：AI-Native Organization Architecture
- **技术说明**（仅在文档/About 中提及）：Powered by OpenClaw Runtime
- **对外话术**：SPQA 是一个让 AI Agent 以组织形式协作的产品。你不需要了解底层技术细节。
