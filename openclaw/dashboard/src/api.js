/**
 * API Client for SPQA Engine Server
 * Endpoints aligned with engine/server.js
 */

const API_BASE = 'http://localhost:3000/api';
const API_TIMEOUT = 5000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function apiCall(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetchWithTimeout(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`API Error at ${endpoint}:`, error);
    return { success: false, error: error.message };
  }
}

// ===== Agents =====
// GET /api/agents
export async function getAllAgents() {
  return apiCall('/agents');
}

// GET /api/agents/:id
export async function getAgent(agentId) {
  return apiCall(`/agents/${agentId}`);
}

// GET /api/agents/:id/history
export async function getAgentHistory(agentId, limit = 50) {
  return apiCall(`/agents/${agentId}/history?limit=${limit}`);
}

// ===== Senate =====
// POST /api/senate/deliberate
export async function startDeliberation(topic, senators = []) {
  return apiCall('/senate/deliberate', {
    method: 'POST',
    body: JSON.stringify({ topic, senators }),
  });
}

// GET /api/senate/active
export async function getActiveDeliberation() {
  return apiCall('/senate/active');
}

// GET /api/senate/history
export async function getDeliberationHistory(limit = 20) {
  return apiCall(`/senate/history?limit=${limit}`);
}

// ===== Tasks =====
// POST /api/tasks
export async function createTask(taskData) {
  return apiCall('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

// GET /api/tasks
export async function getAllTasks() {
  return apiCall('/tasks');
}

// GET /api/tasks/:id
export async function getTask(taskId) {
  return apiCall(`/tasks/${taskId}`);
}

// ===== Mercenary =====
// GET /api/mercenarii
export async function getMercenaryTasks() {
  return apiCall('/mercenarii');
}

// GET /api/mercenarii/stats
export async function getMercenaryStats() {
  return apiCall('/mercenarii/stats');
}

// ===== Configuration =====
// GET /api/config/openclaw
export async function getOpenclawConfig() {
  return apiCall('/config/openclaw');
}

// PUT /api/config/openclaw
export async function updateOpenclawConfig(config) {
  return apiCall('/config/openclaw', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

// GET /api/config/spqa
export async function getSPQAConfig() {
  return apiCall('/config/spqa');
}

// PUT /api/config/spqa
export async function updateSPQAConfig(config) {
  return apiCall('/config/spqa', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

// ===== Theme =====
// GET /api/theme
export async function getTheme() {
  return apiCall('/theme');
}

// GET /api/theme/roles
export async function getThemeRoles() {
  return apiCall('/theme/roles');
}

// ===== WebSocket =====
export class SPQAWebSocket {
  constructor(onMessage, onError) {
    this.onMessage = onMessage;
    this.onError = onError;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect() {
    try {
      this.ws = new WebSocket('ws://localhost:4000');
      this.ws.onopen = () => {
        console.log('SPQA WebSocket connected');
        this.reconnectAttempts = 0;
      };
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (this.onMessage) this.onMessage(message);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };
      this.ws.onerror = (error) => {
        if (this.onError) this.onError(error);
      };
      this.ws.onclose = () => this.attemptReconnect();
    } catch (error) {
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default {
  getAllAgents,
  getAgent,
  getAgentHistory,
  startDeliberation,
  getActiveDeliberation,
  getDeliberationHistory,
  createTask,
  getAllTasks,
  getTask,
  getMercenaryTasks,
  getMercenaryStats,
  getOpenclawConfig,
  updateOpenclawConfig,
  getSPQAConfig,
  updateSPQAConfig,
  getTheme,
  getThemeRoles,
  SPQAWebSocket,
};
