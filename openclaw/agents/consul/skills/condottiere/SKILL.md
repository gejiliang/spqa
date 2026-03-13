---
name: "condottiere"
version: "1.0.0"
tags: ["mercenary", "acp", "outsource"]
minOC: "2026.3.0"
provider: "spqa"
---

# Condottiere (佣兵队长) — 外包执行与ACP调度

## 目标
当Senatus Consultum中的任务需要由外部AI工具（佣兵/Mercenary）完成时，Condottiere负责：
1. 将Consul的意图转化为清晰、结构化的执行提示词
2. 从ACP（AI Capability Provider）注册表中选择合适的代理
3. 调度并监控佣兵执行
4. 验证交付物
5. 记录成本
6. 处理失败与重试

## 输入
- **task_definition**: 来自Senatus Consultum的单个任务定义
  - task_id, name, description, owner, depends_on, estimated_effort
- **officia**: 权限与上下文信息
- **norma**: 交付标准与验收标准
- **upstream_context**: 上游任务的输出结果
- **config**: spqa/config.yaml中的配置信息

---

## 第1步：任务打包 (Task Packaging)

### 提示词结构化
```python
def package_task_for_acp(task_def, officia, norma, upstream_context):
    """
    将Consul的任务转化为清晰、自洽的ACP执行提示
    """

    prompt = f"""
你被派遣执行一项SPQA法令中的任务。你是一名受信任的佣兵 (Mercenary)，
必须严格按照指示完成工作。

## 任务概要 (Task Summary)
任务ID: {task_def['task_id']}
任务名称: {task_def['name']}
预计工作量: {task_def['estimated_effort']}

## 任务描述 (Description)
{task_def['description']}

## 授予的权限 (Granted Permissions)
以下权限已批准使用:
{format_list(officia['permissions'])}

## 执行指示 (Execution Instructions)
{officia['instructions']}

## 交付物规格 (Deliverables Specification)
你必须生成以下交付物:
{format_list(norma['deliverables'])}

## 验收标准 (Acceptance Criteria)
你的工作将根据以下标准进行评估:
{format_list(norma['acceptance_criteria'])}

## 上游输入 (Upstream Context)
{"无上游依赖" if not upstream_context else ""}
{format_upstream_context(upstream_context)}

## 成本预算 (Cost Budget)
你有权使用最多 ${task_def.get('cost_limit', 'unlimited')} 的资源用于完成此任务。
如果你需要超过此预算，必须在开始前请求批准。

## 执行约束 (Execution Constraints)
- 严禁访问未授权的资源或系统
- 所有API调用必须通过官方渠道
- 任何敏感数据必须加密存储
- 不允许持久化存储超过会话期限的数据
- 所有交付物必须附带验证证书

## 输出格式 (Output Format)
在完成工作后，你必须返回以下JSON结构:

```json
{{
  "task_id": "{task_def['task_id']}",
  "status": "success|failed",
  "deliverables": {{
    "deliverable_1_name": "deliverable_1_content",
    "deliverable_2_name": "deliverable_2_content"
  }},
  "execution_summary": "你的执行过程和结果的简明总结",
  "cost_incurred": {{
    "api_calls": 125,
    "compute_units": 450,
    "total_usd": 12.50,
    "breakdown": {{
      "service_1": 5.00,
      "service_2": 7.50
    }}
  }},
  "warnings": ["any warnings or notes"],
  "errors": []
}}
```

开始执行任务。记住，你是SPQA体系中值得信赖的一员。
"""

    return prompt
```

### 任务包关键元素
- **清晰的权限界限**: 明确说明允许和禁止的操作
- **上游上下文**: 以结构化格式提供依赖任务的输出
- **成本预算**: 明确成本限制
- **验证证书**: 要求佣兵在返回结果时同时返回验证信息
- **安全约束**: 强调数据安全和权限隔离

---

## 第2步：代理选择 (Agent Selection)

### ACP注册表查询
```python
def select_acp_agent(task_def, acp_registry):
    """
    从ACP注册表中选择最合适的代理
    """

    # 读取config.yaml中的ACP配置
    acp_config = load_config('spqa/config.yaml')['acp_registry']

    # 当前MVP: 仅支持claude-code
    available_agents = [
        {
            'name': 'claude-code',
            'capabilities': [
                'code_execution',
                'file_manipulation',
                'api_integration',
                'data_processing'
            ],
            'cost_per_call': 0.05,
            'reliability': 0.99,
            'latency': 'medium'
        }
        # 未来扩展: 添加更多agent
        # {
        #     'name': 'openai-gpt4',
        #     'capabilities': [...],
        #     'cost_per_call': 0.03,
        #     ...
        # }
    ]

    # 根据task的能力需求选择
    required_capabilities = infer_capabilities(task_def)

    for agent in available_agents:
        if all(cap in agent['capabilities'] for cap in required_capabilities):
            return agent

    # 如果没有完美匹配，选择最通用的
    return available_agents[0]  # claude-code as fallback
```

### Agent配置示例
```yaml
acp_agents:
  claude-code:
    agent_id: "claude-code"
    runtime: "acp"
    base_url: "https://acp.anthropic.com/agents/claude-code"
    api_key: "${ACP_API_KEY}"  # 从环境变量读取
    model: "claude-3-5-sonnet"
    max_tokens: 16000
    timeout: 300  # 5分钟
    retry_policy:
      max_attempts: 2
      backoff_multiplier: 2

cost_model:
  claude-code:
    per_call: 0.05
    per_token: 0.000003
    minimum_charge: 0.01

cost_limits:
  per_task: 50.00  # 单个任务的最大成本
  per_session: 500.00  # 单个会话的最大成本
  per_day: 5000.00  # 每日最大成本
```

---

## 第3步：ACP调度与执行 (ACP Dispatch)

### 调度请求
```python
def dispatch_to_acp(agent, task_package, task_def):
    """
    将打包的任务发送给ACP代理执行
    """

    dispatch_request = {
        'session_id': generate_session_id(),
        'task_id': task_def['task_id'],
        'agent': agent['name'],
        'runtime': 'acp',
        'prompt': task_package,
        'execution_mode': 'run',
        'cleanup': 'archive',  # 保存执行记录供Annalist
        'constraints': {
            'timeout': agent['timeout'],
            'max_retries': 2,
            'cost_limit': task_def.get('cost_limit', get_default_cost_limit())
        },
        'metadata': {
            'origin': 'condottiere',
            'consul_session_id': current_session_id,
            'task_name': task_def['name'],
            'created_at': timestamp()
        }
    }

    # 调用ACP
    result = sessions_spawn(
        runtime="acp",
        agent=agent['name'],
        prompt=task_package,
        cleanup="archive",
        mode="run",
        constraints=dispatch_request['constraints'],
        metadata=dispatch_request['metadata']
    )

    return result
```

### 执行流程
```yaml
dispatch_timeline:
  1_submit:
    action: "Submit task to ACP"
    timestamp: "2026-03-13T10:00:00Z"
    agent: "claude-code"
    cost_estimate: "0.05"

  2_queued:
    action: "Task queued in ACP"
    timestamp: "2026-03-13T10:00:05Z"
    queue_position: 3
    estimated_wait: "2 minutes"

  3_executing:
    action: "Agent started execution"
    timestamp: "2026-03-13T10:02:10Z"
    agent_instance: "claude-code-node-42"

  4_complete:
    action: "Agent completed execution"
    timestamp: "2026-03-13T10:15:30Z"
    actual_cost: "0.032"
    status: "success"
```

---

## 第4步：结果验证 (Result Verification)

### 交付物检查
```python
def verify_acp_result(result, norma):
    """
    验证ACP返回的结果是否满足Norma标准
    """

    verification_report = {
        'task_id': result['task_id'],
        'acp_status': result['status'],
        'checks': [],
        'verified': True
    }

    # 检查1: ACP执行状态
    if result['status'] != 'success':
        verification_report['verified'] = False
        verification_report['checks'].append({
            'check': 'execution_status',
            'status': 'fail',
            'reason': f"ACP returned status: {result['status']}"
        })
        return verification_report

    # 检查2: 交付物完整性
    for required_deliverable in norma['deliverables']:
        if required_deliverable in result['deliverables']:
            verification_report['checks'].append({
                'check': f"deliverable:{required_deliverable}",
                'status': 'pass'
            })
        else:
            verification_report['checks'].append({
                'check': f"deliverable:{required_deliverable}",
                'status': 'fail',
                'reason': 'missing'
            })
            verification_report['verified'] = False

    # 检查3: 成本验证
    if 'cost_incurred' in result:
        declared_cost = result['cost_incurred']['total_usd']
        cost_limit = get_cost_limit(result['task_id'])

        if declared_cost <= cost_limit:
            verification_report['checks'].append({
                'check': 'cost_within_limit',
                'status': 'pass',
                'declared': declared_cost,
                'limit': cost_limit
            })
        else:
            verification_report['checks'].append({
                'check': 'cost_within_limit',
                'status': 'fail',
                'declared': declared_cost,
                'limit': cost_limit
            })
            verification_report['verified'] = False

    # 检查4: 验证证书（如果有）
    if 'verification_certificate' in result:
        verification_report['checks'].append({
            'check': 'verification_certificate',
            'status': 'pass',
            'certificate': result['verification_certificate']
        })

    return verification_report
```

### 验证结果处理
```python
verification = verify_acp_result(acp_result, norma)

if verification['verified']:
    # 验证通过，结果可用
    task_result = {
        'status': 'success',
        'deliverables': acp_result['deliverables'],
        'cost': acp_result['cost_incurred']['total_usd'],
        'verification': verification
    }
else:
    # 验证失败，准备重试或升级
    task_result = {
        'status': 'failed',
        'reason': 'verification_failed',
        'verification': verification,
        'acp_output': acp_result
    }
```

---

## 第5步：成本记录 (Cost Recording)

### 成本日志格式
```yaml
# 保存至: consul/workspace/mercenarii/task-{date}-{id}.yaml
session_id: "consul-session-uuid"
task_id: "task_003"
task_name: "Build deployment pipeline"

dispatch_info:
  agent: "claude-code"
  dispatch_time: "2026-03-13T10:00:00Z"
  completion_time: "2026-03-13T10:15:30Z"
  execution_duration: "15 minutes 30 seconds"

cost_breakdown:
  api_calls: 45
  compute_units: 320
  service_charges:
    anthropic_claude_code: 0.032
  subtotal_usd: 0.032
  tax_percentage: 0
  total_usd: 0.032

cost_limits:
  per_task_limit: 50.00
  per_session_limit: 500.00
  status: "within_limits"

deliverables:
  - name: "deployment_script"
    size_bytes: 2048
    checksum: "sha256:..."
  - name: "config_template"
    size_bytes: 512
    checksum: "sha256:..."

verification:
  status: "passed"
  checks_passed: 5
  checks_failed: 0

notes: "Task completed successfully within cost and time budgets"
```

### 聚合成本报告
```python
def generate_cost_report(session_id):
    """
    汇总整个会话的所有mercenary成本
    """

    task_logs = read_all_cost_logs(session_id)

    report = {
        'session_id': session_id,
        'total_tasks': len(task_logs),
        'total_cost_usd': sum(log['total_usd'] for log in task_logs),
        'average_cost_per_task': ...,
        'cost_by_agent': {
            'claude-code': sum(...)
        },
        'within_limits': ...,
        'tasks': task_logs
    }

    return report
```

---

## 第6步：失败处理与重试 (Failure Handling)

### 重试策略
```python
def handle_acp_failure(result, task_def, attempt=1):
    """
    处理ACP执行失败
    """

    failure_info = {
        'task_id': task_def['task_id'],
        'attempt': attempt,
        'reason': result.get('errors', 'Unknown error'),
        'acp_output': result
    }

    if attempt < 2:
        # 第一次失败，尝试用同一agent重试
        print(f"Retrying task {task_def['task_id']} (attempt {attempt + 1})")

        retry_result = sessions_spawn(
            runtime="acp",
            agent=selected_agent['name'],
            prompt=modify_prompt_for_retry(task_package, result),
            cleanup="archive"
        )

        verification = verify_acp_result(retry_result, norma)

        if verification['verified']:
            return {
                'status': 'success',
                'result': retry_result,
                'retry_attempts': attempt
            }
        else:
            return handle_acp_failure(retry_result, task_def, attempt + 1)

    else:
        # 已重试两次，尝试切换agent（如果可用）
        alternative_agent = select_alternative_acp_agent(selected_agent)

        if alternative_agent:
            print(f"Switching to alternative agent: {alternative_agent['name']}")
            retry_result = sessions_spawn(
                runtime="acp",
                agent=alternative_agent['name'],
                prompt=task_package,
                cleanup="archive"
            )

            verification = verify_acp_result(retry_result, norma)

            if verification['verified']:
                return {
                    'status': 'success',
                    'result': retry_result,
                    'switched_agent': alternative_agent['name']
                }

        # 所有重试都失败，升级给Consul
        return {
            'status': 'escalate',
            'failure_info': failure_info,
            'escalate_to': 'consul'
        }
```

### 升级到Consul
```yaml
escalation:
  task_id: "task_003"
  reason: "ACP execution failed after 2 retries"
  agent_attempted:
    - "claude-code" (attempt 1)
    - "claude-code" (attempt 2)
  final_error: "Timeout: execution exceeded 5 minute limit"

  recommendation: "manual_intervention"
  options:
    - "extend_timeout_and_retry"
    - "break_into_subtasks"
    - "manual_execution"
    - "skip_task"
    - "abort_entire_session"

  escalation_timestamp: "2026-03-13T10:20:00Z"
  consul_decision_required: true
```

---

## 第7步：Caesar审批 (Caesar Approval Gate)

### 审批触发条件
以下操作需要Caesar（最高权限角色）的显式批准：

1. **database_write**: 对生产数据库的写操作
2. **external_api_call**: 调用外部API（不仅限于ACP）
3. **deploy**: 部署到生产环境
4. **cost_over_limit**: 任务成本超过预设限制

### 审批工作流
```python
def request_caesar_approval(action_type, task_def, cost_info=None):
    """
    向Caesar请求操作批准
    """

    approval_request = {
        'request_id': generate_request_id(),
        'action_type': action_type,
        'task_id': task_def['task_id'],
        'task_name': task_def['name'],
        'timestamp': timestamp(),
        'requester': 'condottiere',
        'details': {
            'action': action_type,
            'description': get_action_description(action_type, task_def),
            'risk_level': assess_risk(action_type, task_def),
            'cost_impact': cost_info
        }
    }

    # 发送给Caesar
    caesar_response = sessions_send(
        recipient='caesar',
        payload=approval_request,
        wait_for_response=True,
        timeout=300  # 5分钟超时
    )

    if caesar_response['approval'] == 'granted':
        return {
            'approved': True,
            'approval_id': caesar_response['approval_id'],
            'conditions': caesar_response.get('conditions', [])
        }
    else:
        return {
            'approved': False,
            'denial_reason': caesar_response['reason'],
            'appeal_possible': caesar_response.get('appeal_possible', False)
        }
```

### 审批请求示例
```yaml
approval_request:
  request_id: "apr-20260313-001"
  action_type: "database_write"
  task_id: "task_008"
  task_name: "Update user records"

  details:
    database: "production_users"
    records_affected: 1250
    operation: "bulk_update"
    rollback_possible: true
    estimated_duration: "2 minutes"
    risk_level: "medium"

  decision_required_by: "2026-03-13T10:30:00Z"
  auto_deny_if_no_response: true
```

### 成本超限的特殊处理
```python
# 从config.yaml读取成本限制
cost_limits = load_config('spqa/config.yaml')['mercenarii']['cost_limits']

if task_cost > cost_limits['per_task']:
    approval = request_caesar_approval(
        action_type='cost_over_limit',
        task_def=task_def,
        cost_info={
            'declared': task_cost,
            'limit': cost_limits['per_task'],
            'excess': task_cost - cost_limits['per_task']
        }
    )

    if not approval['approved']:
        raise CostOverLimitError(f"Task cost {task_cost} exceeds limit {cost_limits['per_task']}")
```

---

## 与Consul的接口

### Consul调用Condottiere
```python
result = condottiere.execute_mercenary_task(
    task_definition=task,
    officia=officia,
    norma=norma,
    upstream_context=upstream_results
)
```

### Condottiere返回结果
```yaml
result:
  task_id: "task_003"
  status: "success|failed|escalate"
  deliverables: {...}
  cost_incurred: 0.032
  cost_approved: true
  verification_passed: true
  acp_agent: "claude-code"
  execution_time: "15 minutes"
  archived_transcript: "path/to/archive"
```

### 与Annalist的交接
```python
# 所有ACP执行都自动archive，后续由Iter Legionum统一转发给Annalist
sessions_send(
    recipient='annalist',
    payload={
        'source': 'condottiere',
        'task_id': task_id,
        'acp_agent': selected_agent['name'],
        'result': result,
        'cost_log': cost_log,
        'verification': verification
    }
)
```

---

## 成本管理与预算

### 成本配置示例 (spqa/config.yaml)
```yaml
mercenarii:
  acp_providers:
    - name: "claude-code"
      enabled: true
      base_cost: 0.05

  cost_limits:
    per_task: 50.00
    per_session: 500.00
    per_day: 5000.00
    monthly_budget: 100000.00

  accounting:
    currency: "USD"
    tax_rate: 0.0
    billing_cycle: "monthly"
    payment_method: "prepaid_credits"
    low_balance_alert: 1000.00
```

### 预算检查
```python
def check_budget_available(task_cost, session_cost, daily_cost):
    """
    在执行前检查预算
    """

    config = load_config('spqa/config.yaml')
    limits = config['mercenarii']['cost_limits']

    checks = {
        'per_task': task_cost <= limits['per_task'],
        'per_session': (session_cost + task_cost) <= limits['per_session'],
        'per_day': (daily_cost + task_cost) <= limits['per_day']
    }

    if not all(checks.values()):
        failed_checks = [k for k, v in checks.items() if not v]
        raise BudgetExceededError(f"Budget exceeded for: {failed_checks}")

    return True
```

---

## 数据安全与隐私

### 敏感数据处理
- 所有传递给ACP的数据必须**最小化**，仅包含必要信息
- 不向ACP传递超级用户凭证或API密钥
- 所有API调用必须使用**时间限制的令牌**（TTL <= 1小时）
- ACP返回的敏感数据必须立即验证并隔离

### 日志脱敏
```python
def sanitize_logs(log_entry):
    """
    从日志中移除敏感信息
    """

    sensitive_patterns = [
        r'api[_-]?key["\']?\s*[=:]\s*["\']?[^"\']+',
        r'password["\']?\s*[=:]\s*["\']?[^"\']+',
        r'(token|secret)["\']?\s*[=:]\s*["\']?[^"\']+',
    ]

    for pattern in sensitive_patterns:
        log_entry = re.sub(pattern, '[REDACTED]', log_entry, flags=re.IGNORECASE)

    return log_entry
```
