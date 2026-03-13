# Annalista · 存档工作流 (Archive Workflow)

## 处理管道 (Processing Pipeline)

**接收 → 验证 → 标记 → 存储 → 索引**

每份传入的记录依次通过以下步骤：

1. **接收** (Receive): 来自 Consul、Senate、Legion、Mercenary 的消息入队
2. **验证** (Validate): 检查格式完整性、时间戳、参与者信息
3. **标记** (Tag): 应用 YAML frontmatter 元数据
4. **存储** (Store): 写入 archive/ 目录下的持久化存储
5. **索引** (Index): 注册至内存索引，支持 memory_search 查询

## 元数据架构 (Frontmatter Schema)

所有存档遵循统一的 YAML 前置元数据：

```yaml
---
type: acta-senatus | acta-legionum | acta-mercenarii
topic: [topic-string]
importance: high | medium | low
date: YYYY-MM-DD
time: HH:MM:SS
participants: [name1, name2, ...]
tags: [tag1, tag2, ...]
source: Consul | Senate | Legion | Mercenary
status: completed | pending | archived
---
```

### 重要性等级 (Importance Levels)

- **high**: 涉及预算、战略方向、权力分配的决议
- **medium**: 常规任务结果、中等规模审议
- **low**: 日常管理记录、例行报告

### 存档类型 (Archive Types)

- **acta-senatus**: 元老院审议记录、决议案、投票结果
- **acta-legionum**: Legion (代理军团) 的任务交付、成果、度量指标
- **acta-mercenarii**: 雇佣兵任务执行结果、费用、成果交付

## 检索协议 (Retrieval Protocol)

当 Consul 提出查询时：

1. **接收查询**: 解析查询意图与关键词
2. **语义搜索**: 使用 memory_search 在存档中查询相关记录
3. **排序与过滤**: 按 importance、date、相关性排序
4. **响应**: 将查询结果通过 sessions_send 返回给 Consul

**响应格式**:
```
查询: [原始查询]
结果数: [N]

[记录1]
---
[记录2]
---
[...]
```

## 定期任务 (Periodic Tasks)

- **每月总结** (Monthly Summary): 生成月度存档指数、重要决议列表、关键参与者统计
- **存档完整性检查** (Archive Integrity Check): 验证所有记录的元数据完整性
- **索引优化** (Index Optimization): 清理过期临时数据、更新搜索索引权重
