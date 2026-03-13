const React = window.React;

/**
 * AgentCard Component
 * Displays agent status with emoji, name, last activity, and action button
 */
export default function AgentCard({ agent, onAction }) {
  if (!agent) return null;

  const {
    id = 'unknown',
    name = 'Unknown Agent',
    emoji = '⚪',
    status = 'offline',
    lastActivity = null,
    description = '',
  } = agent;

  const isOnline = status === 'online';

  const formatTime = (timestamp) => {
    if (!timestamp) return '未知';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="roman-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{emoji}</span>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#DAA520' }}>
              {name}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>
              {description}
            </div>
          </div>
        </div>
        <span
          className={`status-indicator ${isOnline ? 'online' : 'offline'}`}
          title={isOnline ? '在线' : '离线'}
        />
      </div>

      <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: '#a0a0a0' }}>
        <span>最后活动: </span>
        <span style={{ color: '#e0e0e0' }}>
          {formatTime(lastActivity)}
        </span>
      </div>

      {onAction && (
        <button
          className="roman-btn"
          onClick={() => onAction(id)}
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: '0.85rem',
          }}
        >
          查看详情
        </button>
      )}
    </div>
  );
}
