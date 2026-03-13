const React = window.React;
const { useState, useEffect } = window.React;

/**
 * Configuratio (配置)
 * Settings for OpenClaw config, SPQA config, and agent management
 */

const MOCK_OPENCLAW_CONFIG = {
  version: '1.0.0',
  engine: {
    api_port: 3000,
    ws_port: 3001,
    timeout: 30000,
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'spqa_db',
    pool_size: 20,
  },
  logging: {
    level: 'info',
    format: 'json',
  },
};

const MOCK_SPQA_CONFIG = {
  organization_name: 'SPQA 决策系统',
  theme: 'roman_dark',
  language: 'zh-CN',
  max_deliberation_time: 3600000,
  default_cost_per_task: 100,
  features: {
    deliberation_enabled: true,
    task_management_enabled: true,
    mercenary_tasks_enabled: true,
    analytics_enabled: true,
  },
};

const MOCK_AGENTS = [
  { id: 'consul', name: 'Consul', emoji: '👑', enabled: true, role: '最高决策者' },
  { id: 'annalist', name: 'Annalist', emoji: '📚', enabled: true, role: '历史记录员' },
  { id: 'curator', name: 'Curator', emoji: '🎯', enabled: true, role: '任务策展人' },
  { id: 'scribe', name: 'Scribe', emoji: '✍️', enabled: false, role: '书记官' },
  { id: 'tribune', name: 'Tribune', emoji: '⚡', enabled: false, role: '保民官' },
  { id: 'legatus', name: 'Legatus', emoji: '🏛️', enabled: false, role: '副官' },
];

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
    <div style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>
      {label}
    </div>
    {editable ? (
      <input
        type="text"
        defaultValue={value}
        style={{
          padding: '0.4rem 0.6rem',
          backgroundColor: '#0f3460',
          border: '1px solid #DAA520',
          borderRadius: '4px',
          color: '#e0e0e0',
          fontSize: '0.85rem',
          width: '200px',
          fontFamily: 'monospace',
        }}
      />
    ) : (
      <code style={{
        backgroundColor: '#0f3460',
        padding: '0.3rem 0.6rem',
        borderRadius: '4px',
        color: '#DAA520',
        fontSize: '0.8rem',
        fontFamily: 'monospace',
      }}>
        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
      </code>
    )}
  </div>
);

export default function Configuratio() {
  const [activeTab, setActiveTab] = useState('spqa');
  const [openclawConfig, setOpenclawConfig] = useState(MOCK_OPENCLAW_CONFIG);
  const [spqaConfig, setSPQAConfig] = useState(MOCK_SPQA_CONFIG);
  const [agents, setAgents] = useState(MOCK_AGENTS);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

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
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#DAA520', margin: '0 0 0.5rem 0' }}>
          ⚙️ 配置 (Configuratio)
        </h1>
        <p style={{ color: '#a0a0a0', margin: 0 }}>
          系统设置与配置管理
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #DAA520' }}>
        <TabButton name="spqa" label="SPQA 配置" icon="🏛️" />
        <TabButton name="openclaw" label="OpenClaw 配置" icon="⚙️" />
        <TabButton name="agents" label="代理人管理" icon="👥" />
        <TabButton name="theme" label="主题预览" icon="🎨" />
      </div>

      {/* Save Message */}
      {showSaveMessage && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#059669',
          color: 'white',
          borderRadius: '4px',
          marginBottom: '1rem',
          fontSize: '0.9rem',
        }}>
          ✓ 配置已保存
        </div>
      )}

      {/* SPQA Config Tab */}
      {activeTab === 'spqa' && (
        <div>
          <ConfigSection title="📋 基本设置">
            <ConfigItem label="组织名称" value={spqaConfig.organization_name} editable />
            <ConfigItem label="主题" value={spqaConfig.theme} editable />
            <ConfigItem label="语言" value={spqaConfig.language} editable />
            <ConfigItem label="最大议题时间 (ms)" value={spqaConfig.max_deliberation_time} editable />
            <ConfigItem label="默认任务成本" value={spqaConfig.default_cost_per_task} editable />
          </ConfigSection>

          <ConfigSection title="✨ 功能开关">
            {Object.entries(spqaConfig.features).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>
                  {key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                </div>
                <div style={{
                  display: 'inline-flex',
                  width: '50px',
                  height: '24px',
                  backgroundColor: value ? '#059669' : '#4a4a4a',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  padding: '2px',
                  alignItems: 'center',
                  justifyContent: value ? 'flex-end' : 'flex-start',
                  transition: 'all 0.3s ease',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '50%',
                  }} />
                </div>
              </div>
            ))}
          </ConfigSection>

          <button className="roman-btn" onClick={handleSaveConfig} style={{ width: '100%' }}>
            💾 保存配置
          </button>
        </div>
      )}

      {/* OpenClaw Config Tab */}
      {activeTab === 'openclaw' && (
        <div>
          <ConfigSection title="🖥️ 引擎设置">
            <ConfigItem label="API 端口" value={openclawConfig.engine.api_port} />
            <ConfigItem label="WebSocket 端口" value={openclawConfig.engine.ws_port} />
            <ConfigItem label="超时 (ms)" value={openclawConfig.engine.timeout} />
          </ConfigSection>

          <ConfigSection title="🗄️ 数据库设置">
            <ConfigItem label="主机" value={openclawConfig.database.host} />
            <ConfigItem label="端口" value={openclawConfig.database.port} />
            <ConfigItem label="数据库名" value={openclawConfig.database.name} />
            <ConfigItem label="连接池大小" value={openclawConfig.database.pool_size} />
          </ConfigSection>

          <ConfigSection title="📊 日志设置">
            <ConfigItem label="日志级别" value={openclawConfig.logging.level} editable />
            <ConfigItem label="日志格式" value={openclawConfig.logging.format} editable />
          </ConfigSection>

          <div style={{
            padding: '1rem',
            backgroundColor: '#0f3460',
            borderRadius: '4px',
            border: '1px solid #DAA520',
            marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.75rem' }}>
              JSON 完整配置
            </div>
            <pre style={{
              color: '#DAA520',
              fontSize: '0.75rem',
              overflow: 'auto',
              margin: 0,
              fontFamily: 'monospace',
            }}>
              {JSON.stringify(openclawConfig, null, 2)}
            </pre>
          </div>

          <button className="roman-btn" onClick={handleSaveConfig} style={{ width: '100%' }}>
            💾 保存配置
          </button>
        </div>
      )}

      {/* Agents Tab */}
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
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#DAA520' }}>
                          {agent.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#a0a0a0' }}>
                          {agent.role}
                        </div>
                      </div>
                    </div>
                    <div
                      onClick={() => handleToggleAgent(agent.id)}
                      style={{
                        display: 'inline-flex',
                        width: '50px',
                        height: '24px',
                        backgroundColor: agent.enabled ? '#059669' : '#4a4a4a',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        padding: '2px',
                        alignItems: 'center',
                        justifyContent: agent.enabled ? 'flex-end' : 'flex-start',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '50%',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#0f3460',
              borderRadius: '4px',
              border: '1px dashed #DAA520',
            }}>
              <div style={{ fontSize: '0.85rem', color: '#DAA520', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ℹ️ 提示
              </div>
              <div style={{ fontSize: '0.8rem', color: '#a0a0a0', lineHeight: '1.5' }}>
                启用/禁用代理人将影响系统可用功能。Consul 始终处于启用状态。
              </div>
            </div>
          </ConfigSection>

          <button className="roman-btn" onClick={handleSaveConfig} style={{ width: '100%' }}>
            💾 保存配置
          </button>
        </div>
      )}

      {/* Theme Preview Tab */}
      {activeTab === 'theme' && (
        <div>
          <ConfigSection title="🎨 当前主题: Roman Dark">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                backgroundColor: '#1a1a2e',
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid #DAA520',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>
                  背景主色
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e0e0e0' }}>
                  #1a1a2e
                </div>
              </div>

              <div style={{
                backgroundColor: '#16213e',
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid #DAA520',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>
                  表面色
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e0e0e0' }}>
                  #16213e
                </div>
              </div>

              <div style={{
                backgroundColor: '#8B0000',
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid #DAA520',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>
                  强调红色
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e0e0e0' }}>
                  #8B0000
                </div>
              </div>

              <div style={{
                backgroundColor: '#0f3460',
                padding: '1rem',
                borderRadius: '4px',
                border: '2px solid #DAA520',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>
                  强调金色
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#DAA520' }}>
                  #DAA520
                </div>
              </div>
            </div>

            <div className="roman-card" style={{ backgroundColor: '#0f3460' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#DAA520', marginBottom: '0.75rem' }}>
                文本颜色样例
              </div>
              <div style={{ color: '#e0e0e0', marginBottom: '0.5rem' }}>
                默认文本 (#e0e0e0) - 用于主要内容
              </div>
              <div style={{ color: '#a0a0a0', marginBottom: '0.5rem' }}>
                次要文本 (#a0a0a0) - 用于说明和标签
              </div>
              <div style={{ color: '#DAA520' }}>
                强调文本 (#DAA520) - 用于重点和交互
              </div>
            </div>
          </ConfigSection>

          <ConfigSection title="🔘 组件预览">
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <button className="roman-btn" style={{ width: '100%' }}>
                标准按钮
              </button>
              <button className="roman-btn" disabled style={{ width: '100%' }}>
                禁用按钮
              </button>
              <div className="roman-card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span className="status-indicator online" /> 在线状态
              </div>
              <div className="roman-card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span className="status-indicator offline" /> 离线状态
              </div>
            </div>
          </ConfigSection>
        </div>
      )}
    </div>
  );
}
