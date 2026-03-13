const React = window.React;
const { useState, useEffect } = window.React;

/**
 * Tabularium (档案馆)
 * Archive search and historical record browser
 */

const getTypeIcon = (type) => {
  const icons = {
    'decision': '⚖️',
    'task_completion': '✅',
    'deliberation': '💬',
    'policy': '📜',
  };
  return icons[type] || '📄';
};

const getTypeLabel = (type) => {
  const labels = {
    'decision': '决议',
    'task_completion': '完成报告',
    'deliberation': '议题',
    'policy': '政策',
  };
  return labels[type] || '记录';
};

export default function Tabularium() {
  const [archive, setArchive] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    const api = window.spqaApi;
    if (!api) return;

    api.getDeliberationHistory().then(res => {
      if (res.success && res.data?.deliberations?.length) {
        setArchive(res.data.deliberations.map(d => ({
          id: d.id,
          type: 'deliberation',
          title: d.topic || d.title || d.id,
          date: new Date(d.date || d.started || Date.now()),
          summary: d.consultum || d.summary || '',
          creator: d.creator || 'Consul',
        })));
      }
    });
  }, []);

  const filteredArchive = archive.filter(entry => {
    const typeMatch = filterType === 'all' || entry.type === filterType;
    const queryMatch = searchQuery === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && queryMatch;
  });

  const sortedArchive = [...filteredArchive].sort((a, b) => {
    if (sortBy === 'date_desc') return b.date - a.date;
    if (sortBy === 'date_asc') return a.date - b.date;
    if (sortBy === 'title') return a.title.localeCompare(b.title, 'zh-CN');
    return 0;
  });

  const formatDate = (date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div style={{ padding: '1.5rem', overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#DAA520', margin: '0 0 0.5rem 0' }}>
          📚 档案馆 (Tabularium)
        </h1>
        <p style={{ color: '#a0a0a0', margin: 0 }}>历史决议与记录查询</p>
      </div>

      <div style={{
        display: 'grid',
        gap: '1rem',
        marginBottom: '2rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>🔍 搜索</label>
          <input
            type="text"
            placeholder="搜索决议、任务、议题..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '0.75rem', backgroundColor: '#0f3460',
              border: '1px solid #DAA520', borderRadius: '4px', color: '#e0e0e0',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>🏷️ 类型</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{
            width: '100%', padding: '0.75rem', backgroundColor: '#0f3460',
            border: '1px solid #DAA520', borderRadius: '4px', color: '#e0e0e0',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <option value="all">所有类型</option>
            <option value="decision">决议</option>
            <option value="task_completion">完成报告</option>
            <option value="deliberation">议题</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>🔤 排序</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{
            width: '100%', padding: '0.75rem', backgroundColor: '#0f3460',
            border: '1px solid #DAA520', borderRadius: '4px', color: '#e0e0e0',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <option value="date_desc">最新优先</option>
            <option value="date_asc">最旧优先</option>
            <option value="title">按标题</option>
          </select>
        </div>
      </div>

      <div style={{
        marginBottom: '1.5rem', padding: '0.75rem 1rem',
        backgroundColor: '#0f3460', borderRadius: '4px', color: '#a0a0a0', fontSize: '0.9rem',
      }}>
        找到 <span style={{ color: '#DAA520', fontWeight: 'bold' }}>{sortedArchive.length}</span> 条记录
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {sortedArchive.length > 0 ? (
          sortedArchive.map(entry => (
            <div key={entry.id} className="roman-card" onClick={() => setSelectedEntry(entry)}
              style={{ cursor: 'pointer', borderColor: selectedEntry?.id === entry.id ? '#8B0000' : '' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(entry.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#DAA520' }}>{entry.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>
                      {formatDate(entry.date)} · {entry.creator}
                    </div>
                  </div>
                  <span style={{
                    display: 'inline-block', padding: '0.3rem 0.6rem', backgroundColor: '#0f3460',
                    color: '#DAA520', borderRadius: '4px', fontSize: '0.75rem', whiteSpace: 'nowrap',
                  }}>{getTypeLabel(entry.type)}</span>
                </div>
                <p style={{ color: '#a0a0a0', margin: '0.5rem 0 0 0', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  {entry.summary}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a0a0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <div>未找到匹配的记录</div>
          </div>
        )}
      </div>
    </div>
  );
}
