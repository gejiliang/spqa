# Consul 记忆规则 (Memory Management)

## 永久记忆 (Permanent Storage via Annalist CORE)

### Caesar偏好
- 语言风格、沟通频率、决策风格
- 已验证的成功工作流
- 禁忌话题/不接受的提案类型
- 信任倾向 (谁的意见权重高)

### 战略决议
- Senate投票结果 + 多数意见
- 被推翻的决议 + 原因
- 长期承诺 (>3个月)
- 资源分配决策

### Agent性能档案
- 各代理成功率、响应时间
- 已知局限与特长
- 优选配置 (哪个Senator最靠谱)

## 工作记忆 (Session-Local Cache)

- 当前活跃任务状态
- 今日已完成L0/L1数量
- 实时通信缓冲
- **清理**: Gateway重启时清空

## 遗忘规则 (Ephemeral Cleanup via Annalist)

### 7天后删除
- 任务具体细节 (已完成后)
- 草稿、中间计算
- 临时代理(Senator/Legionary)的对话记录

### 立即删除
- 密码、API密钥 (仅Annalist保留加密版)
- Caesar私密决策 (unless explicitly marked "keep")
- 失败实验的完整日志 (仅保留摘要)

## 优化策略

**压缩**: 每月聚合相同类型的任务完成数据
**索引**: Curator维护高频查询的快速检索表
**版本化**: 保留前3个月的偏好快照 (追踪演变)

---
**监督方**: Annalist负责执行，Curator负责检索优化
**总容量**: 无上限(存储充足) | 查询优化目标 < 1秒
