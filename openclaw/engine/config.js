const path = require('path');
const fs = require('fs');
const os = require('os');

const projectRoot = path.resolve(__dirname, '..');
const defaultHome = fs.existsSync(path.join(projectRoot, 'agents'))
  ? projectRoot
  : path.join(os.homedir(), '.openclaw');

const config = {
  OPENCLAW_HOME: process.env.OPENCLAW_HOME || defaultHome,
  SPQA_HOME: process.env.SPQA_HOME || path.join(process.env.OPENCLAW_HOME || defaultHome, 'spqa'),
  ENGINE_PORT: parseInt(process.env.ENGINE_PORT || '3000', 10),
  ENGINE_HOST: process.env.ENGINE_HOST || '0.0.0.0',
  OPENCLAW_WS_URL: process.env.OPENCLAW_WS_URL || 'ws://localhost:18789',
  OPENCLAW_WS_RECONNECT_INTERVAL: 5000,
  OPENCLAW_WS_RECONNECT_MAX_ATTEMPTS: 3,
  FILE_WATCH_DEBOUNCE: 500,
  get CONFIG_OPENCLAW_PATH() { return path.join(this.OPENCLAW_HOME, 'openclaw.json'); },
  get CONFIG_SPQA_PATH() { return path.join(this.SPQA_HOME, 'config.yaml'); },
  get THEME_PATH() { return path.join(this.SPQA_HOME, 'themes', 'spqa-roman', 'theme.yaml'); },
  get AGENTS_PATH() { return path.join(this.OPENCLAW_HOME, 'agents'); },
  get WORKSPACE_PATH() { return path.join(this.OPENCLAW_HOME, 'agents', 'consul', 'workspace'); },
  get ACTIVE_TASKS_PATH() { return path.join(this.WORKSPACE_PATH, 'active'); },
  get MERCENARY_TASKS_PATH() { return path.join(this.WORKSPACE_PATH, 'mercenarii'); },
  get SESSIONS_PATH() { return path.join(this.OPENCLAW_HOME, 'sessions'); },
};

module.exports = config;
