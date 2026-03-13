const React = window.React;
const { useState, useEffect } = window.React;

/**
 * Castra (军营)
 * Task management with legion DAG visualization
 */

export default function Castra() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);

  useEffect(() => {
    const api = window.spqaApi;
    if (!api) return;

    api.getAllTasks().then(res => {
      if (res.success && res.data?.tasks) {
        const all = [
          ...(res.data.tasks.active || []).map(t => ({ ...t, type: 'legion' })),
          ...(res.data.tasks.mercenary || []).map(t => ({ ...t, type: 'mercenary' })),
        ];
        setTasks(all.map(t => ({
          id: t.id,
          title: t.title || t.topic || t.id,
          level: t.level || 'L0',
          status: t.status || 'pending',
          assignedAgent: t.assignedAgent || t.assigned_to || '-',
          cost: t.cost || t.cost_usd || 0,
          createdAt: new Date(t.createdAt || t.created || Date.now()),
          dueAt: t.dueAt ? new Date(t.dueAt) : null,
          type: t.type,
        })));
      }
    });
  }, []);

  const filteredTasks = tasks.filter(task => {
    const typeMatch = filterType === 'all' || task.type === filterType;
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const getLevelColor = (level) => {
    const colors = {
      'L0': '#059669',
      'L1': '#3b82f6',
      'L2': '#f59e0b',
      'L3': '#8B0000',
    };
    return colors[level] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'completed': '已完成',
      'in_progress': '进行中',
      'pending': '待处理',
      'failed': '失败',
    };
    return labels[status] || status;
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  const totalCost = filteredTasks.reduce((sum, t) => sum + t.cost, 0);
  const legionTasks = filteredTasks.filter(t => t.type === 'legion').length;
  const mercenaryTasks = filteredTasks.filter(t => t.type === 'mercenary').length;

  return (
    <div style={{ padding: '1.5rem', overflow: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#DAA520', margin: '0 0 0.5rem 0' }}>
          ⚔️ 军营 (Castra)
        </h1>
        <p style={{ color: '#a0a0a0', margin: 0 }}>
          任务管理与人力资源分配
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div className="roman-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>🔢</div>
          <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>总任务数</div>
          <div style={{ fontSize: '1.3rem', color: '#DAA520', fontWeight: 'bold' }}>{filteredTasks.length}</div>
        </div>
        <div className="roman-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>👥</div>
          <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>军团任务</div>
          <div style={{ fontSize: '1.3rem', color: '#DAA520', fontWeight: 'bold' }}>{legionTasks}</div>
        </div>
        <div className="roman-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>💼</div>
          <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>佣兵任务</div>
          <div style={{ fontSize: '1.3rem', color: '#DAA520', fontWeight: 'bold' }}>{mercenaryTasks}</div>
        </div>
        <div className="roman-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>💰</div>
          <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>成本合计</div>
          <div style={{ fontSize: '1.3rem', color: '#DAA520', fontWeight: 'bold' }}>{totalCost}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <button className="roman-btn" onClick={() => setShowNewTaskForm(!showNewTaskForm)}>
          {showNewTaskForm ? '✕ 取消' : '➕ 新任务'}
        </button>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '0.5rem',
            backgroundColor: '#0f3460',
            border: '1px solid #DAA520',
            borderRadius: '4px',
            color: '#e0e0e0',
            cursor: 'pointer',
          }}
        >
          <option value="all">所有类型</option>
          <option value="legion">军团任务</option>
          <option value="mercenary">佣兵任务</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '0.5rem',
            backgroundColor: '#0f3460',
            border: '1px solid #DAA520',
            borderRadius: '4px',
            color: '#e0e0e0',
            cursor: 'pointer',
          }}
        >
          <option value="all">所有状态</option>
          <option value="pending">待处理</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
        </select>
      </div>

      {/* Tasks Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1rem',
      }}>
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className="roman-card"
            onClick={() => setSelectedTask(task)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: getLevelColor(task.level),
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}>{task.level}</span>
                <span style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.6rem',
                  backgroundColor: task.type === 'mercenary' ? '#8B0000' : '#0f3460',
                  color: '#e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                }}>{task.type === 'mercenary' ? '佣兵' : '军团'}</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#e0e0e0', marginBottom: '0.5rem' }}>
                {task.title}
              </div>
            </div>
            <div style={{
              display: 'inline-block',
              padding: '0.25rem 0.5rem',
              backgroundColor: task.status === 'completed' ? '#059669' : task.status === 'in_progress' ? '#3b82f6' : '#f59e0b',
              color: 'white',
              borderRadius: '4px',
              fontSize: '0.7rem',
              marginBottom: '0.75rem',
            }}>{getStatusLabel(task.status)}</div>
            <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.75rem', lineHeight: '1.5' }}>
              <div>分配: <span style={{ color: '#DAA520' }}>{task.assignedAgent}</span></div>
              <div>创建: {formatTime(task.createdAt)}</div>
              <div>成本: <span style={{ color: '#DAA520' }}>{task.cost} 积分</span></div>
            </div>
            <button className="roman-btn" style={{ width: '100%', fontSize: '0.8rem' }}>查看详情</button>
          </div>
        ))}
      </div>
    </div>
  );
}
