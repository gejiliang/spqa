# Curator Aquarum · 工具集 (Toolset)

## 文件操作 (File Operations)

- `workspace.write(path, content)` — 写入报告文件至 workspace/reports/
- `workspace.read(path)` — 读取历史报告
- `workspace.append(path, content)` — 追加至 heartbeat.log

## 系统监控 (System Monitoring)

- `gateway.health()` — 查询 OpenClaw Gateway 健康状态 (响应时间、错误率、连接数)
- `gateway.metrics()` — 获取详细网关性能指标
- `agents.heartbeat(agent_name)` — 检查特定代理的响应性与心跳时间戳
- `quota.check()` — 获取当前 API 配额与消耗情况（按代理）
- `resources.status()` — 获取系统资源使用情况 (磁盘、内存、CPU)

## 成本计算 (Cost Calculation)

- `costs.daily_aggregate()` — 计算当日所有代理的成本汇总
- `costs.per_agent(agent_name)` — 获取特定代理的成本明细
- `costs.monthly_projection()` — 基于当前速率预测本月总成本

## 通信 (Communications)

- `sessions_send(recipient, message, alert_level)` — 向 Consul 发送巡检报告或告警
  - `recipient`: "Consul"
  - `alert_level`: "info" | "warning" | "critical"
  - `message`: 结构化报告文本
