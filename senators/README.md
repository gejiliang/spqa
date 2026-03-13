# SPQA 元老院 · Senate Templates

## 文件结构

```
senators/
├── BASE_TEMPLATE.md          (2398 chars) — 所有元老共享的身份层
├── s-oeconomicus.md          宏观经济学家
├── s-numerarius.md           量化策略师
├── s-architectus.md          技术架构师
├── s-fabricator.md           产品经理
├── s-artifex.md              创意总监
├── s-cautus.md               风险分析师
├── s-analyticus.md           数据科学家
├── s-operarius.md            运营专家
├── s-argentarius.md          财务分析师
├── s-iuridicus.md            法务顾问
├── s-mercator.md             市场分析师
└── s-humanitas.md            用户体验师
```

## 使用方式

每位元老的完整 prompt 由以下部分组成：

```
完整 Prompt = BASE_TEMPLATE.md + [话题上下文] + 个人 PERSPECTIVE (s-{id}.md)
```

### 示例流程

1. **Praetor（裁判官）加载话题上下文** — 议题背景、目标、约束
2. **为每位元老加载 BASE_TEMPLATE** — 共享身份和约束
3. **为每位元老加载对应的 s-{id}.md** — 个人视角和评判标准
4. **告知当前阶段** — Cogitatio / Contentio / Consensus / Decretum
5. **元老发言** — 遵守 Lex Senatus 规则

## Lex Senatus · 议事纪律

所有元老必须遵守 BASE_TEMPLATE 中的四大约束：

### 1. Silentium Rule · 沉默律
- 无新增价值 = 沉默
- 沉默 = 同意
- 禁止礼貌性附和

### 2. Perspectiva Tag · 视角标注
每次发言开头标注维度：`[视角：xxx]`

### 3. Decretum Awareness · 产出意识
推动讨论向可执行方案收敛（Legionarii, Officia, Norma, Tempus, Provisio）

### 4. 阶段纪律
- Cogitatio: 只从指定维度输出
- Contentio: 红军模式找缺陷
- Consensus: 独立投票
- Decretum: 配合蓝帽总结

## 12 位元老 · 专业维度

| 元老 | 拉丁名 | 中文名 | 核心维度 | 主要框架 |
|------|--------|--------|---------|---------|
| 1 | Oeconomicus | 宏观经济学家 | 宏观趋势、政策环境 | 经济周期、情景分析 |
| 2 | Numerarius | 量化策略师 | 数据、风险比率 | Sharpe、回撤分析 |
| 3 | Architectus | 技术架构师 | 系统设计、可扩展性 | CAP、SOLID |
| 4 | Fabricator | 产品经理 | 用户需求、MVP | RICE、用户故事地图 |
| 5 | Artifex | 创意总监 | 品牌、叙事 | 定位矩阵、叙事弧线 |
| 6 | Cautus | 风险分析师 | 风险、合规 | 风险矩阵、Pre-mortem |
| 7 | Analyticus | 数据科学家 | 统计、ML | 假设检验、A/B 测试 |
| 8 | Operarius | 运营专家 | 流程、效率 | 精益、瓶颈分析 |
| 9 | Argentarius | 财务分析师 | 成本、ROI | DCF、单位经济 |
| 10 | Iuridicus | 法务顾问 | 合规、法律 | 监管地图、IP 审计 |
| 11 | Mercator | 市场分析师 | 竞品、定位 | Porter 五力、TAM |
| 12 | Humanitas | 用户体验师 | 可用性、交互 | 启发式评估、UX 地图 |

## 设计原则

✓ **Differentiation Only** — 各个 senator 文件只包含个人视角层，共享身份层在 BASE_TEMPLATE

✓ **Distinct Personalities** — 每位元老有独特的思维方式、评判标准、分析框架

✓ **Latin + Chinese** — 所有 prompt 用中文，关键术语用拉丁文标注

✓ **Character Constraint** — 每个 senator 文件 < 1050 chars，BASE_TEMPLATE < 2500 chars，总合 < 15k

✓ **De Bono 思考帽** — 每位元老的"思考帽"角色明确（白帽=事实、黑帽=风险、黄帽=价值、红帽=直觉）

## 迭代方式

- 修改 **BASE_TEMPLATE.md** → 影响所有元老
- 修改 **s-{id}.md** → 只影响该位元老
- 添加新元老 → 创建新的 s-{id}.md，遵循同样结构

---

**Created**: 2026-03-13  
**Architecture**: SPQA (Senatus Populusque Agentium)  
**Language**: Chinese with Latin terms  
**Orchestrator**: Ready for four-phase deliberation
