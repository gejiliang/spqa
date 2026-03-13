const React = window.React;
const { useState, useEffect } = window.React;

/**
 * Tabularium (档案馆)
 * Archive search and historical record browser
 */

const MOCK_ARCHIVE = [
  {
    id: 'archive-1',
    type: 'decision',
    title: 'Senatus Consultum: Q1 2026战略',
    date: new Date('2026-03-01'),
    summary: '决议批准第一季度战略方向，重点聚焦市场拓展与产品优化。',
    creator: 'Consul',
  },
  {
    id: 'archive-2',
    type: 'task_completion',
    title: '任务完成报告: 用户体验优化',
    date: new Date('2026-02-28'),
    summary: '完成用户界面重设计，提升易用性30%。负责人: Curator。',
    creator: 'Annalist',
  },
  {
    id: 'archive-3',
    type: 'deliberation',
    title: '元老院议题: 组织扩展方案',
    date: new Date('2026-02-25'),
    summary: '讨论组织规模扩展的可行性和资源需求。',
    creator: 'Tribune',
  },
  {
    id: 'archive-4',
    type: 'decision',
    title: 'Senatus Consultum: 预算分配',
    date: new Date('2026-02-20'),
    summary: '批准2026年全年预算，总额500万积分。',
    creator: 'Consul',
  },
  {
    id: 'archive-5',
    type: 'task_completion',
    title: '任务完成报告: 系统升级',
    date: new Date('2026-02-15'),
    summary: '完成核心系统升级至v2.0，性能提升40%。',
    creator: 'Annalist',
  },
  {
    id: 'archive-6',
    type: 'deliberation',
    title: '元老院议题: 人才招聘计划',
    date: new Date('2026-02-10'),
    summary: '讨论Q1-Q2招聘计划和薪酬标准。',
    creator: 'Tribune',
  },
];

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
  const [archive, setArchive] = useState(MOCK_ARCHIVE);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [sortBy, setSortBy] = useState('date_desc');

  const filteredArchive = archive.filter(entry => {
    const typeMatch = filterType === 'all' || entry.type === filterType;
    const queryMatch = searchQuery === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && queryMatch;
  });

  const sortedArchive = [...filteredArchive].sort((a, b) => {
    if (sortBy === 'date_desc') {
      return b.date - a.date;
    } else if (sortBy === 'date_asc') {
      return a.date - b.date;
    } else if (sortBy === 'title') {
      return a.title.localeCompare(b.title, 'zh-CN');
    }
    return 0;
  });

  const formatDate = (date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div style={{ padding: '1.5rem', overflow: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#DAA520', margin: '0 0 0.5rem 0' }}>
          📚 档案馆 (Tabularium)
        </h1>
        <p style={{ color: '#a0a0a0', margin: 0 }}>
          历史决议与记录查询
        </p>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'grid',
        gap: '1rem',
        marginBottom: '2rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      }}>
        <div style={{ gridColumn: 'span 1' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>
            🔍 搜索
          </label>
          <input
            type="text"
            placeholder="搜索决议、任务、议题..."
            value={searchQuery}
            onChange={handleSearch}
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
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>
            🏷️ 类型
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#0f3460',
              border: '1px solid #DAA520',
              borderRadius: '4px',
              color: '#e0e0e0',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <option value="all">所有类型</option>
            <option value="decision">决议</option>
            <option value="task_completion">完成报告</option>
            <option value="deliberation">议题</option>
            <option value="policy">政策</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>
            🔤 排序
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#0f3460',
              border: '1px solid #DAA520',
              borderRadius: '4px',
              color: '#e0e0e0',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <option value="date_desc">最新优先</option>
            <option value="date_asc">最旧优先</option>
            <option value="title">按标题</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        backgroundColor: '#0f3460',
        borderRadius: '4px',
        color: '#a0a0a0',
        fontSize: '0.9rem',
      }}>
        找到 <span style={{ color: '#DAA520', fontWeight: 'bold' }}>{sortedArchive.length}</span> 条记录
      </div>

      {/* Archive List */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {sortedArchive.length > 0 ? (
          sortedArchive.map(entry => (
            <div
              key={entry.id}
              className="roman-card"
              onClick={() => setSelectedEntry(entry)}
              style={{
                cursor: 'pointer',
                borderColor: selectedEntry?.id === entry.id ? '#8B0000' : '',
              }}
            >
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {getTypeIcon(entry.type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#DAA520' }}>
                      {entry.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>
                      {formatDate(entry.date)} · {entry.creator}
                    </div>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.3rem 0.6rem',
                      backgroundColor: '#0f3460',
                      color: '#DAA520',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getTypeLabel(entry.type)}
                  </span>
                </div>
                <p style={{ color: '#a0a0a0', margin: '0.5rem 0 0 0', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  {entry.summary}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#a0a0a0',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <div style={{ fontSize: '1rem' }}>未找到匹配的记录</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              尝试调整搜索条件或过滤选项
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedEntry && (
        <div style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: '380px',
          height: '100%',
          backgroundColor: '#16213e',
          borderLeft: '2px solid #DAA520',
          padding: '1.5rem',
          overflowY: 'auto',
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>
                {getTypeIcon(selectedEntry.type)}
              </span>
              <h3 style={{ color: '#DAA520', margin: 0, fontSize: '1rem' }}>
                {getTypeLabel(selectedEntry.type)}
              </h3>
            </div>
            <button
              onClick={() => setSelectedEntry(null)}
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
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#e0e0e0', margin: '0 0 0.75rem 0', fontSize: '1.1rem' }}>
                {selectedEntry.title}
              </h4>
            </div>

            <div style={{
              display: 'grid',
              grid: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>
                  日期
                </div>
                <div style={{ color: '#DAA520', fontWeight: '500' }}>
                  {formatDate(selectedEntry.date)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>
                  记录者
                </div>
                <div style={{ color: '#DAA520', fontWeight: '500' }}>
                  {selectedEntry.creator}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>
                内容摘要
              </div>
              <p style={{
                color: '#e0e0e0',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                margin: 0,
                padding: '0.75rem',
                backgroundColor: '#0f3460',
                borderRadius: '4px',
                border: '1px solid #DAA520',
              }}>
                {selectedEntry.summary}
              </p>
            </div>

            <div style={{ borderTop: '1px solid #DAA520', paddingTop: '1rem' }}>
              <button className="roman-btn" style={{ width: '100%', marginBottom: '0.5rem' }}>
                查看全文
              </button>
              <button className="roman-btn" style={{ width: '100%', backgroundColor: '#4a4a4a' }}>
                导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
