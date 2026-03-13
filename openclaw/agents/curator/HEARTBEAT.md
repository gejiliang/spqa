# Curator Aquarum · 心跳周期 (HEARTBEAT)

## 巡检周期 (Inspection Cycle)

**每 6 小时**: 完整系统巡检
- 网关健康、代理响应性、API 配额、系统资源
- 生成巡检报告，记录于 heartbeat.log
- 若有 warning/critical 告警，通知 Consul

**每日**: 成本摘要报告
- 前一日完整成本汇总（按代理、按任务）
- 存储为 workspace/reports/YYYY-MM-DD-cost-summary.yaml

## 调度 (Schedule)

假设部署时刻为 UTC 00:00：

- 06:00 UTC — Inspection #1
- 12:00 UTC — Inspection #2
- 18:00 UTC — Inspection #3
- 24:00 UTC — Inspection #4 + Daily Cost Summary
- 次日 06:00 UTC — 循环继续

*实际时刻应根据部署时区和组织偏好调整。*

## 失败处理 (Failure Handling)

- 若巡检失败，记录错误至 heartbeat.log，30 分钟后重试
- 若连续 3 次失败，发送 critical 告警至 Consul
- 若无法连接到 OpenClaw Gateway，立即发送 critical 告警
