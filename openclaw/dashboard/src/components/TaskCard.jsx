const React = window.React;

/**
 * TaskCard Component
 * Displays task with level badge, status, assigned agent, and timing
 */
export default function TaskCard({ task, onSelect }) {
  if (!task) return null;

  const {
    id = 'task-unknown',
    title = '未命名任务',
    level = 'L0',
    status = 'pending',
    assignedAgent = '未分配',
    createdAt = null,
    dueAt = null,
    cost = 0,
  } = task;

  const getLevelColor = (lv) => {
    const levels = {
      'L0': 'l0',
      'L1': 'l1',
      'L2': 'l2',
      'L3': 'l3',
    };
    return levels[lv] || 'l0';
  };

  const getStatusColor = (st) => {
    switch (st) {
      case 'completed':
        return '#059669';
      case 'in_progress':
        return '#3b82f6';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#8B0000';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (st) => {
    const labels = {
      'completed': '已完成',
      'in_progress': '进行中',
      'pending': '待处理',
      'failed': '失败',
    };
    return labels[st] || st;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="roman-card"
      onClick={() => onSelect && onSelect(id)}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
    >
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className={`task-level ${getLevelColor(level)}`}>
            {level}
          </span>
          <div
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              backgroundColor: getStatusColor(status),
              color: 'white',
            }}
          >
            {getStatusLabel(status)}
          </div>
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#e0e0e0', marginBottom: '0.5rem' }}>
          {title}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>
          分配给: <span style={{ color: '#DAA520' }}>{assignedAgent}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0a0a0' }}>
        <span>
          {createdAt && `创建: ${formatTime(createdAt)}`}
        </span>
        {cost > 0 && (
          <span style={{ color: '#DAA520' }}>
            💰 {cost} 积分
          </span>
        )}
      </div>

      {dueAt && (
        <div style={{ fontSize: '0.75rem', color: '#DAA520', marginTop: '0.5rem' }}>
          截止: {formatTime(dueAt)}
        </div>
      )}
    </div>
  );
}
