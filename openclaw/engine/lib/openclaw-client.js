const WebSocket = require('ws');
const EventEmitter = require('events');
const config = require('../config');

class OpenClawClient extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.messageId = 0;
    this.pendingRequests = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(config.OPENCLAW_WS_URL);

        this.ws.on('open', () => {
          console.log(`Connected to OpenClaw Gateway at ${config.OPENCLAW_WS_URL}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data) => {
          this._handleMessage(data);
        });

        this.ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
        });

        this.ws.on('close', () => {
          console.log('Disconnected from OpenClaw Gateway');
          this.isConnected = false;
          this.emit('disconnected');
          this._scheduleReconnect();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= config.OPENCLAW_WS_RECONNECT_MAX_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${config.OPENCLAW_WS_RECONNECT_MAX_ATTEMPTS})...`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, config.OPENCLAW_WS_RECONNECT_INTERVAL);
  }

  _sendRaw(message) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        reject(new Error('Not connected to OpenClaw Gateway'));
        return;
      }

      const msgId = ++this.messageId;
      message.id = msgId;

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(msgId);
        reject(new Error('Request timeout'));
      }, 30000);

      this.pendingRequests.set(msgId, { resolve, reject, timeout });

      this.ws.send(JSON.stringify(message), (error) => {
        if (error) {
          this.pendingRequests.delete(msgId);
          clearTimeout(timeout);
          reject(error);
        }
      });
    });
  }

  _handleMessage(data) {
    try {
      const message = JSON.parse(data);

      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, timeout } = this.pendingRequests.get(message.id);
        this.pendingRequests.delete(message.id);
        clearTimeout(timeout);

        if (message.error) {
          resolve({ error: message.error });
        } else {
          resolve(message);
        }
      } else if (message.type === 'event') {
        this.emit('event', message);
      } else {
        this.emit('message', message);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  // OpenClaw Protocol Methods

  async sendMessage(agentId, message) {
    return this._sendRaw({
      method: 'sessions_send',
      params: {
        agent_id: agentId,
        message,
      },
    });
  }

  async spawnSession(prompt, options = {}) {
    return this._sendRaw({
      method: 'sessions_spawn',
      params: {
        prompt,
        ...options,
      },
    });
  }

  async listSessions() {
    return this._sendRaw({
      method: 'sessions_list',
      params: {},
    });
  }

  async getHistory(sessionKey, limit = 50) {
    return this._sendRaw({
      method: 'sessions_history',
      params: {
        session_key: sessionKey,
        limit,
      },
    });
  }

  async getAgentStatus(agentId) {
    return this._sendRaw({
      method: 'agent_status',
      params: {
        agent_id: agentId,
      },
    });
  }

  async listAgents() {
    return this._sendRaw({
      method: 'agents_list',
      params: {},
    });
  }

  async consulSubmitTask(taskData) {
    return this._sendRaw({
      method: 'consul_submit_task',
      params: taskData,
    });
  }

  async senateDeliberate(topic, senators = null) {
    const params = { topic };
    if (senators) {
      params.senators = senators;
    }
    return this._sendRaw({
      method: 'senate_deliberate',
      params,
    });
  }

  async senateGetStatus() {
    return this._sendRaw({
      method: 'senate_status',
      params: {},
    });
  }
}

module.exports = OpenClawClient;
