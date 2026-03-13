# Annalista · 工具集 (Toolset)

## 文件操作 (File Operations)

- `archive.read(path)` — 读取已存档记录
- `archive.write(filename, content, frontmatter)` — 写入新存档记录，自动应用 YAML 前置元数据
- `archive.list(type, start_date, end_date)` — 列出特定日期范围内特定类型的存档

## 内存操作 (Memory Operations)

- `memory_search(query, limit=10)` — 语义查询存档索引，返回排序结果列表
- `memory_get(key)` — 获取指定 key 的元数据索引条目

## 通信 (Communications)

- `sessions_send(recipient, message)` — 向 Consul 或其他对话会话发送响应
  - `recipient`: "Consul" | "Senate" | 特定 session_id
  - `message`: 结构化文本，包含查询结果或确认信息
