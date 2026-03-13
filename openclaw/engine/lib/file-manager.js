const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const chokidar = require('chokidar');
const config = require('../config');

class FileManager {
  constructor() {
    this.watchers = new Map();
    this.debounceTimers = new Map();
  }

  // Generic file reading with format detection
  readFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.json' || ext === '.json5') {
      try {
        return JSON.parse(content);
      } catch (error) {
        throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
      }
    } else if (ext === '.yaml' || ext === '.yml') {
      try {
        return yaml.parse(content);
      } catch (error) {
        throw new Error(`Invalid YAML in ${filePath}: ${error.message}`);
      }
    }

    return content;
  }

  // Generic file writing with format detection
  writeFile(filePath, data) {
    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let content;
    if (ext === '.json' || ext === '.json5') {
      content = JSON.stringify(data, null, 2);
    } else if (ext === '.yaml' || ext === '.yml') {
      content = yaml.stringify(data, { indent: 2, lineWidth: 0 });
    } else {
      content = data;
    }

    fs.writeFileSync(filePath, content, 'utf8');
  }

  // Configuration reading
  readConfig(filePath) {
    return this.readFile(filePath);
  }

  // Configuration writing with validation
  writeConfig(filePath, data) {
    // Validate JSON/YAML before writing
    try {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.json' || ext === '.json5') {
        JSON.stringify(data);
      } else if (ext === '.yaml' || ext === '.yml') {
        yaml.stringify(data);
      }
    } catch (error) {
      throw new Error(`Invalid data format: ${error.message}`);
    }

    this.writeFile(filePath, data);
  }

  // OpenClaw config operations
  readOpenClawConfig() {
    return this.readConfig(config.CONFIG_OPENCLAW_PATH);
  }

  writeOpenClawConfig(data) {
    this.writeConfig(config.CONFIG_OPENCLAW_PATH, data);
  }

  // SPQA config operations
  readSPQAConfig() {
    return this.readConfig(config.CONFIG_SPQA_PATH);
  }

  writeSPQAConfig(data) {
    this.writeConfig(config.CONFIG_SPQA_PATH, data);
  }

  // Theme operations
  readTheme() {
    if (!fs.existsSync(config.THEME_PATH)) {
      return { roles: {} };
    }
    return this.readFile(config.THEME_PATH);
  }

  // Directory listing and file operations
  listFiles(dirPath, options = {}) {
    const { extension = null, recursive = false } = options;

    if (!fs.existsSync(dirPath)) {
      return [];
    }

    const files = [];
    const entries = fs.readdirSync(dirPath);

    entries.forEach((entry) => {
      const fullPath = path.join(dirPath, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isFile()) {
        if (!extension || path.extname(entry) === extension) {
          files.push({
            name: entry,
            path: fullPath,
            size: stat.size,
            mtime: stat.mtime,
          });
        }
      } else if (recursive && stat.isDirectory()) {
        files.push(...this.listFiles(fullPath, options));
      }
    });

    return files;
  }

  // Read agent files
  readAgentFiles(agentId) {
    const agentDir = path.join(config.SPQA_HOME, 'agents', agentId);

    if (!fs.existsSync(agentDir)) {
      return null;
    }

    const agent = {
      id: agentId,
      files: {},
    };

    const filePatterns = ['SOUL.md', 'AGENTS.md', 'INSTRUCTIONS.md', '*.yaml', '*.yml'];

    filePatterns.forEach((pattern) => {
      const ext = path.extname(pattern);
      const files = this.listFiles(agentDir);

      files.forEach((file) => {
        if (pattern === file.name || (ext && path.extname(file.path) === ext)) {
          try {
            agent.files[file.name] = fs.readFileSync(file.path, 'utf8');
          } catch (error) {
            console.error(`Failed to read ${file.path}:`, error);
          }
        }
      });
    });

    return agent;
  }

  // List active tasks
  listActiveTasks() {
    const tasks = [];
    const taskFiles = this.listFiles(config.ACTIVE_TASKS_PATH, { extension: '.yaml' });

    taskFiles.forEach((file) => {
      try {
        const data = this.readFile(file.path);
        tasks.push({
          id: path.basename(file.name, '.yaml'),
          ...data,
          filePath: file.path,
        });
      } catch (error) {
        console.error(`Failed to read task ${file.path}:`, error);
      }
    });

    return tasks;
  }

  // List mercenary tasks
  listMercenaryTasks() {
    const tasks = [];
    const taskFiles = this.listFiles(config.MERCENARY_TASKS_PATH, { extension: '.yaml' });

    taskFiles.forEach((file) => {
      try {
        const data = this.readFile(file.path);
        tasks.push({
          id: path.basename(file.name, '.yaml'),
          ...data,
          filePath: file.path,
        });
      } catch (error) {
        console.error(`Failed to read task ${file.path}:`, error);
      }
    });

    return tasks;
  }

  // Get all tasks (active + mercenary)
  getAllTasks() {
    return {
      active: this.listActiveTasks(),
      mercenary: this.listMercenaryTasks(),
    };
  }

  // List sessions
  listSessions() {
    const sessions = [];
    const sessionFiles = this.listFiles(config.SESSIONS_PATH, { extension: '.json', recursive: true });

    sessionFiles.forEach((file) => {
      try {
        const data = this.readFile(file.path);
        sessions.push({
          key: path.basename(file.name, '.json'),
          ...data,
        });
      } catch (error) {
        console.error(`Failed to read session ${file.path}:`, error);
      }
    });

    return sessions;
  }

  // Watch directory for changes
  watchDirectory(dirPath, callback, options = {}) {
    const { debounce = config.FILE_WATCH_DEBOUNCE } = options;

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (this.watchers.has(dirPath)) {
      return;
    }

    const watcher = chokidar.watch(dirPath, {
      ignored: /(^|[\/\\])\./,
      persistent: true,
    });

    const debouncedCallback = (eventType, filePath) => {
      const timer = this.debounceTimers.get(dirPath);
      if (timer) {
        clearTimeout(timer);
      }

      this.debounceTimers.set(
        dirPath,
        setTimeout(() => {
          callback(eventType, filePath);
          this.debounceTimers.delete(dirPath);
        }, debounce),
      );
    };

    watcher.on('add', (filePath) => debouncedCallback('add', filePath));
    watcher.on('change', (filePath) => debouncedCallback('change', filePath));
    watcher.on('unlink', (filePath) => debouncedCallback('delete', filePath));

    this.watchers.set(dirPath, watcher);
  }

  // Unwatch directory
  unwatchDirectory(dirPath) {
    const watcher = this.watchers.get(dirPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(dirPath);
    }
  }

  // Clean up all watchers
  cleanup() {
    this.watchers.forEach((watcher) => {
      watcher.close();
    });
    this.watchers.clear();
    this.debounceTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.debounceTimers.clear();
  }
}

module.exports = new FileManager();
