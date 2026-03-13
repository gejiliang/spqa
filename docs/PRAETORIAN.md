# Praetorian Guard · 禁卫军模板化设计

> 特勤队的创建、管理和生命周期

---

## 1. 概述

禁卫军（Praetorian Guard）是凯撒直属的持久化项目组体系。每支特勤队（Cohors Specialis）是一个独立运转的长期团队，凯撒直接指挥，不经执政官和元老院。

---

## 2. 创建路径

### 路径 A：对话式创建（通过执政官）

凯撒对执政官说"我要组建一个 XX 团队"，执政官通过几轮提问完成配置：

```
执政官：了解，我来帮你组建特勤队。几个问题：

1. 这支队伍的核心任务是什么？
   → 凯撒回答

2. 需要哪些角色？我这里有标准骨架供参考：
   🧠 谋略官（策略方向）
   🛡️ 守卫官（风控边界）
   ⚡ 执行官（核心任务）
   📊 记录官（数据追踪）
   你可以用这些、增减、或完全自定义。
   → 凯撒回答

3. 队伍编号？我建议 CS-{下一个希腊字母}，或你自己取名。
   → 凯撒回答

4. 队内指挥模式？
   a) 指定一个指挥官（适合 4+ 人队伍）
   b) 扁平化，全员向你直接汇报（适合 2-3 人队伍）
   → 凯撒回答

好的，我来生成配置，确认后就启动。
```

执政官生成完整的 cohort 配置 → 凯撒确认 → 实例化全员。

### 路径 B：Dashboard 手动创建

用户在管理界面上直接操作：

1. 点击「组建特勤队」
2. 填写基本信息（名称、编号、任务描述）
3. 从标准角色骨架中选择角色 / 添加自定义角色
4. 为每个角色配置工具权限
5. 选择指挥模式（指挥官制 / 扁平化）
6. 确认并启动

Dashboard 本质是可视化的 cohort-meta.yaml 编辑器。

---

## 3. 特勤队 Schema

```yaml
# cohort-meta.yaml · 特勤队元数据

# === 身份 ===
id: cs-alpha                    # 唯一标识
code: CS-α                      # 编号（显示用）
name: Cohors Specialis Alpha    # 全名
name_custom: null               # 凯撒自定义名称（可选）
description: 一句话描述这支队伍的核心任务

# === 状态 ===
status: active                  # active | paused | disbanded
created_at: 2026-03-13
created_by: caesar              # caesar | consul

# === 指挥模式 ===
command_mode: hierarchical      # hierarchical(指挥官制) | flat(扁平化)
commander: strategus            # command_mode=hierarchical 时，指定谁是指挥官

# === 成员 ===
members:
  - id: strategus
    role_latin: Strategus
    role_zh: 谋略官
    description: 策略制定 · 方向把控
    is_commander: true           # 是否为指挥官
    tools:
      - file_read_write
      - web_search
      - notification
    soul_file: ./members/strategus.md

  - id: custos
    role_latin: Custos
    role_zh: 守卫官
    description: 风控管理 · 边界守护
    is_commander: false
    tools:
      - file_read_write
      - notification
    soul_file: ./members/custos.md

  - id: executor
    role_latin: Executor
    role_zh: 执行官
    description: 核心任务执行
    is_commander: false
    tools:
      - file_read_write
      - api_call
    soul_file: ./members/executor.md

  - id: tabularius
    role_latin: Tabularius
    role_zh: 记录官
    description: 数据维护 · 状态追踪
    is_commander: false
    tools:
      - file_read_write
      - spreadsheet
    soul_file: ./members/tabularius.md

# === 通讯规则 ===
comms:
  internal: true                 # 队内成员可以横向通讯
  report_to: caesar              # 对外汇报给谁
  report_frequency: daily        # 汇报频率：daily | weekly | on_milestone
  archive_to: annalist           # 成果归档给史官
  archive_frequency: weekly      # 归档频率

# === 条令 ===
rules:
  - 全员持久化，项目存续期内 7×24 运行
  - 凯撒直接指挥，不经执政官和元老院
  - 成果定期由史官归档
```

---

## 4. 指挥模式详解

### 指挥官制（Hierarchical）

适合 4+ 人队伍。指定一名成员为指挥官（通常是谋略官）。

```
        Caesar · 凯撒
             │
        Strategus · 指挥官
         ┌───┼───┐
      Custos  Executor  Tabularius
```

- 凯撒只和指挥官对话
- 指挥官协调队内任务分配
- 其他成员向指挥官汇报，指挥官汇总后向凯撒汇报
- 紧急情况（守卫官的风控预警）可绕过指挥官直达凯撒

### 扁平化（Flat）

适合 2-3 人小队伍。

```
        Caesar · 凯撒
         ┌───┼───┐
      Member  Member  Member
```

- 凯撒直接和每个成员对话
- 成员之间可横向通讯
- 不设指挥官，减少层级开销

---

## 5. 队内通讯

特勤队和元老院的关键区别：元老院是短期讨论（互相不可见→阶段性可见），特勤队是长期协作（随时可横向通讯）。

### 通讯规则

| 方向 | 规则 |
|------|------|
| 队内横向 | 自由通讯，无需审批 |
| 向上（→凯撒） | 指挥官制：通过指挥官；扁平化：直接 |
| 向外（→其他角色） | 不允许直接联系元老院或综合办公室，需通过凯撒或执政官中转 |
| 归档（→史官） | 按设定频率自动推送，不需要手动触发 |

---

## 6. 特勤队生命周期

### 组建（Constitutio）
```
凯撒指令（对话或 Dashboard）
  → 生成 cohort-meta.yaml + 各成员 SOUL.md
  → 创建目录 cohorts/{cohort-id}/
  → 实例化全员 Agent
  → 队伍开始运转
```

### 运转（Operatio）
- 按 report_frequency 向凯撒汇报
- 按 archive_frequency 向史官归档
- 凯撒可随时：
  - 增减成员
  - 调整工具权限
  - 修改指挥模式
  - 暂停队伍

### 暂停（Quies）
```
凯撒指令 → 所有成员停止 triggers → 保留配置和数据 → 随时可恢复
```

暂停期间不产生 API 成本。配置和历史数据完整保留。

### 解散（Dissolutio）
```
凯撒指令
  → 所有成员产出最终归档 → 交史官
  → 销毁全员 Agent 实例
  → cohort-meta.yaml 标记 status: disbanded
  → 配置保留（可用于未来重建类似队伍的参考）
```

---

## 7. 标准角色骨架

以下四个角色是 SPQA 预设的参考模板。凯撒可以全用、部分用、或完全不用。

| 角色 | 拉丁名 | 定位 | 适用场景 |
|------|--------|------|---------|
| 🧠 谋略官 | Strategus | 策略制定 · 方向把控 | 需要持续策略调整的业务 |
| 🛡️ 守卫官 | Custos | 风控管理 · 边界守护 | 有风险管控需求的业务 |
| ⚡ 执行官 | Executor | 核心任务执行 | 所有业务都需要 |
| 📊 记录官 | Tabularius | 数据维护 · 状态追踪 | 需要数据追踪的业务 |

凯撒也可以创建完全自定义的角色，只需提供：角色名、职能描述、工具需求。执政官/Dashboard 会生成对应的 SOUL.md。

---

## 8. 目录结构

```
cohorts/
├── _template/                  # 空白模板
│   ├── cohort-meta.yaml
│   └── members/
│       └── _member-template.md
├── cs-alpha/                   # 示例特勤队
│   ├── cohort-meta.yaml
│   └── members/
│       ├── strategus.md
│       ├── custos.md
│       ├── executor.md
│       └── tabularius.md
└── cs-beta/
    ├── cohort-meta.yaml
    └── members/
        └── ...
```
