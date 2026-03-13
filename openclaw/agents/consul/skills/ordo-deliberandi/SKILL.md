---
name: "ordo-deliberandi"
version: "1.0.0"
tags: ["senate", "deliberation", "orchestration"]
minOC: "2026.3.0"
provider: "spqa"
---

# Ordo Deliberandi (议事编排) — 四阶段议事协调

## 目标
按照罗马式议事传统，通过四个阶段（发散→冲突→收敛→产出）将议员观点汇聚成一份可执行的法令（Senatus Consultum）。

## 输入
- **topic**: 原始议题
- **senatus_assembly**: 来自Praetor的议员组合 (包含file_path列表)
- **context**: 背景信息

## 四阶段工作流

---

## 第1阶段：Cogitatio (发散期 - 独立思考)

### 目标
每位议员在**互不可见**的状态下，基于其专长和观点，独立分析议题。

### 执行
```
for each senator in senatus_assembly:
    prompt = format_prompt(
        topic=topic,
        perspective=senator.perspective,
        expertise=senator.tags,
        instructions="你是{senator.name}，拥有{tags}的专长。请从你的观点独立分析这个议题。
                      不要考虑其他议员的意见。输出：分析、关键见解、假设、初步建议。"
    )

    result = sessions_spawn(
        prompt=prompt,
        agent=senator.agent_id,
        cleanup="archive",
        mode="run"
    )

    phase1_outputs[senator.name] = result
```

### 约束
- 最多同时spawn 6个议员 (max_concurrent: 6)
- 议员之间**完全隔离**，不可见彼此分析
- 每位议员的输出保存为独立的archived transcript
- 总时间限制：15分钟

### 输出
`phase1_outputs`: 字典，键为议员名称，值为其独立分析 (archived transcript path)

---

## 第2阶段：Contentio (冲突期 - 对抗与挑战)

### 目标
将议员分为两队（蓝队：维护者 Defensores、红队：反对者 Oppugnatores），进行**有结构的对抗**。

### 分队策略
```
blue_team = select(senatus_assembly, role="supportive" OR highest_consensus_score)
red_team = senatus_assembly - blue_team

instructions_blue = """
你是蓝队，维护方立场 (Defensores)。
你将收到阶段1的所有议员分析。请：
1. 总结主要观点和共识
2. 从支持角度强化可行性和优势
3. 准备好应对红队的3个关键反对意见
你只有1次机会进行辩驳，请珍惜。
"""

instructions_red = """
你是红队，反对方立场 (Oppugnatores)。
你将收到阶段1的所有议员分析。请：
1. 识别至少3个主要问题、风险或反对意见
2. 深入分析这些问题的根本原因
3. 提出具体的反对论据
4. 提出替代方案或修正方向
"""

red_result = sessions_spawn(
    prompt=instructions_red + phase1_outputs,
    agent=red_team_leader,
    cleanup="archive"
)

blue_result = sessions_spawn(
    prompt=instructions_blue + phase1_outputs + red_result,
    agent=blue_team_leader,
    cleanup="archive"
)
```

### 约束
- 红队必须找出**至少3个实质性问题**
- 蓝队**只有1次辩驳机会**，不能无限往复
- 不进行超过2轮的辩论（防止陷入无限循环）
- 时间限制：10分钟

### 输出
`phase2_outputs`: 包含红队问题清单和蓝队辩驳意见

---

## 第3阶段：Consensus (收敛期 - 匿名投票与共识)

### 目标
通过主持人角色聚合所有观点，找出**共识区域**，运用结构化投票机制达成一致。

### Moderator角色
```
moderator_prompt = """
你是议事的主持人 (Moderator)。你的任务：
1. 阅读所有阶段1-2的议员分析和辩论
2. 从中提取：
   a) 所有议员同意的基本点 (Consensus)
   b) 分歧点及其根源 (Disputes)
   c) 需要深入讨论的关键问题 (Open Questions)
3. 撰写一份中立的汇总报告 (Consensus Report)
4. 设计一份匿名投票表单，包含3-5个核心问题
"""

moderator_result = sessions_spawn(
    prompt=moderator_prompt + phase1_outputs + phase2_outputs,
    agent="moderator_id",
    cleanup="archive"
)
```

### 匿名投票
```
voting_prompt = """
以下是议事的中立汇总。请对以下问题进行匿名投票：
{moderator_result.voting_questions}

投票选项：强烈同意 / 同意 / 中立 / 反对 / 强烈反对
"""

for senator in senatus_assembly:
    vote = sessions_spawn(
        prompt=voting_prompt,
        agent=senator.agent_id,
        mode="vote"
    )
    votes[senator.name] = vote

consensus_score = calculate_convergence(votes)
```

### 收敛判断
- 如果 consensus_score >= 70% (超过70%议员同意) → 进入第4阶段
- 如果 consensus_score < 70% 且迭代 < 2 → 再进行1轮Moderator汇总+投票
- 如果 consensus_score < 70% 且迭代 >= 2 → **Appellatio ad Caesarem** (升级给Caesar决策)

### 输出
`phase3_outputs`: 包含共识报告、投票结果、最终收敛分数

---

## 第4阶段：Decretum (产出期 - 法令生成)

### 目标
生成一份完整的、可执行的 **Senatus Consultum** (元老院法令)，包含明确的任务分解、权限分配、交付标准和时间估计。

### Summarizer角色 (蓝帽)
```
summarizer_prompt = """
你是蓝帽总结者 (Blue Hat Summarizer)。基于以下议事成果：
- 阶段1-3的所有分析和投票结果
- Moderator的共识报告

请生成一份 Senatus Consultum (元老院法令)，包含以下部分：

## 1. Praefatio (序言)
- 议题背景
- 议事的关键共识点
- 主要风险和考虑因素

## 2. Legionarii (军团兵编排)
这是任务分解的关键部分。列出所有需要执行的任务，格式为：

```yaml
legionarii:
  - task_id: "task_001"
    name: "任务名称"
    description: "详细的任务描述"
    owner: "责任人或角色"
    depends_on: ["task_xyz"]  # 这个任务依赖的上游任务ID列表
    estimated_effort: "4 hours"

  - task_id: "task_002"
    name: "..."
    depends_on: []  # 如果不依赖其他任务，留空或不填
    ...
```

## 3. Officia (权限与上下文分配)
为每个任务分配执行权限和上游输出的上下文：

```yaml
officia:
  - task_id: "task_001"
    context_from: ["task_xyz"]  # 该任务所需的上游输出任务ID列表
    permissions:
      - "read:documents"
      - "write:draft"
    instructions: "具体的执行指示"
```

## 4. Norma (交付标准)
定义质量和完成标准：

```yaml
norma:
  - task_id: "task_001"
    deliverables:
      - "提交物1的格式和内容要求"
      - "提交物2的格式和内容要求"
    acceptance_criteria:
      - "验收标准1"
      - "验收标准2"
```

## 5. Tempus (时间估计)
```yaml
tempus:
  total_duration: "2 days"
  critical_path: ["task_001", "task_002", "task_005"]
  deadline: "2026-03-15"
```

## 6. Provisio (风险预案)
```yaml
provisio:
  risks:
    - risk: "描述一个可能的风险"
      probability: "high|medium|low"
      impact: "if this happens..."
      mitigation: "应对措施"

  escalation_triggers:
    - "condition: 超过时间限制"
      action: "escalate to Consul"
```

确保所有字段都已填完。缺少任何字段会导致后续执行失败。
"""

senatus_consultum = sessions_spawn(
    prompt=summarizer_prompt + phase3_outputs,
    agent="summarizer_id",
    cleanup="archive"
)
```

### 结构化验证 (Structured Validation)
```
validation_schema = {
    "praefatio": required,
    "legionarii": {
        "required": true,
        "fields": ["task_id", "name", "description", "depends_on"]
    },
    "officia": {
        "required": true,
        "fields": ["task_id", "context_from", "permissions"]
    },
    "norma": {
        "required": true,
        "fields": ["task_id", "deliverables", "acceptance_criteria"]
    },
    "tempus": {
        "required": true,
        "fields": ["total_duration", "critical_path", "deadline"]
    },
    "provisio": required
}

if not validate(senatus_consultum, validation_schema):
    request_supplement(senatus_consultum, missing_fields)
    # 重新执行summarizer，补充缺失字段
```

### 输出
`senatus_consultum`: 完整的、经验证的法令文档 (YAML格式)

---

## 状态管理

### Session Meta写入
```yaml
# 保存至: consul/workspace/active/session-meta.yaml
session_id: "{uuid}"
topic: "{original_topic}"
created_at: "{timestamp}"
status: "phase4_complete"

phases:
  phase1_cogitatio:
    status: "complete"
    transcript_paths:
      - "...archived path..."

  phase2_contentio:
    status: "complete"
    transcript_paths: [...]

  phase3_consensus:
    status: "complete"
    convergence_score: 0.85
    votes: {...}

  phase4_decretum:
    status: "complete"
    senatus_consultum_path: "..."

legionarii_count: 12
critical_tasks: 3
```

---

## 清理与交接 (Cleanup & Handoff)

### 存档策略
- 每个 sessions_spawn 都使用 cleanup="archive"，保存为Annalist可读的transcript
- 所有archived path都记录在 session-meta.yaml 中

### 发送给Annalist
议事完成后：

```python
sessions_send(
    recipient="annalist",
    payload={
        "session_id": session_id,
        "session_meta": session_meta,
        "archived_transcripts": [list of all archived paths],
        "senatus_consultum": senatus_consultum,
        "phase_summaries": {
            "cogitatio": phase1_summary,
            "contentio": phase2_summary,
            "consensus": phase3_summary
        }
    }
)
```

---

## 失败处理与升级

### 无法收敛 (Appellatio ad Caesarem)
如果第3阶段无法达到70%共识，触发：

```yaml
appeal_to_caesar:
  reason: "Consensus not reached after 2 voting rounds"
  convergence_score: 0.62
  red_team_issues: [list of unresolved issues]
  blue_team_response: [...]
  moderator_recommendation: "requires Caesar's decision on..."

  action: "escalate"
  target: "caesar_agent"
  context: "provide full session transcript"
```

### 第4阶段验证失败
如果Senatus Consultum缺失字段 → 要求Summarizer补充，重新spawn

---

## 与Consul的接口
1. Consul调用 Ordo Deliberandi，传入 senatus_assembly 和 topic
2. Ordo Deliberandi管理四个阶段的执行
3. 返回 senatus_consultum 和 session-meta.yaml
4. Consul检查 senatus_consultum.legionarii，准备进入 Iter Legionum
