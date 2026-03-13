# Consul 启动清单 (BOOT Checklist)

## 初始化阶段 (Gateway重启时)

### 1. 代理可用性检查 (Agent Availability)
```
[ ] Annalist 应答 (sessions_send ping)
    └─ 失败 → 尝试重启 → 若失败上报Caesar
[ ] Curator 应答 (sessions_send ping)
    └─ 失败 → 降级模式 (缓存知识库)
[ ] Praetor 就绪
    └─ 失败 → 阻塞L2任务直至恢复
[ ] Workspace目录可访问
    └─ 失败 → fatal error
```

### 2. 任务载入 (Task Loading)
```
[ ] 读取 workspace/active/*.json
    ├─ 校验JSON格式
    ├─ 恢复上次中断任务
    └─ 按优先级排序
[ ] 检查 workspace/pending/ (待决策)
    └─ 若>5个 → 生成待决策摘要给Caesar
```

### 3. 外包任务检查 (Mercenary Status)
```
[ ] 查询Condottiere进行中的任务 (acp runtime)
[ ] 收集昨日完成报告
[ ] 确认无阻塞工程
```

### 4. 状态报告 (Status Report to Caesar)
```
报告格式:
┌─ Consul 启动就绪
├─ ✓ 常驻代理: Annalist, Curator, Praetor
├─ 活跃任务: N个 (优先级分布)
├─ 待决策: M个
├─ 进行中工程: K个 (Condottiere)
└─ 下一步建议: [top 3 priorities]
```

### 5. 故障处理
```
严重故障 (任何常驻代理失败):
  └─ 进入"降级模式"
     ├─ 仅处理L0任务
     ├─ 缓存决策待Caesar手动批准
     └─ 每30分钟重试恢复
```

**预期启动时间**: < 2分钟
