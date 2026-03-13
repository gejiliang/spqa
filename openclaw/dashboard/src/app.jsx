const React = window.React;
const { useState, useEffect } = window.React;

// Import pages
// Dynamic imports via script tags in HTML
const Curia = window.Curia || (() => <div>Loading Curia...</div>);
const Senatus = window.Senatus || (() => <div>Loading Senatus...</div>);
const Castra = window.Castra || (() => <div>Loading Castra...</div>);
const Tabularium = window.Tabularium || (() => <div>Loading Tabularium...</div>);
const Configuratio = window.Configuratio || (() => <div>Loading Configuratio...</div>);

/**
 * Main App Component
 * Provides layout with sidebar navigation and main content area
 */
export default function App() {
  const [currentPage, setCurrentPage] = useState('Curia');
  const [isConnected, setIsConnected] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pages = [
    {
      id: 'Curia',
      name: '指挥中心',
      emoji: '👑',
      latin: 'Curia',
      description: '命令与控制',
    },
    {
      id: 'Senatus',
      name: '元老院',
      emoji: '⚖️',
      latin: 'Senatus',
      description: '议题与决议',
    },
    {
      id: 'Castra',
      name: '军营',
      emoji: '⚔️',
      latin: 'Castra',
      description: '任务管理',
    },
    {
      id: 'Tabularium',
      name: '档案馆',
      emoji: '📚',
      latin: 'Tabularium',
      description: '历史记录',
    },
    {
      id: 'Configuratio',
      name: '配置',
      emoji: '⚙️',
      latin: 'Configuratio',
      description: '系统设置',
    },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'Curia':
        return <Curia />;
      case 'Senatus':
        return <Senatus />;
      case 'Castra':
        return <Castra />;
      case 'Tabularium':
        return <Tabularium />;
      case 'Configuratio':
        return <Configuratio />;
      default:
        return <Curia />;
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '250px 1fr',
      gridTemplateRows: '60px 1fr',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#1a1a2e',
      color: '#e0e0e0',
      fontFamily: 'system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Top Status Bar */}
      <div style={{
        gridColumn: '1 / -1',
        gridRow: 1,
        backgroundColor: '#0f3460',
        borderBottom: '1px solid #DAA520',
        padding: '0 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Left: Logo and title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem' }}>🏛️</div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#DAA520' }}>
              SPQA 指挥中心
            </div>
            <div style={{ fontSize: '0.7rem', color: '#a0a0a0' }}>
              AI-Native Organizational Architecture
            </div>
          </div>
        </div>

        {/* Right: Status and time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem' }}>
            <div style={{ color: '#a0a0a0', marginBottom: '0.2rem' }}>
              API 状态
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`} />
              <span style={{ fontSize: '0.8rem', color: isConnected ? '#4ade80' : '#ef4444' }}>
                {isConnected ? '已连接' : '离线'}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', borderLeft: '1px solid #DAA520', paddingLeft: '1.5rem' }}>
            <div style={{ color: '#a0a0a0', marginBottom: '0.2rem' }}>
              当前时间
            </div>
            <div style={{ fontSize: '0.9rem', color: '#DAA520', fontWeight: '500' }}>
              {time.toLocaleTimeString('zh-CN')}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div style={{
        gridColumn: 1,
        gridRow: 2,
        backgroundColor: '#16213e',
        borderRight: '1px solid #DAA520',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '1.5rem 1rem',
          borderBottom: '1px solid #DAA520',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            导航菜单
          </div>
        </div>

        {/* Navigation Items */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.75rem' }}>
          {pages.map(page => (
            <div
              key={page.id}
              onClick={() => setCurrentPage(page.id)}
              className="sidebar-nav-item"
              style={{
                backgroundColor: currentPage === page.id ? '#0f3460' : 'transparent',
                borderLeftColor: currentPage === page.id ? '#8B0000' : 'transparent',
                color: currentPage === page.id ? '#DAA520' : '#a0a0a0',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{page.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: currentPage === page.id ? 'bold' : 'normal' }}>
                  {page.name}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.1rem' }}>
                  {page.latin}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #DAA520',
          fontSize: '0.75rem',
          color: '#a0a0a0',
          textAlign: 'center',
        }}>
          <div>SPQA v0.1.0 MVP</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
            Powered by OpenClaw
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        gridColumn: 2,
        gridRow: 2,
        backgroundColor: '#1a1a2e',
        overflow: 'auto',
      }}>
        <div style={{ height: '100%', width: '100%' }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
