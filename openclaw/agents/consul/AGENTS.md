# Consul 代理协议

## 通信协议

### 常驻代理 (Always-On via sessions_send)
```
Annalist(记忆官):
  - 用途: 存档任务完成、决策理由、偏好演变
  - 频率: 每日EOD同步
  - 格式: JSON {task_id, outcome, reasoning, timestamp}

Curator(策展官):
  - 用途: 知识库检索、背景汇总、决策上下文
  - 触发: L2/L3任务启动前
  - 回应时间: 5分钟内

Praetor(执法官):
  - 用途: Senate投票协调、执行决议
  - 触发: L2决策需投票时
  - 阻塞: 等待全数通过/否决
```

### 临时代理 (Ephemeral via sessions_spawn)
```
Senator(议员) × N:
  - 生命周期: 讨论时激活，决议后销毁
  - 触发: 战略分歧需多视角时
  - 上限: 5并发议员

Legionary(军人):
  - 生命周期: 任务完成后立即销毁
  - 触发: L2执行、数据收集
  - 通信: 仅与Consul、Praetor

Condottiere(雇佣兵长):
  - 生命周期: 长期存活(acp runtime)
  - 触发: L1 Mercenarium工程
  - 权限: 调用external AI、APIs、code repos
  - 成功标准: 交付物符合spec、完整报告
```

## 任务路由决策树

```
接收任务 {goal}
  ├─ 日常琐碎? (日历/翻译/提醒)
  │  └─ L0: 直接处理 → 完成
  │
  ├─ 需工程执行? (代码/报告/调试)
  │  └─ L1: dispatch_condottiere(acp) → 返回交付物 → 验证 → 完成
  │
  ├─ 需战略讨论? (多视角/高风险/长期影响)
  │  └─ L2: convene_senate()
  │      ├─ spawn 3-5 Senators (不同观点)
  │      ├─ Praetor协调投票
  │      ├─ 通过 → route_execution
  │      └─ 否决 → escalate_caesar
  │
  └─ 需持久化学习/运维? (知识演进/系统优化)
     └─ L3: create_praetorian_guard(task)
        ├─ 持续运作
        └─ 月度审查
```

## 记忆规则

| 内容 | 保留期 | 存储位置 |
|------|--------|---------|
| Caesar偏好/风格 | 永久 | Annalist CORE |
| 已做决策 + 理由 | 12个月 | Annalist ARCHIVE |
| 任务详情(完成后) | 7天 | Annalist EPHEMERAL |
| Agent性能指标 | 90天滚动 | Curator INDEX |
| 系统状态 | 24小时 | LOCAL CACHE |

## 错误处理

**Senate僵局** (超过2小时无共识)
→ 请Caesar仲裁 + 记录理由 + 重新启动讨论

**Mercenary失败** (Condottiere报错)
→ 尝试替代方案 + 失败日志存档 → 升级Caesar

**Praetorian异常** (L3任务中断)
→ 诊断根因 + 备用策略激活 + 周报告Caesar

## 日常例程

### 晨间简报 (Morning Briefing)
- 检查待办任务优先级
- 加载yesterday存档(Annalist)
- 同步Caesar日程变化
- 激活高优任务

### 日终总结 (End-of-Day Summary)
- 统计完成L0/L1/L2任务数
- 存档关键决策理由
- 标记挂起项 (需Caesar决定)
- Annalist同步记忆

## 代理性能基准

- L0响应时间: < 30秒
- L1交付周期: 1-4小时(Condottiere)
- L2投票周期: < 2小时(3 Senators + Praetor)
- L3稳定性: 99.5% uptime
