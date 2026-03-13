const React = window.React;
const { useState, useEffect } = window.React;

/**
 * Senatus (元老院)
 * Deliberation management with phase tracking
 */

const PHASES = ['Cogitatio', 'Contentio', 'Consensus', 'Decretum'];

export default function Senatus() {
  const [deliberations, setDeliberations] = useState([]);
  const [selectedDlib, setSelectedDlib] = useState(null);
  const [newTopic, setNewTopic] = useState('');
  const [selectedSenators, setSelectedSenators] = useState([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [availableSenators, setAvailableSenators] = useState([]);

  useEffect(() => {
    const api = window.spqaApi;
    if (!api) return;

    api.getActiveDeliberation().then(res => {
      if (res.success && res.data?.active?.length) {
        const mapped = res.data.active.map(d => ({
          id: d.id,
          topic: d.topic || d.title || d.id,
          phase: d.phase || 'Cogitatio',
          phaseIndex: PHASES.indexOf(d.phase || 'Cogitatio'),
          senators: d.senators || [],
          startedAt: new Date(d.started || d.startedAt || Date.now()),
          consultum: d.consultum || null,
          status: d.status || 'pending',
        }));
        setDeliberations(mapped);
        setSelectedDlib(mapped[0]);
      }
    });
    api.getAllAgents().then(res => {
      if (res.success && res.data?.agents) {
        setAvailableSenators(res.data.agents.map(a => a.id.charAt(0).toUpperCase() + a.id.slice(1)));
      }
    });
  }, []);

  const handleToggleSenator = (senator) => {
    setSelectedSenators(prev =>
      prev.includes(senator)
        ? prev.filter(s => s !== senator)
        : [...prev, senator]
    );
  };

  const handleCreateDeliberation = () => {
    if (newTopic.trim()) {
      const api = window.spqaApi;
      if (api) {
        api.startDeliberation(newTopic, selectedSenators.length > 0 ? selectedSenators : ['Consul']).then(res => {
          if (res.success && res.data?.deliberation) {
            const d = res.data.deliberation;
            const newDlib = {
              id: d.id,
              topic: d.topic,
              phase: d.phase || 'Cogitatio',
              phaseIndex: 0,
              senators: d.senators || selectedSenators,
              startedAt: new Date(d.started || Date.now()),
              consultum: null,
              status: 'pending',
            };
            setDeliberations([newDlib, ...deliberations]);
            setSelectedDlib(newDlib);
          }
        });
      }
      setNewTopic('');
      setSelectedSenators([]);
      setShowNewForm(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  return (
    <div style={{ padding: '1.5rem', overflow: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#DAA520', margin: '0 0 0.5rem 0' }}>
          ⚖️ 元老院 (Senatus)
        </h1>
        <p style={{ color: '#a0a0a0', margin: 0 }}>
          组织议题讨论与决议管理
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', height: '100%' }}>
        {/* Left: Deliberation List */}
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <button
              className="roman-btn"
              onClick={() => setShowNewForm(!showNewForm)}
              style={{ width: '100%' }}
            >
              {showNewForm ? '✕ 取消' : '➕ 新议题'}
            </button>
          </div>

          {/* New Deliberation Form */}
          {showNewForm && (
            <div className="roman-card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>
                  议题标题
                </label>
                <input
                  type="text"
                  placeholder="输入议题标题..."
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0f3460',
                    border: '1px solid #DAA520',
                    borderRadius: '4px',
                    color: '#e0e0e0',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateDeliberation()}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.75rem' }}>
                  邀请元老 (可选)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                  {availableSenators.map(senator => (
                    <button
                      key={senator}
                      onClick={() => handleToggleSenator(senator)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: selectedSenators.includes(senator) ? '#8B0000' : '#0f3460',
                        color: '#e0e0e0',
                        border: '1px solid #DAA520',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {senator}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="roman-btn"
                onClick={handleCreateDeliberation}
                disabled={!newTopic.trim()}
                style={{ width: '100%' }}
              >
                创建议题
              </button>
            </div>
          )}

          {/* Deliberations List */}
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {deliberations.map(dlib => (
              <div
                key={dlib.id}
                className="roman-card"
                onClick={() => setSelectedDlib(dlib)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedDlib?.id === dlib.id ? '#0f3460' : '',
                  borderColor: selectedDlib?.id === dlib.id ? '#8B0000' : '',
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#DAA520', marginBottom: '0.3rem' }}>
                    {dlib.topic}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>
                    {formatTime(dlib.startedAt)}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#a0a0a0' }}>
                  阶段: <span style={{ color: '#e0e0e0' }}>{dlib.phase}</span> | 元老: {dlib.senators.length}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Deliberation Details */}
        {selectedDlib && (
          <div>
            <div className="roman-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Topic */}
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #DAA520' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#DAA520', margin: 0, marginBottom: '0.5rem' }}>
                  {selectedDlib.topic}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>
                  {formatTime(selectedDlib.startedAt)}
                </div>
              </div>

              {/* Phase Progress */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.75rem' }}>
                  阶段进度
                </div>
                <div className="phase-bar">
                  {PHASES.map((phase, idx) => (
                    <div
                      key={phase}
                      className={`phase-segment ${idx <= selectedDlib.phaseIndex ? 'active' : ''}`}
                    >
                      {phase}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#DAA520', marginTop: '0.5rem' }}>
                  当前: {selectedDlib.phase}
                </div>
              </div>

              {/* Senators */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.75rem' }}>
                  参与元老
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedDlib.senators.map(senator => (
                    <span
                      key={senator}
                      style={{
                        backgroundColor: '#0f3460',
                        color: '#DAA520',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                      }}
                    >
                      {senator}
                    </span>
                  ))}
                </div>
              </div>

              {/* Senatus Consultum */}
              <div style={{ flex: 1, marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.75rem' }}>
                  Senatus Consultum (元老院咨询)
                </div>
                {selectedDlib.consultum ? (
                  <div
                    style={{
                      backgroundColor: '#0f3460',
                      padding: '1rem',
                      borderRadius: '4px',
                      border: '1px solid #DAA520',
                      color: '#e0e0e0',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      minHeight: '100px',
                    }}
                  >
                    {selectedDlib.consultum}
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: '#0f3460',
                      padding: '1rem',
                      borderRadius: '4px',
                      border: '1px dashed #DAA520',
                      color: '#a0a0a0',
                      fontSize: '0.9rem',
                      minHeight: '100px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    等待元老院决议...
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedDlib.status === 'in_progress' && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="roman-btn" style={{ flex: 1 }}>
                    → 下一阶段
                  </button>
                  <button className="roman-btn" style={{ flex: 1, backgroundColor: '#4a4a4a' }}>
                    ⊗ 终止议题
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
