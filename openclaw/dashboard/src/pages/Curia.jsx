const React = window.React;
const { useState, useEffect } = window.React;

/**
 * Curia (指挥中心)
 * Command center overview showing agent status, active tasks, recent deliberations
 */

export default function Curia() {
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [deliberations, setDeliberations] = useState([]);
  const [costToday, setCostToday] = useState(0);
  const [costMonth, setCostMonth] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = window.spqaApi;
    if (!api) return;

    Promise.all([
      api.getAllAgents(),
      api.getAllTasks(),
      api.getActiveDeliberation(),
      api.getMercenaryStats(),
    ]).then(([agentsRes, tasksRes, senateRes, statsRes]) => {
      if (agentsRes.success && agentsRes.data?.agents) {
        setAgents(agentsRes.data.agents.map(a => ({
          ...a,
          name: a.id.charAt(0).toUpperCase() + a.id.slice(1),
          emoji: { consul: '👑', annalist: '📚', curator: '🎯' }[a.id] || '🤖',
          description: (a.soul || '').split('\n')[0].replace(/^#\s*/, '').slice(0, 30),
          lastActivity: new Date(a.lastActivity),
        })));
      }
      if (tasksRes.success && tasksRes.data?.tasks) {
        const all = [...(tasksRes.data.tasks.active || []), ...(tasksRes.data.tasks.mercenary || [])];
        setTasks(all.map(t => ({
          id: t.id,
          title: t.title || t.topic || t.id,
          level: t.level || 'L0',
          status: t.status || 'pending',
          assignedAgent: t.assignedAgent || t.assigned_to || '-',
          progress: t.progress || (t.status === 'completed' ? 100 : 0),
        })));
      }
      if (senateRes.success && senateRes.data?.active) {
        setDeliberations(senateRes.data.active.map(d => ({
          id: d.id,
          topic: d.topic || d.title || d.id,
          phase: d.phase || 'Cogitatio',
          senators: d.senators?.length || 0,
          status: d.status === 'completed' ? '已完成' : '进行中',
        })));
      }
      if (statsRes.success && statsRes.data) {
        setCostToday(statsRes.data.totalCost || 0);
        setCostMonth(statsRes.data.totalCost || 0);
      }
      setLoading(false);
    });
  }, []);

  const onlineCount = agents.filter(a => a.status === 'online').length;
  const activeTasks = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div style={{ padding: '1.5rem', overflow: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#DAA520', margin: '0 0 0.5rem 0' }}>
          👑 指挥中心 (Curia)
        </h1>
        <p style={{ color: '#a0a0a0', margin: 0 }}>
          SPQA 组织架构命令中心 · 实时监控和控制
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div className="roman-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
          <div style={{ fontSize: '0.9rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>代理人在线</div>
          <div style={{ fontSize: '1.5rem', color: '#DAA520', fontWeight: 'bold' }}>
            {onlineCount}/{agents.length}
          </div>
        </div>

        <div className="roman-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
          <div style={{ fontSize: '0.9rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>进行中的任务</div>
          <div style={{ fontSize: '1.5rem', color: '#DAA520', fontWeight: 'bold' }}>
            {activeTasks}/{tasks.length}
          </div>
        </div>

        <div className="roman-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
          <div style={{ fontSize: '0.9rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>今日消耗</div>
          <div style={{ fontSize: '1.5rem', color: '#DAA520', fontWeight: 'bold' }}>
            {costToday}
          </div>
        </div>

        <div className="roman-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <div style={{ fontSize: '0.9rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>本月消耗</div>
          <div style={{ fontSize: '1.5rem', color: '#DAA520', fontWeight: 'bold' }}>
            {costMonth}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: 0, marginBottom: '1rem', color: '#e0e0e0' }}>
          快速操作
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="roman-btn" style={{ flex: '1', minWidth: '120px' }}>
            📋 新议题
          </button>
          <button className="roman-btn" style={{ flex: '1', minWidth: '120px' }}>
            ✅ 新任务
          </button>
          <button className="roman-btn" style={{ flex: '1', minWidth: '120px' }}>
            💼 佣兵派单
          </button>
          <button className="roman-btn" style={{ flex: '1', minWidth: '120px' }}>
            🔄 刷新数据
          </button>
        </div>
      </div>

      {/* Agent Status */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: 0, marginBottom: '1rem', color: '#e0e0e0' }}>
          代理人状态
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {agents.map(agent => (
            <div key={agent.id} className="roman-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{agent.emoji}</span>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#DAA520' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>
                      {agent.description}
                    </div>
                  </div>
                </div>
                <span
                  className={`status-indicator ${agent.status === 'online' ? 'online' : 'offline'}`}
                  title={agent.status === 'online' ? '在线' : '离线'}
                />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>
                最后活动: <span style={{ color: '#e0e0e0' }}>
                  {agent.lastActivity ? agent.lastActivity.toLocaleTimeString('zh-CN') : '未知'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Tasks Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: 0, marginBottom: '1rem', color: '#e0e0e0' }}>
          活跃任务 ({activeTasks})
        </h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {tasks.filter(t => t.status === 'in_progress').map(task => (
            <div key={task.id} className="roman-card" onClick={() => setSelectedTask(task.id)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`task-level l${task.level.toLowerCase().replace('l', '')}`}>
                    {task.level}
                  </span>
                  <span style={{ color: '#e0e0e0', fontWeight: '500' }}>{task.title}</span>
                </div>
                <span style={{ color: '#a0a0a0', fontSize: '0.85rem' }}>{task.assignedAgent}</span>
              </div>
              <div style={{
                backgroundColor: '#0f3460',
                height: '6px',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  backgroundColor: '#DAA520',
                  height: '100%',
                  width: `${task.progress}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a0a0a0', marginTop: '0.5rem', textAlign: 'right' }}>
                进度: {task.progress}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Deliberations */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: 0, marginBottom: '1rem', color: '#e0e0e0' }}>
          最近议题
        </h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {deliberations.map(dlib => (
            <div key={dlib.id} className="roman-card">
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#e0e0e0', marginBottom: '0.3rem' }}>
                  {dlib.topic}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>
                  阶段: <span style={{ color: '#DAA520' }}>{dlib.phase}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a0a0a0' }}>
                <span>元老: {dlib.senators}</span>
                <span>{dlib.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
