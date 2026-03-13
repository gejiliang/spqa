---
name: "iter-legionum"
version: "1.0.0"
tags: ["legion", "execution", "dag"]
minOC: "2026.3.0"
provider: "spqa"
---

# Iter Legionum (军团兵编排) — 任务DAG编排与执行

## 目标
将Senatus Consultum中的Legionarii（任务列表）转化为一个**有向无环图(DAG)**，根据依赖关系并行执行任务，收集结果并验证交付物。

## 输入
- **senatus_consultum**: 来自Ordo Deliberandi的完整法令
  - 包含: legionarii (任务列表)、officia (权限/上下文)、norma (标准)、tempus (时间估计)
- **workspace**: Consul的工作目录，用于存储临时文件和结果

## 核心工作流

---

## 第1步：DAG构建 (DAG Construction)

### 解析Legionarii
```python
legionarii = senatus_consultum['legionarii']

# 构建任务节点和边
task_nodes = {}
edges = {}

for task in legionarii:
    task_id = task['task_id']
    task_nodes[task_id] = {
        'name': task['name'],
        'description': task['description'],
        'owner': task['owner'],
        'effort': task['estimated_effort']
    }

    # 解析依赖关系
    dependencies = task.get('depends_on', [])
    edges[task_id] = dependencies
```

### DAG拓扑排序与批处理
```python
def topological_sort(edges):
    """
    返回任务执行的批次列表。
    每个批次中的任务可以并行执行。
    """
    in_degree = {task: len(deps) for task, deps in edges.items()}
    queue = [task for task, degree in in_degree.items() if degree == 0]
    batches = []

    while queue:
        current_batch = queue.copy()
        batches.append(current_batch)
        queue.clear()

        for task in current_batch:
            for dependent_task, deps in edges.items():
                if task in deps:
                    in_degree[dependent_task] -= 1
                    if in_degree[dependent_task] == 0:
                        queue.append(dependent_task)

    return batches

batches = topological_sort(edges)
# 输出示例: [['task_001', 'task_002'], ['task_003'], ['task_004', 'task_005']]
```

### DAG分析
```yaml
dag_analysis:
  total_tasks: 12
  independent_tasks: 3  # depends_on为空的任务
  dependent_tasks: 9
  critical_path: ["task_001", "task_003", "task_007", "task_010"]
  critical_path_duration: "18 hours"
  max_parallelism: 3  # 最大可并行执行的任务数
  batch_count: 4
```

---

## 第2步：批量执行 (Batch Execution)

### 并发限制
- 最多**5个任务并发执行** (max_concurrent: 5)
- 每个批次等待所有任务完成后才进入下一批次
- 如果某批次中的任务少于5个，全部并发执行

### 提示词生成 (Prompt Generation)
对于每个任务，从以下部分组装执行提示词：

```python
for batch_index, batch in enumerate(batches):
    for task_id in batch:
        task = get_task(task_id)

        # 收集上游输出作为上下文
        upstream_results = {}
        for upstream_task_id in task['depends_on']:
            upstream_results[upstream_task_id] = results[upstream_task_id]

        # 获取权限和指示
        officia = find_officia(task_id, senatus_consultum['officia'])
        norma = find_norma(task_id, senatus_consultum['norma'])

        prompt = f"""
你正在执行SPQA军团法令中的一项任务。

## 任务信息
任务ID: {task['task_id']}
任务名称: {task['name']}
详细描述: {task['description']}
估算工作量: {task['estimated_effort']}

## 执行权限 (Officia)
权限: {officia['permissions']}
具体指示: {officia['instructions']}

## 交付标准 (Norma)
交付物要求:
{format_list(norma['deliverables'])}

验收标准:
{format_list(norma['acceptance_criteria'])}

## 上游输入 (Context From Dependencies)
{"上游任务没有输出" if not task['depends_on'] else ""}
{format_upstream_results(upstream_results)}

## 执行指示
1. 仔细阅读上述信息
2. 根据权限和指示执行任务
3. 完成所有列出的交付物
4. 确保符合验收标准
5. 返回结构化结果，格式如下：

```json
{{
  "task_id": "{task['task_id']}",
  "status": "success|failed",
  "deliverables": {{
    "delivery_1": "...",
    "delivery_2": "..."
  }},
  "summary": "任务执行的简明总结",
  "errors": "如有失败，列出错误信息"
}}
```
"""

        # Spawn任务执行
        result = sessions_spawn(
            prompt=prompt,
            agent="executor_id",
            cleanup="archive",
            mode="run"
        )

        results[task_id] = result
```

### 执行实例
```yaml
batch: 0
  tasks: ["task_001", "task_002"]
  max_concurrent: 2
  execution_timeline:
    - start: 2026-03-13 10:00:00
      end: 2026-03-13 11:30:00
      status: "complete"

batch: 1
  tasks: ["task_003"]
  depends_on: ["task_001"]
  execution_timeline:
    - start: 2026-03-13 11:30:00
      end: 2026-03-13 13:00:00
      status: "complete"
```

---

## 第3步：交付物验证 (Deliverable Validation)

### 验证架构
```python
def validate_deliverables(task_id, result, norma):
    """
    对照Norma标准验证交付物
    """
    required_deliverables = norma['deliverables']
    acceptance_criteria = norma['acceptance_criteria']

    validation_report = {
        'task_id': task_id,
        'status': 'pending',
        'checks': []
    }

    # 检查1：交付物完整性
    for requirement in required_deliverables:
        if requirement in result['deliverables']:
            validation_report['checks'].append({
                'check': f"deliverable:{requirement}",
                'status': 'pass'
            })
        else:
            validation_report['checks'].append({
                'check': f"deliverable:{requirement}",
                'status': 'fail',
                'reason': 'missing'
            })

    # 检查2：验收标准符合性
    for criterion in acceptance_criteria:
        # 通常需要人工或额外的自动化检查
        validation_report['checks'].append({
            'check': f"criterion:{criterion}",
            'status': 'pending_review'
        })

    # 综合判断
    all_deliverables_present = all(
        check['status'] != 'fail' for check in validation_report['checks']
    )

    if all_deliverables_present:
        validation_report['status'] = 'passed'
    else:
        validation_report['status'] = 'failed'

    return validation_report
```

### 验证结果处理
```python
validation_results = {}

for task_id, result in results.items():
    norma = find_norma(task_id, senatus_consultum['norma'])
    validation = validate_deliverables(task_id, result, norma)
    validation_results[task_id] = validation

    if validation['status'] == 'failed':
        # 标记为失败，准备重试或升级
        failed_tasks[task_id] = {
            'result': result,
            'validation': validation,
            'retry_count': 0
        }
```

---

## 第4步：失败处理与重试 (Failure Handling)

### 重试策略
```python
for task_id, failure_info in failed_tasks.items():
    if failure_info['retry_count'] < 1:
        # 第一次重试
        failure_info['retry_count'] += 1

        prompt = f"""
前一次执行失败。请重新执行任务 {task_id}。
失败原因: {failure_info['validation']['checks']}
上一次的输出: {failure_info['result']['summary']}

请:
1. 分析失败原因
2. 调整执行方法
3. 重新提交交付物
4. 确保满足所有验收标准
"""

        retry_result = sessions_spawn(
            prompt=prompt,
            agent="executor_id",
            cleanup="archive"
        )

        # 重新验证
        new_validation = validate_deliverables(task_id, retry_result, norma)

        if new_validation['status'] == 'passed':
            results[task_id] = retry_result
            del failed_tasks[task_id]
        else:
            failure_info['result'] = retry_result
            failure_info['validation'] = new_validation
    else:
        # 重试次数已满，升级到Consul
        escalate_to_consul(task_id, failure_info)
```

### 升级到Consul
```yaml
escalation_report:
  task_id: "task_xyz"
  reason: "Failed validation after 1 retry"
  validation_failures:
    - "missing deliverable: final_report"
    - "criterion not met: code_review_approved"

  options:
    - "retry_with_different_executor"
    - "manual_intervention"
    - "abort_task"
    - "modify_task_definition"

  recommended_action: "manual_intervention"
  consul_decision_required: true
```

---

## 第5步：结果收集与打包 (Result Collection & Packaging)

### 结果汇总
```python
execution_summary = {
    'session_id': session_id,
    'total_tasks': len(legionarii),
    'successful_tasks': len([t for t in validation_results if validation_results[t]['status'] == 'passed']),
    'failed_tasks': len(failed_tasks),
    'escalated_tasks': len(escalations),
    'execution_time': total_duration,
    'critical_path_actual': actual_critical_path_duration,
    'status': 'success' if not failed_tasks and not escalations else 'partial_success' if not escalations else 'requires_intervention'
}

final_package = {
    'session_id': session_id,
    'senatus_consultum_id': senatus_consultum['id'],
    'execution_summary': execution_summary,
    'task_results': results,
    'validation_results': validation_results,
    'escalations': escalations,
    'artifacts': {
        'dag_analysis': dag_analysis,
        'batch_execution_log': batch_logs,
        'archived_transcripts': [list of archive paths]
    }
}
```

### 工作文件保存
```yaml
# 保存至: consul/workspace/active/execution-meta.yaml
session_id: "{uuid}"
status: "complete|partial_success|failed"
execution_start: "2026-03-13T10:00:00Z"
execution_end: "2026-03-13T15:30:00Z"
duration: "5.5 hours"

tasks_executed: 12
tasks_passed: 11
tasks_failed: 1

critical_path: ["task_001", "task_003", "task_007"]
critical_path_duration: "4 hours 15 minutes"

escalations:
  - task_id: "task_012"
    reason: "Failed validation after retry"
    escalation_target: "consul"
    timestamp: "2026-03-13T15:00:00Z"
```

---

## 第6步：发送给Annalist (Handoff to Annalist)

### 完整交接
```python
sessions_send(
    recipient="annalist",
    payload={
        'source': 'iter-legionum',
        'session_id': session_id,
        'senatus_consultum_id': senatus_consultum['id'],
        'execution_summary': execution_summary,
        'final_package': final_package,
        'archived_transcripts': [all task execution transcripts],
        'metadata': {
            'task_count': len(legionarii),
            'success_rate': success_rate,
            'performance': {
                'estimated_duration': senatus_consultum['tempus']['total_duration'],
                'actual_duration': actual_duration,
                'efficiency': efficiency_ratio
            }
        }
    }
)
```

---

## 错误场景与恢复

### 场景1：某个关键路径任务失败
```
触发: task_id in critical_path AND validation failed after retry
处理:
  1. 立即停止等待该任务的所有下游任务
  2. 向Consul发送紧急升级报告
  3. 保留所有intermediate results用于恢复
  4. 等待Consul决策: retry / skip / abort / modify
```

### 场景2：并发数超限
```
触发: batch size > max_concurrent (5)
处理:
  1. 自动分割为多个sub-batches
  2. 按顺序执行sub-batches
  3. 在日志中记录并发限制导致的延迟
```

### 场景3：Annalist通信失败
```
触发: sessions_send fails
处理:
  1. 保存final_package到本地: consul/workspace/pending/[session_id].yaml
  2. 记录失败原因和时间戳
  3. 每5分钟重试一次，最多3次
  4. 若全部失败，升级给Consul
```

---

## 与Consul的接口
1. Consul调用 Iter Legionum，传入 senatus_consultum
2. Iter Legionum执行所有任务并返回 execution_summary
3. Consul检查 execution_summary.status:
   - "success": 流程完成，通知用户
   - "partial_success": 标记已完成部分，报告未完成部分
   - "requires_intervention": 等待Consul的决策指令
