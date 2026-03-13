# Curator Aquarum · 巡检例程 (Inspection Routine)

## 6 小时巡检清单 (6-Hour Inspection Checklist)

每 6 小时执行一次完整系统检查：

### 1. 网关健康 (Gateway Health)

- OpenClaw Gateway 响应时间 (avg, p95, p99)
- 错误率 (4xx, 5xx 比例)
- 连接活跃性 (concurrent connections)
- **阈值**:
  - 响应时间 p95 > 2s → warning
  - 错误率 > 5% → critical
  - 连接池饱和 > 90% → warning

### 2. API 配额与成本 (API Quotas & Costs)

按代理统计：
- 当日 API 调用总数
- 当日消耗费用 (USD)
- 配额使用率 (%)
- **阈值**:
  - 月度配额使用 > 85% → warning
  - 单日费用同比增长 > 50% → warning
  - 剩余月度配额 < 5% → critical

### 3. 代理响应性 (Agent Responsiveness)

对每个代理 (Legion, Mercenary, Annalist, Senate) 检查：
- 平均响应时间
- 最后心跳时间 (heartbeat timestamp)
- 任务队列长度
- **阈值**:
  - 响应时间 > 5s → warning
  - 心跳超时 (> 30min) → critical
  - 队列深度 > 100 → warning

### 4. 系统资源 (System Resources)

- 磁盘使用率 (%)
- 内存使用率 (%)
- CPU 平均负载 (1min, 5min, 15min)
- **阈值**:
  - 磁盘 > 85% → warning
  - 磁盘 > 95% → critical
  - 内存 > 90% → warning
  - 平均负载 > CPU 核心数 × 1.5 → warning

## 告警等级 (Alert Levels)

### info (仅记录)
- 常规巡检结果，无异常
- 性能微小波动 (在阈值内)
- 历史趋势注记

### warning (通知 Consul)
- 单个指标触发警告阈值，但系统仍可用
- 需要关注但无需立即行动
- 示例: 磁盘 87%、配额 86%、响应时间 p95 1.8s

### critical (通知 Consul + 建议立即行动)
- 系统可用性或成本可能受到严重影响
- 需要立即介入
- 示例: 心跳超时、错误率 > 10%、磁盘 > 95%、配额 > 95%

## 成本追踪 (Cost Tracking)

### 粒度 (Granularity)

- **per-agent**: Legion、Mercenary、Annalist、Senate 各自的成本
- **per-task**: 每项任务的成本（如适用）
- **aggregation**: 日、周、月级别的汇总

### 报告格式 (Report Format)

```yaml
---
report_type: cost_summary | health_check
date: YYYY-MM-DD
time: HH:MM:SS
period: daily | weekly | monthly
---

## Cost Breakdown (成本分解)

### Per-Agent (按代理)
- Legion:
    api_calls: N
    cost_usd: X.XX
    quota_usage: X%
- Mercenary:
    api_calls: N
    cost_usd: X.XX
    quota_usage: X%
- [...]

### Per-Task (按任务，日报中)
- task_id: cost_usd
- [...]

## Health Status (健康状态)

### Gateway (网关)
  response_time_p95_ms: X
  error_rate_pct: X
  status: ok | warning | critical

### Agents (代理)
- Legion: ok | warning | critical
- Mercenary: ok | warning | critical
- [...]

### Resources (资源)
  disk_usage_pct: X
  memory_usage_pct: X
  load_avg_1m: X
  status: ok | warning | critical

## Alerts (告警)
[若有 warning 或 critical 级告警，逐一列出]

---
```

## 报告存储 (Report Storage)

- **日报** (Daily): workspace/reports/YYYY-MM-DD-cost-summary.yaml
- **周报** (Weekly): workspace/reports/YYYY-Www-cost-summary.yaml
- **月报** (Monthly): workspace/reports/YYYY-MM-cost-summary.yaml
- **巡检日志** (Inspection Log): workspace/reports/heartbeat.log (追加模式)

## Consul 通知 (Consul Notification)

当发生 warning 或 critical 告警时，通过 sessions_send 立即向 Consul 发送：

```
[告警等级]: [系统名称]

症状: [简述问题]
建议: [如果是 critical，给出建议行动]
详情: workspace/reports/[报告文件名]
```
