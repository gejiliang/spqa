# Multi-Instance Architecture · 多实例部署

> 故障隔离 · 跨实例通讯 · 独立存活 · 降级直通

---

## 1. 为什么需要多实例

单实例部署下，所有 Agent 运行在同一个 OpenClaw 进程里。主实例崩溃 = 所有 Agent 同时不可用，包括那些**业务上不能停**的持久化团队（比如量化交易特勤队、7×24 舆情监控队）。

多实例的核心目标：

1. **故障隔离** — 特勤队独立于主实例运行，主实例故障不影响业务连续性
2. **资源亲和** — Castrum 部署在特定设备/网络上，就近访问该设备的软硬件资源（交易所低延迟服务器、GPU 推理机、本地 IoT 设备、本地数据库等）
3. **热备冗余**（V2+）— 同一 Cohort 配置部署到两个 Castrum，active-standby 模式，主挂备接管

---

## 2. 实例拓扑

### 两种实例类型

| 类型 | 拉丁名 | 说明 | 运行内容 |
|------|--------|------|---------|
| 主实例 | Nexus（中枢） | SPQA 核心控制面 | Consul、Annalist、Curator、可选角色、元老院/军团兵编排 |
| 营地实例 | Castrum（军营） | 独立运行的特勤队 | 一个 Praetorian Cohort 的全部成员 |

### 部署架构

```
┌─────────────────────────────────────────────────────┐
│                    Caesar · 凯撒                      │
│                 (Telegram / Discord / ...)            │
└────────┬───────────────────┬──────────────────┬──────┘
         │                   │                  │
         │ Gateway           │ Gateway          │ Gateway
         │ (常规)            │ (fallback)       │ (fallback)
         ▼                   ▼                  ▼
┌──────────────┐    ┌───────────────┐    ┌───────────────┐
│   Nexus       │    │  Castrum-α     │    │  Castrum-β     │
│   主实例       │    │  量化交易队     │    │  舆情监控队     │
│               │    │                │    │                │
│  Consul       │◄──►│  Strategus-α   │    │  Strategus-β   │
│  Annalist     │A2A │  Executor-α    │    │  Executor-β    │
│  Curator      │HTTP│  Custos-α      │    │  Custos-β      │
│  Explorator   │    │  Tabularius-α  │    │  Tabularius-β  │
│  Senate/Legion│    │                │    │                │
└──────────────┘    └───────────────┘    └───────────────┘
   OpenClaw #1         OpenClaw #2          OpenClaw #3
   (可部署在同一台     (可部署在不同机器
    机器或不同机器)     甚至不同地区)
```

### 部署灵活性

- **最小部署**：所有实例运行在同一台机器的不同端口（开发/个人使用）
- **标准部署**：Nexus 在本地/云端，Castrum 在需要低延迟的位置（如量化交易 Castrum 靠近交易所）
- **高可用部署**：每个实例独立机器，互相通过公网/VPN 通讯

### 资源亲和性场景

Castrum 独立部署最常见的驱动力不是故障隔离，而是**必须运行在特定设备上**：

| 场景 | 为什么需要独立 Castrum | 部署位置 |
|------|---------------------|---------|
| 量化交易 | 低延迟访问交易所 API | Co-location 机房 |
| GPU 推理 | 需要 GPU 硬件做模型推理 | GPU 服务器 |
| 本地设备控制 | 操作打印机、IoT、机器人 | 设备所在的本地机器 |
| 本地数据库 | 访问只允许 localhost 连接的数据库 | 数据库服务器 |
| 地域合规 | 数据不能出境 | 特定地区的服务器 |
| 内网资源 | 访问企业内网系统（ERP、OA） | 企业内网机器 |

---

## 3. 跨实例通讯

### 3.1 基于 A2A Protocol

实例之间使用 OpenClaw 的 A2A Protocol (v0.3.0)：HTTP(S) + JSON-RPC 2.0。每个实例发布 Agent Card 供对方发现。

```
Nexus ◄──── A2A Protocol (HTTP) ────► Castrum-α
        agent-card.json 互相注册
        JSON-RPC 任务交换
        Bearer Token 认证
```

### 3.2 Agent Card 配置

**Nexus 侧（主实例）：**

```yaml
# Nexus 的 A2A 配置
a2a:
  enabled: true
  endpoint: "https://nexus.spqa.local:18800/a2a"
  peers:
    - name: castrum-alpha
      agent_card_url: "https://castrum-alpha.spqa.local:18801/.well-known/agent-card.json"
      auth:
        type: bearer
        token: "${CASTRUM_ALPHA_TOKEN}"
    - name: castrum-beta
      agent_card_url: "https://castrum-beta.spqa.local:18802/.well-known/agent-card.json"
      auth:
        type: bearer
        token: "${CASTRUM_BETA_TOKEN}"
```

**Castrum 侧（营地实例）：**

```yaml
# Castrum-α 的 A2A 配置
a2a:
  enabled: true
  endpoint: "https://castrum-alpha.spqa.local:18801/a2a"
  peers:
    - name: nexus
      agent_card_url: "https://nexus.spqa.local:18800/.well-known/agent-card.json"
      auth:
        type: bearer
        token: "${NEXUS_TOKEN}"
```

### 3.3 消息流转

**正常状态（Nexus 在线）：**

```
凯撒指令 → Nexus/Consul → A2A → Castrum-α/Strategus-α
                                    │
Castrum-α 汇报 → A2A → Nexus/Consul → Gateway → 凯撒
```

特勤队的日常汇报通过 A2A 发给 Nexus 的 Consul，Consul 整理后通过 Gateway 转发凯撒。

**Nexus 故障（降级模式）：**

```
Castrum-α 检测到 Nexus 不可达
  │
  ├── 业务层：特勤队继续自主运行（自治模式）
  │
  └── 通讯层：Strategus-α 直接通过自己的 Gateway Channel 联系凯撒
              （不再经过 Consul 中转）
```

---

## 4. Castrum 自治能力

每个 Castrum 必须具备独立存活能力：

### 4.1 自治要素

| 要素 | 说明 | 实现方式 |
|------|------|---------|
| 业务连续性 | 核心业务不中断 | Castrum 有完整的业务逻辑，不依赖 Nexus 执行 |
| 状态管理 | 自己管理 state | 每个 Castrum 有独立的 workspace 和 state 文件 |
| 凯撒直通 | 能直接联系凯撒 | Strategus 配置独立的 Gateway Channel |
| 本地归档 | 不依赖 Annalist | Castrum 有本地 Tabularius（记录官），归档到本地文件 |
| 定时任务 | 自己的 cron 不受影响 | OpenClaw 实例级 cron job |

### 4.2 自治模式 vs 联网模式

```
                    Nexus 在线               Nexus 离线
                    ─────────               ──────────
汇报路径          → Consul → 凯撒          → 凯撒（直通）
归档              → A2A → Annalist          → 本地 Tabularius
凯撒指令          Consul 转发              凯撒直接对话 Strategus
新任务分配        Consul 编排              Strategus 自主决策
跨队协调          Consul 中转              暂停（或凯撒手动协调）
```

### 4.3 Castrum 的 Gateway 配置

每个 Castrum 的 Strategus（指挥官）配置独立的消息通道：

```yaml
# Castrum-α Strategus 的 channel 配置
channels:
  # 主通道：通过 Nexus/Consul 中转（正常模式）
  - type: a2a
    target: nexus/consul
    priority: primary

  # 备用通道：直达凯撒（降级模式）
  - type: telegram
    bot_token: "${CASTRUM_ALPHA_BOT_TOKEN}"
    chat_id: "${CAESAR_CHAT_ID}"
    priority: fallback
    activate_when: nexus_unreachable
```

---

## 5. 故障检测与切换

### 5.1 双向心跳

```
Nexus/Curator ──heartbeat──► Castrum-α   (水道官监控营地)
Castrum-α     ──heartbeat──► Nexus       (营地监控中枢)
```

**水道官（Curator）监控 Castrum：**
- 定期 A2A ping 每个 Castrum
- 失联 → alert 给凯撒

**Castrum 监控 Nexus：**
- Strategus 定期 A2A ping Nexus
- 这是 Castrum 决定是否切换到自治模式的依据

### 5.2 故障判定规则

```
Castrum-α Strategus 的 Nexus 健康检查：

每 60 秒 ping Nexus
  │
  ├── 响应正常 → nexus_status: online → 联网模式
  │
  ├── 连续 3 次无响应（3 分钟）
  │     → nexus_status: degraded
  │     → 开始缓存待发送给 Consul 的消息
  │     → 尝试备用端点（如果配置了多个）
  │
  └── 连续 10 次无响应（10 分钟）
        → nexus_status: offline
        → 切换到自治模式
        → 激活 fallback Gateway（直通凯撒）
        → 通知凯撒："中枢失联，我已切换到自治模式"
```

### 5.3 恢复流程

```
Nexus 恢复上线：
  │
  ① Castrum 的下一次 heartbeat 检测到 Nexus 响应
  ② nexus_status: online
  ③ 同步缓存期间的消息和状态给 Nexus/Consul
  ④ 恢复联网模式（汇报路径切回 Consul 中转）
  ⑤ Strategus 通知凯撒："中枢已恢复，切回联网模式"
  ⑥ Tabularius 将离线期间的本地归档推送给 Annalist
```

---

## 6. 数据同步

### 6.1 归档同步

正常模式下，Castrum 的产出通过 A2A 发给 Nexus/Annalist 统一归档。离线模式下，Castrum 的 Tabularius 本地归档。恢复后做增量同步。

```
正常模式：
  Castrum 产出 → A2A → Nexus/Annalist → archive/

离线模式：
  Castrum 产出 → 本地 Tabularius → castrum-archive/

恢复后：
  castrum-archive/ 增量 → A2A → Nexus/Annalist → archive/
  （由 Tabularius 主动推送，Annalist 去重合并）
```

### 6.2 同步策略

- **只同步归档数据**，不同步运行时状态。每个实例管自己的 state。
- **增量推送**：Tabularius 记录上次成功同步的时间戳，只推送新增内容。
- **幂等写入**：每条归档记录有唯一 ID（基于 session_id + timestamp），Annalist 收到重复记录直接跳过。
- **冲突处理**：不会有冲突——Castrum 只写自己的数据，Nexus 不会修改 Castrum 的归档。

---

## 7. 安全边界

### 7.1 实例间认证

- A2A 通讯使用 Bearer Token 认证（每对实例一个独立 token）
- Token 通过环境变量注入，不硬编码在配置文件里
- 可选：mTLS（双向 TLS）用于高安全场景

### 7.2 权限隔离

```
Nexus 能做什么：
  ✅ 向 Castrum 发送指令（通过 A2A）
  ✅ 读取 Castrum 的汇报
  ✅ 触发 Castrum 的健康检查
  ❌ 不能直接操作 Castrum 内部 Agent 的 workspace
  ❌ 不能停止 Castrum 的运行

Castrum 能做什么：
  ✅ 向 Nexus/Consul 发送汇报
  ✅ 推送归档数据给 Annalist
  ✅ 独立运行自己的业务
  ✅ 降级模式下直通凯撒
  ❌ 不能操作 Nexus 的其他 Agent
  ❌ 不能触发元老院议事（只有 Consul 可以）
  ❌ 不能创建/销毁其他 Castrum
```

### 7.3 量化交易场景的额外安全

量化交易 Castrum 需要额外的安全措施：

- **网络隔离**：交易 API 的凭证只存在 Castrum 本地，Nexus 不可见
- **操作审计**：所有交易操作 Tabularius 实时记录
- **熔断机制**：Custos（守卫官）内置风控规则，独立于 Nexus 生效
- **紧急停止**：凯撒可以通过 fallback Gateway 直接命令 Custos 停止所有交易

---

## 8. 具体场景：量化交易特勤队

### Cohort 配置

```yaml
# cohort-meta.yaml for Castrum-quant
id: cohort-quant
code: Cohors Argentaria
deployment: castrum                    # 独立实例部署
castrum_config:
  instance_name: castrum-quant
  port: 18803
  fallback_gateway:
    type: telegram
    activate_when: nexus_unreachable
  heartbeat_interval: 60               # 秒
  nexus_offline_threshold: 10          # 次数

command_mode: hierarchical
members:
  - id: strategus-quant
    role: 量化策略师
    is_commander: true
    capabilities: [strategy, risk_assessment, position_sizing]

  - id: executor-quant
    role: 交易执行官
    capabilities: [order_execution, market_data, exchange_api]
    tools:
      - exchange_api_read
      - exchange_api_trade
      - market_data_stream

  - id: custos-quant
    role: 风控守卫
    capabilities: [risk_monitoring, circuit_breaker, position_limits]
    emergency_direct: true              # 风控可直通凯撒
    tools:
      - portfolio_monitor
      - circuit_breaker

  - id: tabularius-quant
    role: 交易记录官
    capabilities: [trade_logging, pnl_tracking, sync_archive]
```

### 运行时序

```
正常模式 (Nexus online)：
─────────────────────
06:00  Strategus 检查市场数据，制定日内策略
06:05  Strategus → Executor: 执行开仓指令
06:05  Custos: 实时监控仓位和风险
06:06  Executor 下单成功 → Tabularius 记录
09:00  Strategus → A2A → Consul: 发送晨报
18:00  Strategus → A2A → Consul: 发送日报
       Tabularius → A2A → Annalist: 同步交易记录

Nexus 故障模式：
─────────────────────
14:30  Strategus heartbeat → Nexus 无响应 (1/10)
14:31  继续正常交易...
14:39  heartbeat 连续 10 次无响应
14:40  Strategus: nexus_status → offline
14:40  Strategus → Telegram → 凯撒: "中枢失联，已切换自治模式，交易照常"
14:40  缓存所有待发 Consul 的消息
15:00  Custos 触发风控规则 → 平仓
15:00  Custos → Telegram → 凯撒: "风控触发强制平仓，详情: ..."
       (emergency_direct，不等 Nexus)
...
16:20  Nexus 恢复
16:21  Strategus heartbeat 成功
16:21  Strategus → A2A → Consul: "中枢已恢复，推送离线期间数据"
16:22  Tabularius → A2A → Annalist: 增量同步 14:40-16:20 的交易记录
```

---

## 9. 与 A2A Protocol 消息格式的关系

跨实例的 A2A 消息仍然使用 SPQA 标准信封格式（见 A2A_PROTOCOL.md 第 3 节），但在头部增加一个可选的 `instance` 字段：

```
[SPQA-MSG]
from: cohort-quant-strategus
to: consul
type: report
priority: normal
instance: castrum-quant → nexus       # 跨实例标记
ref: cohort-quant
---
量化交易日报：
...
```

实例内消息不需要 `instance` 字段（默认本地）。编排层看到 `instance` 字段时，走 A2A HTTP 路由而非 sessions_send。

---

## 10. 与皮肤系统的关系

多实例拓扑是引擎层概念，皮肤不影响它。

- `nexus` / `castrum` 是引擎层的实例类型名
- 皮肤层可以给它们起展示名（如罗马皮肤：Nexus = "元老院山丘"，Castrum = "军营"；董事会皮肤：Nexus = "总部"，Castrum = "分公司"）
- 但底层配置、通讯、故障切换逻辑完全不受皮肤影响

---

## 11. 实现优先级

### MVP — 单实例

不实现多实例。所有 Agent 在同一个 OpenClaw 实例内，禁卫军也是。

### V1 — 可选多实例

- 支持 Castrum 独立部署
- A2A 跨实例基础通讯
- fallback Gateway 直通凯撒
- 手动配置实例拓扑

### V2 — 完整多实例

- 自动健康检测和模式切换
- 离线归档增量同步
- Dashboard 多实例管理视图
- 一键部署 Castrum（配置生成 + 启动脚本）

### V3 — 高可用

- Castrum 热备（active-standby），主挂备自动接管
- 状态实时同步（active → standby 单向复制）
- Nexus 多副本（如果需求出现）
- 自动 failover + 自动 failback

---

## 12. Agent 迁移（Migratio）

把一个 Agent 或整个 Cohort 从一个实例转移到另一个实例。

### 12.1 迁移场景

| 场景 | 方向 | 触发方式 |
|------|------|---------|
| 硬件维护 | Castrum-α → Castrum-β | 凯撒手动触发 |
| 负载均衡 | 过载实例 → 空闲实例 | Curator 建议 + 凯撒批准 |
| 环境升级 | 旧 Castrum → 新 Castrum | 凯撒手动触发 |
| Nexus 拆分 | Nexus 中的 Cohort → 新 Castrum | 业务增长后独立部署 |
| Castrum 合并 | Castrum → Nexus | 业务缩减，不再需要独立实例 |

### 12.2 迁移内容

一个 Agent 的完整状态由以下部分组成：

```
Agent 迁移包 (Migration Bundle)
├── SOUL.md              ← 角色定义
├── AGENTS.md            ← 配置
├── MEMORY.md            ← 长期记忆（关键）
├── memory/              ← 记忆日志
├── workspace/           ← 工作文件
├── role-meta.yaml       ← 角色元数据
└── state/               ← 活跃 session 状态（如有）
```

整个 Cohort 迁移时，还包括：
```
cohort-meta.yaml         ← 队伍配置
shared/                  ← 队内共享文件
castrum-archive/         ← 本地归档（未同步部分）
```

### 12.3 迁移流程

```
① 凯撒下令迁移（或 Curator 建议 + 凯撒批准）

② 源实例准备：
   ├── Strategus 通知队员"准备迁移"
   ├── 完成正在执行的任务（或暂停到安全点）
   ├── 刷新所有内存状态到文件
   └── 打包 Migration Bundle

③ 传输：
   ├── Bundle 通过安全通道传输到目标实例
   │   （SSH/SFTP、对象存储中转、或 A2A 大文件传输）
   └── 校验完整性（checksum）

④ 目标实例部署：
   ├── 解包 Bundle 到目标 Workspace 目录
   ├── 更新 A2A 配置（注册新的 Agent Card endpoint）
   ├── 启动 Agent
   └── 健康检查确认正常

⑤ 切换路由：
   ├── Nexus 更新 peer 配置（指向新 Castrum 地址）
   ├── Gateway Channel 更新（如果 fallback bot 地址变了）
   └── 通知凯撒迁移完成

⑥ 源实例清理：
   ├── 确认目标运行正常（观察期 1 小时）
   └── 删除源实例上的旧 Agent 数据
```

### 12.4 冷迁移 vs 热迁移

**MVP 只支持冷迁移** — Agent 停止 → 打包传输 → 新位置启动。业务有短暂中断。

**V3 热迁移（如果需求出现）：**
- 源和目标同时运行，双写状态
- 流量逐步切换（类似蓝绿部署）
- 切换完成后停止源
- 复杂度高，只在业务确实不能中断时才做

### 12.5 迁移与皮肤无关

迁移的是引擎层数据。agent_id、通讯协议、state 格式都是引擎层的，皮肤层的展示名不影响迁移。

---

## 13. 设计约束与取舍

**为什么 MVP 只做冷迁移？**
热迁移需要双写和流量切换，复杂度远高于收益。大多数场景下（硬件维护、环境升级）业务允许几分钟的中断。量化交易等不能中断的场景优先用热备（V3）解决，而不是热迁移。

**为什么不做 Nexus 高可用（多副本）？**
MVP 阶段 Nexus 是单点，但它的职能（编排 + 日常助理）允许短暂不可用。真正不能停的业务在 Castrum 里，Castrum 有自治能力。如果未来需要 Nexus 高可用，可以在 Nexus 前面加一层（但这已经是 V3+ 的事了）。

**为什么一个 Castrum 只放一个 Cohort？**
故障隔离的粒度。如果两个 Cohort 共享 Castrum，其中一个的资源耗尽可能影响另一个。独立进程 = 独立故障域。

**Castrum 之间能互相通讯吗？**
不允许。Castrum 之间的协调必须通过 Nexus/Consul（联网模式）或凯撒（离线模式）。这保持了架构简洁——没有 mesh 网络，只有 hub-and-spoke。

**凯撒怎么知道该对哪个 Castrum 说话？**
每个 Castrum 的 Strategus 在 fallback Gateway 上有独立的 bot identity。凯撒在 Telegram 上会看到多个 bot：Consul（主）、Quant-Strategus（量化队长）、Monitor-Strategus（监控队长）。正常情况下只跟 Consul 说话，Castrum 的 bot 只在降级时主动联系凯撒。
