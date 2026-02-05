/**
 * Cross-platform port killer script
 * Works on both Windows and Unix-like systems
 */

const { execSync } = require('child_process');

const port = process.argv[2] || 5175;

try {
  if (process.platform === 'win32') {
    // Windows: use netstat + taskkill
    try {
      const result = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
        encoding: 'utf8',
      });
      const lines = result.trim().split('\n');
      const pids = new Set();

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          pids.add(pid);
        }
      }

      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`Killed process ${pid} on port ${port}`);
        } catch {
          // Process may have already exited
        }
      }
    } catch {
      // No process found on port - this is fine
    }
  } else {
    // Unix: use lsof
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, {
      stdio: 'ignore',
    });
  }
} catch {
  // Silent fail - port is free
}
