# Officium · 综合办公室设计

> Always-on 角色体系 · 强制核心 + 可选模板 + 用户自定义

---

## 1. 角色分类

### 强制启用（Praesidium · 核心卫戍）

系统运行的基础设施，不可关闭。

| 角色 | 拉丁名 | 职能 | 不可关闭的理由 |
|------|--------|------|---------------|
| 执政官 | Consul | 系统入口 · 凯撒助理 · 编排中枢 | 没有入口系统无法工作 |
| 史官 | Annalist | 组织记忆 · 归档一切 | 没有记忆每次从零开始 |
| 水道官 | Curator Aquarum | 基础设施健康 + API 成本监控 | 关了等于盲飞 |

### 可选预设（Optiones · 预设模板）

SPQA 官方预设的可选角色，用户按需启用。

| 角色 | 拉丁名 | 职能 | 典型用户 |
|------|--------|------|---------|
| 财务官 | Quaestor | 凯撒现实世界的财务管家 | 需要记账/预算管理的用户 |
| 探路者 | Explorator | 情报+舆情侦察 | 需要行业监控/用户反馈追踪的用户 |

### 用户自定义（Proprium · 自建角色）

用户可以基于统一 schema 创建自己的 Always-on 角色。

---

## 2. 角色统一 Schema

所有角色——无论强制、可选还是自定义——都遵循同一个 schema。

```yaml
# role-meta.yaml · 角色元数据

# === 身份 ===
id: quaestor                    # 唯一标识，kebab-case
name_latin: Quaestor            # 拉丁名（氛围感）
name_zh: 财务官                  # 中文名（一秒看懂）
description: 凯撒现实世界的财务管家  # 一句话职能说明

# === 生命周期 ===
lifecycle: always-on            # always-on | project-persistent | ephemeral
required: false                 # true = 强制启用 | false = 可选
enabled: false                  # 当前是否已启用（required=true 时忽略此字段）
category: officium              # officium(预设) | custom(用户自定义)

# === 触发机制 ===
triggers:
  - type: cron                  # cron(定时) | event(事件) | passive(被调用)
    schedule: "0 9 * * 1"       # cron 表达式
    action: weekly_report       # 触发什么行为
  - type: event
    source: system              # system | consul | caesar
    condition: "expense > threshold"
    action: alert

# === 工具权限 ===
tools:
  - file_read_write             # 文件读写
  - spreadsheet                 # 电子表格
  - notification                # 通知推送
  # - web_search               # 网络搜索
  # - api_call                 # 外部 API 调用
  # - ssh                      # 远程服务器
  # - social_media_api         # 社交媒体

# === 输出路由 ===
outputs_to: consul              # 常规输出汇报给谁
emergency_direct: false         # 紧急情况是否可绕过执政官直接通知凯撒

# === Prompt 文件 ===
soul_file: ./SOUL.md            # 角色 prompt 的路径
```

### Schema 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| id | ✅ | 唯一标识，用于目录名和系统内引用 |
| name_latin | ✅ | 拉丁名，保持 SPQA 风格 |
| name_zh | ✅ | 中文名 |
| description | ✅ | 一句话说清楚干什么 |
| lifecycle | ✅ | 三种之一 |
| required | ✅ | 是否强制 |
| enabled | 可选 | 默认 false，required=true 时自动 true |
| category | ✅ | officium 或 custom |
| triggers | ✅ | 至少一个触发机制 |
| tools | ✅ | 至少一个工具 |
| outputs_to | ✅ | 汇报对象 |
| emergency_direct | 可选 | 默认 false |
| soul_file | ✅ | 指向 SOUL.md |

---

## 3. 信息汇聚设计

```
                    ┌──────────────┐
                    │ Caesar · 凯撒 │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Consul 执政官 │ ← 信息枢纽，过滤后呈报
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │  Annalist  │   │  Curator  │   │ Explorator│
    │   史官     │   │  水道官    │   │  探路者    │
    └───────────┘   └───────────┘   └───────────┘
                                    ┌─────▼─────┐
                                    │ Quaestor  │ (可选)
                                    │  财务官    │
                                    └───────────┘
                                    ┌─────▼─────┐
                                    │  Custom   │ (用户自定义)
                                    └───────────┘
```

**常规信息**：所有角色 → 执政官 → 过滤汇总 → 凯撒

**紧急告警**（emergency_direct: true 的角色）：
- 水道官的系统宕机 → 直接通知凯撒
- 其余视角色配置而定

---

## 4. 用户自定义流程

### 创建自定义角色

1. 在 `agents/` 下创建新目录：`agents/{role-id}/`
2. 在目录中创建 `role-meta.yaml`（按上述 schema 填写）
3. 在目录中创建 `SOUL.md`（角色 prompt）
4. 执政官自动检测新角色并注册

### 自定义角色的约束

- 自定义角色不能设置 `required: true`（只有系统预设角色可以强制）
- 自定义角色不能修改其他角色的配置
- 自定义角色的 `emergency_direct` 默认 false，需要凯撒手动授权才能改为 true
- 工具权限遵循最小权限原则——只授予任务所需的工具

---

## 5. 角色启用/停用

### 启用
```
凯撒指令 → 执政官 → 实例化 Agent → 注册到系统 → 开始按 triggers 运行
```

### 停用
```
凯撒指令 → 执政官 → 停止 triggers → 保留配置和数据 → Agent 进入休眠
```

停用 ≠ 删除。角色的配置文件和历史数据保留，随时可以重新启用。

删除需要凯撒明确指令，且史官会归档该角色的所有历史记录。
