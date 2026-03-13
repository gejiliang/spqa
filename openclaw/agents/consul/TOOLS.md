# Consul 工具清单 (Available Tools)

## 代理通信 (Agent Communication)

### sessions_send
```
用途: 与常驻代理通信 (阻塞式)
目标: Annalist | Curator | Praetor
超时: 5分钟
失败处理: 重试3次 → 上报Caesar
```

### sessions_spawn
```
用途: 创建临时代理 (生命周期管理)
模式1 - 讨论型:
  └─ spawn(type="senator", count=3-5, context={goal})
  └─ 返回: 议员意见集合 + 共识分数

模式2 - 执行型:
  └─ spawn(type="legionary", task={spec})
  └─ 返回: 执行结果 + 日志

模式3 - 工程型 (外包):
  └─ spawn(runtime="acp", type="condottiere", spec={code/report/debug})
  └─ 返回: 交付物 + 质量报告
  └─ SLA: 1-4小时
```

## 文件操作 (File Operations)

### 工作空间访问
```
read(path) / write(path) / delete(path)

目录结构:
  workspace/
  ├─ active/          [当前任务]
  ├─ pending/         [等待Caesar决策]
  ├─ archive/         [历史记录 via Annalist]
  ├─ config/          [配置文件]
  └─ temp/            [临时交付物]

权限: 完全读写
```

## 信息获取 (Information Retrieval)

### web_search
```
用途: 外部信息采集 (L1工程支持)
限制:
  └─ 仅用于技术调研、参考资料
  └─ 不用于Caesar数据隐私相关
频率: 按需, 无率限
```

### local_knowledge_base (via Curator)
```
用途: 内部知识库检索
内容:
  └─ 过去决策、架构、偏好
来源: Annalist存档
延迟: < 1秒
```

## 权限矩阵

| 工具 | L0 | L1 | L2 | L3 | 需批准 |
|------|----|----|----|----|--------|
| sessions_send | ✓ | ✓ | ✓ | ✓ | 否 |
| sessions_spawn(senator) | ✗ | ✗ | ✓ | ✗ | 是 |
| sessions_spawn(legionary) | ✗ | ✓ | ✓ | ✓ | 否 |
| sessions_spawn(acp) | ✗ | ✓ | ✓ | ✓ | 是 |
| file operations | ✓ | ✓ | ✓ | ✓ | 否 |
| web_search | ✓ | ✓ | ✓ | ✓ | 否 |

## 故障恢复

**通信超时** (> 5分钟无应答)
  └─ 重试 + 记录失败 → escalate_caesar

**外包失败** (Condottiere acp错误)
  └─ 返回完整错误日志 + 备选方案

**权限拒绝**
  └─ 等待Caesar明确授权 → 重新执行

---
**工具版本**: SPQA v1.0 · 兼容OpenClaw framework
