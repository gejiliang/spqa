const React = window.React;
const { useState, useEffect } = window.React;

/**
 * Configuratio (配置)
 * Settings for OpenClaw config, SPQA config, and agent management
 */

const ConfigSection = ({ title, children }) => (
  <div className="roman-card" style={{ marginBottom: '1.5rem' }}>
    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#DAA520', margin: '0 0 1rem 0' }}>
      {title}
    </h3>
    {children}
  </div>
);

const ConfigItem = ({ label, value, editable = false }) => (
  <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>{label}</div>
    {editable ? (
      <input
        type="text"
        defaultValue={value}
        style={{
          padding: '0.4rem 0.6rem', backgroundColor: '#0f3460',
          border: '1px solid #DAA520', borderRadius: '4px', color: '#e0e0e0',
          fontSize: '0.85rem', width: '200px', fontFamily: 'monospace',
        }}
      />
    ) : (
      <code style={{
        backgroundColor: '#0f3460', padding: '0.3rem 0.6rem', borderRadius: '4px',
        color: '#DAA520', fontSize: '0.8rem', fontFamily: 'monospace',
      }}>
        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
      </code>
    )}
  </div>
);

export default function Configuratio() {
  const [activeTab, setActiveTab] = useState('spqa');
  const [openclawConfig, setOpenclawConfig] = useState({});
  const [spqaConfig, setSPQAConfig] = useState({});
  const [agents, setAgents] = useState([]);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  useEffect(() => {
    const api = window.spqaApi;
    if (!api) return;

    api.getOpenclawConfig().then(res => { if (res.success) setOpenclawConfig(res.data); });
    api.getSPQAConfig().then(res => { if (res.success) setSPQAConfig(res.data); });
    api.getAllAgents().then(res => {
      if (res.success && res.data?.agents) {
        setAgents(res.data.agents.map(a => ({
          id: a.id,
          name: a.id.charAt(0).toUpperCase() + a.id.slice(1),
          emoji: { consul: '👑', annalist: '📚', curator: '🎯' }[a.id] || '🤖',
          enabled: true,
          role: (a.soul || '').split('\n')[0].replace(/^#\s*/, '').slice(0, 20),
        })));
      }
    });
  }, []);

  const handleToggleAgent = (agentId) => {
    setAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const handleSaveConfig = () => {
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 2000);
  };

  const TabButton = ({ name, label, icon }) => (
    <button
      onClick={() => setActiveTab(name)}
      style={{
        padding: '0.75rem 1.25rem',
        backgroundColor: activeTab === name ? '#8B0000' : 'transparent',
        color: activeTab === name ? '#DAA520' : '#a0a0a0',
        border: activeTab === name ? '1px solid #DAA520' : '1px solid transparent',
        borderRadius: '4px 4px 0 0',
        cursor: 'pointer',
        fontWeight: activeTab === name ? 'bold' : 'normal',
        transition: 'all 0.3s ease',
        fontSize: '0.9rem',
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div style={{ padding: '1.5rem', overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#DAA520', margin: '0 0 0.5rem 0' }}>
          ⚙️ 配置 (Configuratio)
        </h1>
        <p style={{ color: '#a0a0a0', margin: 0 }}>系统设置与配置管理</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #DAA520' }}>
        <TabButton name="spqa" label="SPQA 配置" icon="🏛️" />
        <TabButton name="openclaw" label="OpenClaw 配置" icon="⚙️" />
        <TabButton name="agents" label="代理人管理" icon="👥" />
        <TabButton name="theme" label="主题预览" icon="🎨" />
      </div>

      {showSaveMessage && (
        <div style={{
          padding: '0.75rem 1rem', backgroundColor: '#059669', color: 'white',
          borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem',
        }}>
          ✓ 配置已保存
        </div>
      )}

      {activeTab === 'spqa' && (
        <div>
          <ConfigSection title="📋 基本设置">
            <ConfigItem label="组织名称" value={spqaConfig.organization_name || '-'} editable />
            <ConfigItem label="主题" value={spqaConfig.theme || '-'} editable />
            <ConfigItem label="语言" value={spqaConfig.language || '-'} editable />
          </ConfigSection>
          <button className="roman-btn" onClick={handleSaveConfig} style={{ width: '100%' }}>
            💾 保存配置
          </button>
        </div>
      )}

      {activeTab === 'openclaw' && (
        <div>
          <ConfigSection title="🖥️ OpenClaw 配置">
            <div style={{
              padding: '1rem', backgroundColor: '#0f3460', borderRadius: '4px',
              border: '1px solid #DAA520',
            }}>
              <pre style={{
                color: '#DAA520', fontSize: '0.75rem', overflow: 'auto',
                margin: 0, fontFamily: 'monospace',
              }}>
                {JSON.stringify(openclawConfig, null, 2)}
              </pre>
            </div>
          </ConfigSection>
        </div>
      )}

      {activeTab === 'agents' && (
        <div>
          <ConfigSection title="👥 代理人角色管理">
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {agents.map(agent => (
                <div key={agent.id} className="roman-card" style={{ padding: '0.75rem', backgroundColor: '#0f3460' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{agent.emoji}</span>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#DAA520' }}>{agent.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#a0a0a0' }}>{agent.role}</div>
                      </div>
                    </div>
                    <div
                      onClick={() => handleToggleAgent(agent.id)}
                      style={{
                        display: 'inline-flex', width: '50px', height: '24px',
                        backgroundColor: agent.enabled ? '#059669' : '#4a4a4a',
                        borderRadius: '12px', cursor: 'pointer', padding: '2px',
                        alignItems: 'center', justifyContent: agent.enabled ? 'flex-end' : 'flex-start',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{ width: '20px', height: '20px', backgroundColor: '#e0e0e0', borderRadius: '50%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ConfigSection>
        </div>
      )}

      {activeTab === 'theme' && (
        <div>
          <ConfigSection title="🎨 当前主题: Roman Dark">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {[
                { bg: '#1a1a2e', name: '背景主色', hex: '#1a1a2e', color: '#e0e0e0' },
                { bg: '#16213e', name: '表面色', hex: '#16213e', color: '#e0e0e0' },
                { bg: '#8B0000', name: '强调红色', hex: '#8B0000', color: '#e0e0e0' },
                { bg: '#0f3460', name: '强调金色', hex: '#DAA520', color: '#DAA520' },
              ].map(c => (
                <div key={c.hex} style={{
                  backgroundColor: c.bg, padding: '1rem', borderRadius: '4px',
                  border: '1px solid #DAA520',
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>{c.name}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: c.color }}>{c.hex}</div>
                </div>
              ))}
            </div>
          </ConfigSection>
        </div>
      )}
    </div>
  );
}
