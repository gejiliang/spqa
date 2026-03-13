---
name: "praetor"
version: "1.0.0"
tags: ["senate", "selection", "analysis"]
minOC: "2026.3.0"
provider: "spqa"
---

# Praetor (裁判官) — 议题分析与议员选拔

## 目标
分析并分解议题，从12人议员库中选出最佳的议员组合（称为 Senatus），以形成一个多视角、高效的议事小组。

## 输入
- **topic**: 用户提交的议题或问题 (字符串)
- **context**: 可选的背景信息或历史记录
- **senator_pool**: 12个可用议员的列表及其简介 (从 `senate/senators/` 目录读取)

## 工作流

### 第1步：议题解析 (Topic Decomposition)
分析议题的以下维度：
- **Domain** (领域): 识别主要的知识领域 (例：技术、财务、法律、战略)
- **Dimensions** (维度): 拆解议题涉及的关键问题向量 (例：可行性、成本、风险、影响)
- **Complexity Level** (复杂度): 评估议题的复杂程度
  - 简单 (Simple): 1-2个维度，明确答案 → 建议3人议员组合
  - 中等 (Moderate): 3-4个维度，需要平衡观点 → 建议4人议员组合
  - 复杂 (Complex): 5+个维度，多方权衡 → 建议5人议员组合

### 第2步：议员库匹配 (Senator Matching)
对于议题的每个主要维度，从议员库中匹配：
1. 读取 `senate/senators/` 目录中的所有议员YAML文件
2. 每个议员都具有 **tags** 属性（专长领域标签）
3. 对于议题的每个 Domain 或 Dimension，找出 tags 匹配最高的议员
4. 建立 **议题维度→议员** 的映射表

### 第3步：确保多样性 (Diversity Check)
- 不应选出 3 个或以上具有相同主要观点风格的议员
- 优先选择能代表不同角度 (例：保守派、进步派、实用派) 的议员
- 检查选定议员的背景多样性 (角色、经验、专长)

### 第4步：输出结果 (Structured Output)
生成YAML格式的推荐议员组合：

```yaml
senatus_assembly:
  topic_analysis:
    domain: "..."
    dimensions:
      - "..."
      - "..."
    complexity_level: "simple|moderate|complex"
    assembly_size: 3|4|5

  recommended_senators:
    - name: "议员名字"
      file_path: "senate/senators/[filename].yaml"
      tags: ["tag1", "tag2"]
      rationale: "选出该议员的原因，与议题维度的关联"
      primary_role: "在议事中的主要角色"

    - name: "议员名字"
      file_path: "senate/senators/[filename].yaml"
      tags: ["tag1", "tag2"]
      rationale: "..."
      primary_role: "..."

  assembly_diversity_check: "✓ 已确保多视角" 或 "⚠ 某维度缺乏反对声音"

  next_step: "pass_to_ordo_deliberandi"
```

## 约束
- **议员组合大小**: 最少3人，最多5人
- **多样性**: 确保不是3个几乎相同观点的议员
- **文件路径**: 必须包含准确的议员YAML文件路径 (供Consul后续加载)
- **Rationale字段**: 明确说明为什么该议员适合这个议题

## 失败处理
- 如果议题过于专业化，某些维度找不到合适议员 → 标记为⚠，记录缺失领域，继续
- 如果议员库不足 (少于3人) → 返回错误，请求扩展议员库

## 与Consul的接口
- Consul调用 Praetor
- Praetor返回 `senatus_assembly` 结构体
- Consul读取 `recommended_senators` 中的 `file_path` 并加载议员YAML
- Consul将结果传递给 Ordo Deliberandi
