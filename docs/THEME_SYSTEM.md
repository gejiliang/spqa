# Theme System · 皮肤系统设计

> 核心引擎与主题皮肤解耦 · 商业化基础

---

## 1. 核心思路

SPQA 的价值分两层：

- **核心引擎**：编排模式（入口调度 → 专家选人 → 多视角讨论 → 执行 → 归档）
- **主题皮肤**：角色命名、术语体系、UI 风格、叙事语境

引擎是开源的基础能力，皮肤是可售卖的差异化产品。用户选一套皮肤，整个系统的角色名、交互用语、界面风格都随之切换。

---

## 2. 核心角色抽象

所有皮肤共享同一套核心角色（Abstract Role），皮肤只做命名和风格映射。

| Abstract Role | 职能（不随皮肤变） | 生命周期 |
|--------------|-------------------|---------|
| `orchestrator` | 系统入口 · 用户助理 · 编排中枢 | Always-on, Required |
| `selector` | 议题分析 · 专家匹配 | Subagent of orchestrator |
| `panel` | 集体决策机构 · 多专家讨论 | Ephemeral |
| `expert` | 专家模板 · 差异化视角 | Ephemeral |
| `worker` | 临时执行者 | Ephemeral |
| `archivist` | 组织记忆 · 归档 | Always-on, Required |
| `monitor` | 基础设施 · 成本监控 | Always-on, Required |
| `scout` | 情报与舆情（可选） | Always-on, Optional |
| `treasurer` | 财务管理（可选） | Always-on, Optional |
| `guard_team` | 持久化项目组 | Project-persistent |
| `guard_member` | 项目组成员 | Project-persistent |
| `mercenary` | 外部 AI 工具 · 按需雇佣执行 | Per-task (外部调用) |
| `configurator` | 配置专家 · 系统调优 | Dashboard-embedded (非独立 Agent) |

---

## 3. 皮肤结构（theme.yaml）

```yaml
# theme.yaml · 皮肤定义文件

# === 元信息 ===
id: spqa-roman                  # 唯一标识
name: "S·P·Q·A 元老院与Agent"    # 显示名
description: "以罗马共和制为蓝本的 AI-Native 组织架构"
author: "SPQA Team"
version: "1.0.0"
locale: zh-CN                   # 主语言
price: free                     # free | paid
preview_image: ./preview.png    # 预览图

# === 风格 ===
style:
  primary_color: "#C9A84C"      # 主色
  accent_color: "#E85D75"       # 强调色
  secondary_color: "#8B5CF6"    # 辅助色
  background: "#08070A"         # 背景色
  font_display: "serif"         # 标题字体风格
  font_body: "sans-serif"       # 正文字体风格
  icon_set: "roman"             # 图标集

# === 角色映射 ===
roles:
  user:
    name: "Caesar · 凯撒"
    title: "Imperator Caesar"
    emoji: "🏛"
    description: "最高决策者 · 你本人"

  orchestrator:
    name: "Consul · 执政官"
    title: "Consul"
    emoji: "⚜️"
    description: "凯撒的首席助理 · 生活管家兼项目启动器"

  selector:
    name: "Praetor · 裁判官"
    title: "Praetor"
    emoji: "⚖️"
    description: "议题分析师 · 专家筛选器"

  panel:
    name: "Senatus · 元老院"
    title: "Senatus"
    emoji: "⚔️"
    description: "集体决策机构 · 多专家讨论达成共识"

  expert:
    name: "Senator · 元老"
    title: "Senator"
    emoji: "🎓"
    description: "领域专家 · 从专家池按需选取"

  worker:
    name: "Legionary · 军团兵"
    title: "Legionarii"
    emoji: "⚔️"
    description: "临时执行者 · 任务完成即解散"

  archivist:
    name: "Annalist · 史官"
    title: "Annalista"
    emoji: "📚"
    description: "组织记忆管理员"

  monitor:
    name: "Curator Aquarum · 水道官"
    title: "Curator Aquarum"
    emoji: "🌐"
    description: "IT 基础设施运维 + API 成本监控"

  scout:
    name: "Explorator · 探路者"
    title: "Explorator"
    emoji: "🔍"
    description: "情报与舆情侦察兵"

  treasurer:
    name: "Quaestor · 财务官"
    title: "Quaestor"
    emoji: "💰"
    description: "凯撒的财务管家"

  guard_team:
    name: "Cohors Specialis · 特勤队"
    title: "Praetoriani"
    emoji: "🛡️"
    description: "凯撒直属持久化项目组"

  mercenary:
    name: "Mercenarius · 佣兵"
    title: "Mercenarii"
    emoji: "🗡️"
    description: "外部雇佣的专业执行者 · 按需征召"

  configurator:
    name: "Praefectus Fabrum · 工程长"
    title: "Praefectus Fabrum"
    emoji: "🔧"
    description: "系统配置专家 · Dashboard 常驻顾问"

  guard_member:
    standard_roles:
      - id: strategist
        name: "Strategus · 谋略官"
        emoji: "🧠"
      - id: guardian
        name: "Custos · 守卫官"
        emoji: "🛡️"
      - id: executor
        name: "Executor · 执行官"
        emoji: "⚡"
      - id: recorder
        name: "Tabularius · 记录官"
        emoji: "📊"

# === 术语映射 ===
terminology:
  topic: "Quaestio · 议题"
  decision: "Senatus Consultum · 元老院决议"
  expert_pool: "Collegium Senatorum · 元老池"

  # 四阶段议制
  phase_1: "Cogitatio · 发散期"
  phase_2: "Contentio · 冲突期"
  phase_3: "Consensus · 收敛期"
  phase_4: "Decretum · 产出期"

  # 议事规则
  silence_rule: "Silentium Rule · 沉默律"
  escalation: "Appellatio ad Caesarem · 提交凯撒裁决"

  # 生命周期
  always_on: "Praesidium · 核心卫戍"
  persistent: "Praetoriani · 禁卫军"
  ephemeral: "Temporarii · 临时征召"

  # 军团兵阶段
  recruit: "Conscriptio · 征召"
  deploy: "Dispositio · 部署"
  execute: "Executio · 执行"
  accept: "Acceptio · 验收"
  disband: "Dissolutio · 解散"

# === 专家池模板 ===
# 皮肤可以预设一套专家池，也可以让用户自定义
expert_pool:
  - id: "expert-01"
    name: "Senator Oeconomicus · 宏观经济学家"
    tags: ["宏观", "政策", "利率", "通胀"]
    emoji: "📊"
  - id: "expert-02"
    name: "Senator Architectus · 技术架构师"
    tags: ["系统设计", "API", "性能", "安全"]
    emoji: "🏗️"
  # ... 其余专家
```

---

## 4. 皮肤示例

### 已实现
- **SPQA Roman**（罗马元老院） — 当前默认皮肤

### 规划中

| 皮肤 ID | 名称 | 语境 | 风格调性 |
|---------|------|------|---------|
| `board-room` | 董事会 | 现代企业 | 商务、简洁、蓝灰色系 |
| `san-sheng` | 三省六部 | 隋唐中国 | 东方、典雅、朱红金色 |
| `pirate-council` | 海盗议会 | 大航海时代 | 冒险、自由、深蓝棕色 |
| `avengers` | 复仇者联盟 | 漫威宇宙 | 科幻、热血 |
| `hogwarts` | 霍格沃茨 | 魔法世界 | 魔幻、神秘、深紫色系 |
| `edo-shogun` | 江户幕府 | 日本战国 | 武士、纪律、黑红色系 |
| `silicon-valley` | 硅谷创业 | 科技圈 | 极简、现代、科技蓝 |

### 皮肤映射示例

| Abstract Role | 罗马 | 董事会 | 三省六部 | 海盗船 |
|--------------|------|--------|---------|--------|
| user | Caesar 凯撒 | Chairman 董事长 | 皇帝 | Pirate King 海贼王 |
| orchestrator | Consul 执政官 | CEO 首席执行官 | 中书令 | Captain 船长 |
| selector | Praetor 裁判官 | HR Director 人力总监 | 中书舍人 | Quartermaster 军需官 |
| panel | Senatus 元老院 | Board 董事会 | 门下省 | Pirate Council 海盗议会 |
| expert | Senator 元老 | Director 董事 | 给事中 | Senior Pirate 资深海盗 |
| worker | Legionary 军团兵 | Associate 执行专员 | 六部吏员 | Crew 船员 |
| archivist | Annalist 史官 | Secretary 秘书长 | 史馆修撰 | Navigator 航海日志官 |
| monitor | Curator 水道官 | CTO 技术总监 | 工部侍郎 | Boatswain 水手长 |
| scout | Explorator 探路者 | Market Analyst 市场分析 | 锦衣卫 | Lookout 瞭望手 |
| mercenary | Mercenarii 佣兵 | Contractor 外包商 | 客卿 | Privateer 私掠者 |
| configurator | Praefectus Fabrum 工程长 | IT Director IT 总监 | 将作监 | Shipwright 造船匠 |
| guard_team | Cohors 特勤队 | Task Force 特别小组 | 御林军 | Elite Crew 精锐船队 |

---

## 5. 技术实现

### 皮肤加载

```
系统启动 → 读取 config.yaml 中的 active_theme
         → 加载 themes/{theme-id}/theme.yaml
         → 所有 SOUL.md 模板中的变量替换为皮肤值
         → UI 应用皮肤的 style 配置
```

### SOUL.md 中的变量引用

当前的 SOUL.md 硬编码了罗马术语。抽象后改为变量：

```markdown
# 硬编码（当前）
你是 SPQA 元老院的一位 Senator（元老）

# 模板化（未来）
你是 {{panel.name}} 的一位 {{expert.name}}
```

引擎在加载 SOUL.md 时，根据当前皮肤做变量替换。

### 皮肤不影响的部分

以下核心逻辑与皮肤无关，不做变量化：

- 四阶段议制的编排逻辑
- 选人算法
- 军团兵 DAG 调度
- 验收流程
- 权限模型（required/optional、emergency_direct 等）
- 通讯路由规则

### 皮肤文件结构

```
themes/
├── spqa-roman/             ← 默认皮肤
│   ├── theme.yaml
│   ├── preview.png
│   └── assets/             ← 皮肤专属图标/图片
├── board-room/
│   ├── theme.yaml
│   ├── preview.png
│   └── assets/
└── san-sheng/
    └── ...
```

---

## 6. 商业模式

### 免费
- SPQA Roman（默认皮肤）
- 核心引擎（开源）
- 用户可自己创建皮肤

### 付费
- 官方精品皮肤（精心设计的命名体系 + UI + 专家池预设）
- 皮肤市场（社区创作者上传，平台抽成）
- 企业定制皮肤（为特定公司/行业定制，含品牌 CI 融入）

### 皮肤的价值在哪

不只是换个名字——好的皮肤包括：
1. **角色命名** — 贴合语境的名字让用户更容易理解和记忆
2. **专家池预设** — 不同皮肤预设不同领域的专家，适配不同行业
3. **术语体系** — 统一的用语让交互更沉浸
4. **UI 风格** — 视觉体验的差异化
5. **叙事认同** — 用户选择皮肤本身就是一种自我表达

---

## 7. 实现优先级

- **MVP**：先不做皮肤系统。硬编码罗马皮肤，跑通引擎。
- **V1**：提取 theme.yaml schema，SOUL.md 模板化，支持皮肤切换。
- **V2**：皮肤市场，社区创作工具，企业定制。
