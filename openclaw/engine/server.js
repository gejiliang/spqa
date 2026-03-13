const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// === JSON5-lite parser (handle trailing commas + comments) ===
function parseJSON5(text) {
  const cleaned = text
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/,\s*([\]}])/g, '$1');
  return JSON.parse(cleaned);
}

// === YAML-lite parser (simple key: value) ===
function parseYAML(text) {
  try {
    const lines = text.split('\n');
    const result = {};
    let currentObj = result;
    let stack = [{ obj: result, indent: -1 }];
    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
      const indent = line.search(/\S/);
      const match = line.match(/^(\s*)([^:]+):\s*(.*)/);
      if (!match) continue;
      const [, , key, val] = match;
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
      currentObj = stack[stack.length - 1].obj;
      const trimVal = val.trim().replace(/^["']|["']$/g, '');
      if (trimVal === '' || trimVal === '|' || trimVal === '>') {
        currentObj[key.trim()] = {};
        stack.push({ obj: currentObj[key.trim()], indent });
      } else if (trimVal.startsWith('[') || trimVal.startsWith('{')) {
        try { currentObj[key.trim()] = JSON.parse(trimVal); } catch { currentObj[key.trim()] = trimVal; }
      } else if (trimVal === 'true') currentObj[key.trim()] = true;
      else if (trimVal === 'false') currentObj[key.trim()] = false;
      else if (!isNaN(trimVal) && trimVal !== '') currentObj[key.trim()] = Number(trimVal);
      else currentObj[key.trim()] = trimVal;
    }
    return result;
  } catch { return {}; }
}

// === File helpers ===
function safeRead(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function readJSON(p) { const t = safeRead(p); return t ? parseJSON5(t) : null; }
function readYAML(p) { const t = safeRead(p); return t ? parseYAML(t) : null; }

function listYAML(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map(f => { try { return { id: path.basename(f, path.extname(f)), ...readYAML(path.join(dir, f)) }; } catch { return null; } })
    .filter(Boolean);
}

function listAgentDirs() {
  const agentsDir = config.AGENTS_PATH;
  if (!fs.existsSync(agentsDir)) return [];
  return fs.readdirSync(agentsDir).filter(d => {
    const fp = path.join(agentsDir, d);
    return fs.statSync(fp).isDirectory() && fs.existsSync(path.join(fp, 'SOUL.md'));
  });
}

function readAgentSoul(agentId) {
  const p = path.join(config.AGENTS_PATH, agentId, 'SOUL.md');
  return safeRead(p);
}

// === API Router ===
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

async function handleRequest(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') { sendJSON(res, {}); return; }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;
  const q = Object.fromEntries(url.searchParams);

  try {
    // === Agents ===
    if (p === '/api/agents' && req.method === 'GET') {
      const agents = listAgentDirs().map(id => ({
        id,
        status: 'online',
        soul: readAgentSoul(id)?.substring(0, 200) || '',
        lastActivity: new Date().toISOString(),
      }));
      return sendJSON(res, { agents, total: agents.length });
    }

    if (p.match(/^\/api\/agents\/([^/]+)$/) && req.method === 'GET') {
      const id = p.split('/')[3];
      const soul = readAgentSoul(id);
      if (!soul) return sendJSON(res, { error: 'Agent not found' }, 404);
      return sendJSON(res, { agent: { id, soul, status: 'online' } });
    }

    // === Senate ===
    if (p === '/api/senate/deliberate' && req.method === 'POST') {
      const body = await parseBody(req);
      return sendJSON(res, {
        deliberation: { id: `delib-${Date.now()}`, topic: body.topic, senators: body.senators, phase: 'cogitatio', started: new Date().toISOString() },
        message: 'Deliberation initiated (OpenClaw Gateway required for actual execution)',
      });
    }

    if (p === '/api/senate/active' && req.method === 'GET') {
      const active = listYAML(config.ACTIVE_TASKS_PATH).filter(t => t.type === 'deliberation');
      return sendJSON(res, { active, total: active.length });
    }

    if (p === '/api/senate/history' && req.method === 'GET') {
      return sendJSON(res, { deliberations: [], total: 0 });
    }

    // === Tasks ===
    if (p === '/api/tasks' && req.method === 'GET') {
      const active = listYAML(config.ACTIVE_TASKS_PATH);
      const mercenary = listYAML(config.MERCENARY_TASKS_PATH);
      return sendJSON(res, { tasks: { active, mercenary }, total: active.length + mercenary.length });
    }

    if (p === '/api/tasks' && req.method === 'POST') {
      const body = await parseBody(req);
      return sendJSON(res, {
        task: { id: `task-${Date.now()}`, ...body, status: 'submitted', created: new Date().toISOString() },
        message: 'Task submitted (OpenClaw Gateway required for routing)',
      });
    }

    // === Mercenary ===
    if (p === '/api/mercenarii' && req.method === 'GET') {
      const tasks = listYAML(config.MERCENARY_TASKS_PATH);
      return sendJSON(res, { mercenarii: tasks, total: tasks.length });
    }

    if (p === '/api/mercenarii/stats' && req.method === 'GET') {
      const tasks = listYAML(config.MERCENARY_TASKS_PATH);
      const totalCost = tasks.reduce((s, t) => s + (t.cost_usd || 0), 0);
      return sendJSON(res, {
        total: tasks.length, totalCost, averageCost: tasks.length ? totalCost / tasks.length : 0,
        successRate: tasks.length ? (tasks.filter(t => t.status === 'completed').length / tasks.length * 100) : 0,
      });
    }

    // === Config ===
    if (p === '/api/config/openclaw' && req.method === 'GET') {
      const data = readJSON(config.CONFIG_OPENCLAW_PATH);
      return sendJSON(res, data || { error: 'Config not found' });
    }

    if (p === '/api/config/spqa' && req.method === 'GET') {
      const data = readYAML(config.CONFIG_SPQA_PATH);
      return sendJSON(res, data || { error: 'Config not found' });
    }

    // === Theme ===
    if (p === '/api/theme' && req.method === 'GET') {
      const data = readYAML(config.THEME_PATH);
      return sendJSON(res, data || { roles: {} });
    }

    if (p === '/api/theme/roles' && req.method === 'GET') {
      const data = readYAML(config.THEME_PATH);
      return sendJSON(res, { roles: data?.roles || {} });
    }

    // === Health ===
    if (p === '/api/health' || p === '/health') {
      return sendJSON(res, {
        status: 'ok',
        version: '0.1.0',
        openclaw_home: config.OPENCLAW_HOME,
        agents: listAgentDirs(),
        timestamp: new Date().toISOString(),
      });
    }

    // 404
    sendJSON(res, { error: `Not found: ${p}` }, 404);
  } catch (err) {
    console.error(`Error handling ${p}:`, err);
    sendJSON(res, { error: err.message }, 500);
  }
}

// === Start ===
const server = http.createServer(handleRequest);

server.listen(config.ENGINE_PORT, config.ENGINE_HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║     S·P·Q·A · Engine API Server v0.1.0           ║
╠══════════════════════════════════════════════════╣
║  API:  http://${config.ENGINE_HOST}:${config.ENGINE_PORT}                       ║
║  Home: ${config.OPENCLAW_HOME.substring(0, 40).padEnd(40)} ║
║  Agents: ${listAgentDirs().join(', ').padEnd(38)} ║
╚══════════════════════════════════════════════════╝
  `);
});

process.on('SIGINT', () => { console.log('\nShutdown'); process.exit(0); });
