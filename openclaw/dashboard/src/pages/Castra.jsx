const React = window.React;
const { useState, useEffect } = window.React;

/**
 * Castra (军营)
 * Task management with legion DAG visualization
 */

const MOCK_TASKS = [
  {
    id: 'task-1',
    title: '处理用户反馈汇总',
    level: 'L1',
    status: 'in_progress',
    assignedAgent: 'Consul',
    cost: 150,
    createdAt: new Date(Date.now() - 7200000),
    dueAt: new Date(Date.now() + 86400000),
    type: 'legion',
  },
  {
    id: 'task-2',
    title: '第二季度市场分析',
    level: 'L2',
    status: 'pending',
    assignedAgent: 'Annalist',
    cost: 450,
    createdAt: new Date(Date.now() - 3600000),
    dueAt: new Date(Date.now() + 172800000),
    type: 'legion',
  },
  {
    id: 'task-3',
    title: '优化工作流程',
    level: 'L0',
    status: 'completed',
    assignedAgent: 'Curator',
    cost: 80,
    createdAt: new Date(Date.now() - 86400000),
    dueAt: null,
    type: 'legion',
  },
  {
    id: 'merc-1',
    title: '数据清洗',
    level: 'L2',
    status: 'pending',
    assignedAgent: '外包商-Alpha',
    cost: 300,
    createdAt: new Date(Date.now() - 1800000),
    dueAt: new Date(Date.now() + 259200000),
    type: 'mercenary',
  },
  {
    id: 'merc-2',
    title: '前端UI优化',
    level: 'L1',
    status: 'in_progress',
    assignedAgent: '外包商-Beta',
    cost: 250,
    createdAt: new Date(Date.now() - 600000),
    dueAt: new Date(Date.now() + 172800000),
    type: 'mercenary',
  },
];

export default function Castra() {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);

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
          <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>
            总任务数
          </div>
          <div style={{ fontSize: '1.3rem', color: '#DAA520', fontWeight: 'bold' }}>
            {filteredTasks.length}
          </div>
        </div>

        <div className="roman-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>👥</div>
          <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>
            军团任务
          </div>
          <div style={{ fontSize: '1.3rem', color: '#DAA520', fontWeight: 'bold' }}>
            {legionTasks}
          </div>
        </div>

        <div className="roman-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>💼</div>
          <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>
            佣兵任务
          </div>
          <div style={{ fontSize: '1.3rem', color: '#DAA520', fontWeight: 'bold' }}>
            {mercenaryTasks}
          </div>
        </div>

        <div className="roman-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>💰</div>
          <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>
            成本合计
          </div>
          <div style={{ fontSize: '1.3rem', color: '#DAA520', fontWeight: 'bold' }}>
            {totalCost}
          </div>
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

      {/* New Task Form */}
      {showNewTaskForm && (
        <div className="roman-card" style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#DAA520', marginBottom: '1rem' }}>
            创建新任务
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="任务标题"
              style={{
                padding: '0.75rem',
                backgroundColor: '#0f3460',
                border: '1px solid #DAA520',
                borderRadius: '4px',
                color: '#e0e0e0',
                fontFamily: 'inherit',
              }}
            />
            <select
              style={{
                padding: '0.75rem',
                backgroundColor: '#0f3460',
                border: '1px solid #DAA520',
                borderRadius: '4px',
                color: '#e0e0e0',
                cursor: 'pointer',
              }}
            >
              <option>选择任务等级</option>
              <option>L0 - 最小</option>
              <option>L1 - 低</option>
              <option>L2 - 中</option>
              <option>L3 - 高</option>
            </select>
            <select
              style={{
                padding: '0.75rem',
                backgroundColor: '#0f3460',
                border: '1px solid #DAA520',
                borderRadius: '4px',
                color: '#e0e0e0',
                cursor: 'pointer',
              }}
            >
              <option>选择任务类型</option>
              <option>军团任务</option>
              <option>佣兵任务</option>
            </select>
            <button className="roman-btn" style={{ marginTop: '0.5rem' }}>
              创建任务
            </button>
          </div>
        </div>
      )}

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
            {/* Header */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: getLevelColor(task.level),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  {task.level}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.6rem',
                    backgroundColor: task.type === 'mercenary' ? '#8B0000' : '#0f3460',
                    color: '#e0e0e0',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                  }}
                >
                  {task.type === 'mercenary' ? '佣兵' : '军团'}
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#e0e0e0', marginBottom: '0.5rem' }}>
                {task.title}
              </div>
            </div>

            {/* Status */}
            <div style={{
              display: 'inline-block',
              padding: '0.25rem 0.5rem',
              backgroundColor: task.status === 'completed' ? '#059669' : task.status === 'in_progress' ? '#3b82f6' : '#f59e0b',
              color: 'white',
              borderRadius: '4px',
              fontSize: '0.7rem',
              marginBottom: '0.75rem',
            }}>
              {getStatusLabel(task.status)}
            </div>

            {/* Details */}
            <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.75rem', lineHeight: '1.5' }}>
              <div>分配: <span style={{ color: '#DAA520' }}>{task.assignedAgent}</span></div>
              <div>创建: {formatTime(task.createdAt)}</div>
              {task.dueAt && (
                <div>截止: <span style={{ color: '#DAA520' }}>{task.dueAt.toLocaleDateString('zh-CN')}</span></div>
              )}
              <div>成本: <span style={{ color: '#DAA520' }}>{task.cost} 积分</span></div>
            </div>

            {/* Action */}
            <button className="roman-btn" style={{ width: '100%', fontSize: '0.8rem' }}>
              查看详情
            </button>
          </div>
        ))}
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <div style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: '350px',
          height: '100%',
          backgroundColor: '#16213e',
          borderLeft: '2px solid #DAA520',
          padding: '1.5rem',
          overflowY: 'auto',
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#DAA520', margin: 0, fontSize: '1.1rem' }}>任务详情</h3>
            <button
              onClick={() => setSelectedTask(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#DAA520',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ borderTop: '1px solid #DAA520', paddingTop: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>标题</div>
              <div style={{ color: '#e0e0e0', fontWeight: '500' }}>{selectedTask.title}</div>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>等级</div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: getLevelColor(selectedTask.level),
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  {selectedTask.level}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>类型</div>
                <div style={{ color: '#e0e0e0', fontSize: '0.9rem' }}>
                  {selectedTask.type === 'mercenary' ? '佣兵任务' : '军团任务'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>状态</div>
              <div style={{ color: '#e0e0e0' }}>{getStatusLabel(selectedTask.status)}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>分配给</div>
              <div style={{ color: '#DAA520', fontWeight: '500' }}>{selectedTask.assignedAgent}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>成本</div>
              <div style={{ color: '#DAA520', fontSize: '1.1rem', fontWeight: 'bold' }}>
                {selectedTask.cost} 积分
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>时间</div>
              <div style={{ color: '#a0a0a0', fontSize: '0.85rem' }}>
                <div>创建: {selectedTask.createdAt.toLocaleDateString('zh-CN')}</div>
                {selectedTask.dueAt && (
                  <div>截止: {selectedTask.dueAt.toLocaleDateString('zh-CN')}</div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #DAA520', paddingTop: '1rem' }}>
              <button className="roman-btn" style={{ width: '100%', marginBottom: '0.5rem' }}>
                编辑
              </button>
              <button className="roman-btn" style={{ width: '100%', backgroundColor: '#4a4a4a' }}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
